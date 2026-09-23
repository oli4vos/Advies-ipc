from sqlalchemy import func, select

from app import models


ADVISOR_HEADERS = {"Authorization": "Bearer demo-advisor"}
ADMIN_HEADERS = {"Authorization": "Bearer demo-admin"}
SECOND_CUSTOMER_HEADERS = {"Authorization": "Bearer demo-customer-2"}


PAYLOAD = {
    "title": "Twee werkgevers en loonheffingskorting",
    "description": (
        "Mijn naam is Jan de Vries en mijn e-mail is jan@example.nl. "
        "Ik werk in 2025 bij twee werkgevers en op beide loonstroken staat loonheffingskorting. "
        "Werkgever: Voorbeeldbedrijf BV. Ik wil weten of ik moet bijbetalen."
    ),
    "question": "Welke actie moet ik richting mijn werkgevers nemen?",
    "category": "Loonheffingen",
    "tax_year": "2025",
    "client_type": "Particulier",
    "urgency": "Normaal",
    "external_ai_answer": (
        "Volgens jan@example.nl hoeft er niets te gebeuren. "
        "Een externe AI vermeldde geen bron."
    ),
}


def test_full_intake_publish_and_jobboard_flow(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD)
    assert created.status_code == 201, created.text
    case = created.json()
    case_id = case["id"]

    assert case["status"] == "PENDING_REVIEW"
    assert case["original_description"].startswith("Mijn naam")
    assert "jan@example.nl" not in case["anonymized_description"]
    assert "jan@example.nl" in case["external_ai_answer"]
    assert {item["origin_type"] for item in case["provenance"]} >= {
        "CUSTOMER",
        "EXTERNAL_AI",
        "PLATFORM_AI",
        "SYSTEM_RULE",
        "IMPORTED_SOURCE",
    }
    assert case["ai_executions"][0]["provider"] == "mock-local"
    assert case["sources"][0]["demo_only"] is True

    blocked_publish = client.post(f"/api/v1/admin/cases/{case_id}/publish")
    assert blocked_publish.status_code == 403

    confirmed = client.post(
        f"/api/v1/cases/{case_id}/confirm-structure",
        json={"anonymisation_confirmed": True},
    )
    assert confirmed.status_code == 200
    assert all(fact["customer_confirmation"] == "CONFIRMED" for fact in confirmed.json()["facts"])

    published = client.post(f"/api/v1/admin/cases/{case_id}/publish", headers=ADMIN_HEADERS)
    assert published.status_code == 200
    assert published.json()["status"] == "PUBLISHED"

    board = client.get("/api/v1/jobboard", headers=ADVISOR_HEADERS)
    assert board.status_code == 200
    assert [item["id"] for item in board.json()] == [case_id]
    assert "jan@example.nl" not in board.text

    public_detail = client.get(f"/api/v1/jobboard/{case_id}", headers=ADVISOR_HEADERS)
    assert public_detail.status_code == 200
    assert public_detail.json()["original_description"] is None
    assert "jan@example.nl" not in public_detail.text
    assert "jan@example.nl" not in public_detail.json()["external_ai_answer"]

    audit = client.get("/api/v1/admin/audit-logs", headers=ADMIN_HEADERS)
    assert {entry["action"] for entry in audit.json()} >= {
        "CASE_CREATED",
        "CASE_STRUCTURE_CONFIRMED",
        "CASE_PUBLISHED",
    }


def test_case_persists_across_database_sessions(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD).json()
    session_factory = client.testing_session

    with session_factory() as first_session:
        first_count = first_session.scalar(select(func.count(models.Case.id)))
    with session_factory() as restarted_session:
        persisted = restarted_session.get(models.Case, created["id"])

    assert first_count == 1
    assert persisted is not None
    assert persisted.public_code == created["public_code"]


def test_customer_must_confirm_anonymisation_before_structure_confirmation(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD).json()
    case_id = created["id"]

    blocked = client.post(f"/api/v1/cases/{case_id}/confirm-structure")
    assert blocked.status_code == 422
    assert "anonimise" in blocked.json()["detail"]

    confirmed = client.post(
        f"/api/v1/cases/{case_id}/confirm-structure",
        json={"anonymisation_confirmed": True},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "PENDING_REVIEW"


def test_claim_selection_payment_and_expert_review_flow(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD).json()
    case_id = created["id"]
    client.post(
        f"/api/v1/cases/{case_id}/confirm-structure",
        json={"anonymisation_confirmed": True},
    )
    client.post(f"/api/v1/admin/cases/{case_id}/publish", headers=ADMIN_HEADERS)

    claim = client.post(
        f"/api/v1/cases/{case_id}/claims",
        json={"message": "Ik kan deze casus binnen één werkdag beoordelen."},
        headers=ADVISOR_HEADERS,
    )
    assert claim.status_code == 201, claim.text
    assert claim.json()["status"] == "PENDING_CUSTOMER"

    selected = client.post(
        f"/api/v1/cases/{case_id}/claims/{claim.json()['id']}/select"
    )
    assert selected.status_code == 200, selected.text
    assert selected.json()["status"] == "AWAITING_PAYMENT"
    assert selected.json()["payment"]["status"] == "PENDING"

    paid = client.post(f"/api/v1/cases/{case_id}/pay")
    assert paid.status_code == 200, paid.text
    assert paid.json()["status"] == "PAID"
    assert paid.json()["payment"]["status"] == "PAID"

    reviewed = client.post(
        f"/api/v1/cases/{case_id}/review",
        json={
            "final_answer": (
                "Laat de loonheffingskorting slechts bij één werkgever toepassen "
                "en controleer het effect in de aangifte."
            ),
            "notes": "De adviseur heeft de conceptanalyse gecontroleerd.",
            "items": [
                {
                    "dimension": "Feiten",
                    "verdict": "PARTIALLY_CORRECT",
                    "comment": "Controleer de loonstroken van beide werkgevers.",
                }
            ],
        },
        headers=ADVISOR_HEADERS,
    )
    assert reviewed.status_code == 200, reviewed.text
    final_case = reviewed.json()
    assert final_case["status"] == "DELIVERED"
    assert final_case["reviews"][0]["items"][0]["verdict"] == "PARTIALLY_CORRECT"
    assert any(
        record["origin_type"] == "HUMAN_FEEDBACK" for record in final_case["provenance"]
    )

    audit = client.get("/api/v1/admin/audit-logs", headers=ADMIN_HEADERS).json()
    assert {entry["action"] for entry in audit} >= {
        "EXPERT_CLAIM_CREATED",
        "EXPERT_SELECTED",
        "MOCK_PAYMENT_PAID",
        "EXPERT_REVIEW_SUBMITTED",
    }


def test_fee_only_increases_for_platform_approved_required_information(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD).json()
    case_id = created["id"]
    client.post(
        f"/api/v1/cases/{case_id}/confirm-structure",
        json={"anonymisation_confirmed": True},
    )
    client.post(f"/api/v1/admin/cases/{case_id}/publish", headers=ADMIN_HEADERS)
    claim = client.post(f"/api/v1/cases/{case_id}/claims", json={}, headers=ADVISOR_HEADERS).json()
    client.post(f"/api/v1/cases/{case_id}/claims/{claim['id']}/select")
    paid = client.post(f"/api/v1/cases/{case_id}/pay").json()
    base_fee = paid["offered_fee_cents"]

    request = client.post(
        f"/api/v1/cases/{case_id}/information-requests",
        json={
            "question": "Kun je de loonstroken van beide werkgevers aanleveren?",
            "estimated_extra_minutes": 20,
        },
        headers=ADVISOR_HEADERS,
    )
    assert request.status_code == 201, request.text
    info = request.json()
    assert info["required_for_assessment"] is True
    assert info["evaluation_origin"] == "RULE_ENGINE"
    assert info["status"] == "PENDING_PLATFORM_REVIEW"
    assert info["proposed_fee_delta_cents"] == 3000
    assert info["approved_fee_delta_cents"] == 0

    waiting_for_platform = client.get(f"/api/v1/cases/{case_id}").json()
    assert waiting_for_platform["status"] == "PAID"
    assert waiting_for_platform["offered_fee_cents"] == base_fee

    unauthorised_decision = client.post(
        f"/api/v1/admin/cases/{case_id}/information-requests/{info['id']}/decision",
        json={"approve": True, "approved_fee_delta_cents": 3000},
    )
    assert unauthorised_decision.status_code == 403
    approved = client.post(
        f"/api/v1/admin/cases/{case_id}/information-requests/{info['id']}/decision",
        json={
            "approve": True,
            "approved_fee_delta_cents": 3000,
            "decision_note": "De loonstroken zijn nodig om de korting verantwoord te beoordelen.",
        },
        headers=ADMIN_HEADERS,
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "NEEDS_INFORMATION"
    assert approved.json()["information_requests"][-1]["status"] == "PENDING_CUSTOMER"
    assert approved.json()["information_requests"][-1]["approved_fee_delta_cents"] == 3000

    answered = client.post(
        f"/api/v1/cases/{case_id}/information-requests/{info['id']}/answer",
        json={"answer": "Ik lever beide loonstroken van 2025 aan."},
    )
    assert answered.status_code == 200, answered.text
    accepted = client.post(
        f"/api/v1/cases/{case_id}/information-requests/{info['id']}/accept-fee"
    )
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "AWAITING_INFORMATION_PAYMENT"
    assert accepted.json()["payment"]["amount_cents"] == 3000

    paid_extra = client.post(f"/api/v1/cases/{case_id}/pay")
    assert paid_extra.status_code == 200, paid_extra.text
    assert paid_extra.json()["status"] == "IN_REVIEW"
    assert paid_extra.json()["payment"]["payment_type"] == "INFORMATION_REQUEST"

    not_required = client.post(
        f"/api/v1/cases/{case_id}/information-requests",
        json={"question": "Kun je ook wat algemene achtergrond geven?"},
        headers=ADVISOR_HEADERS,
    )
    assert not_required.status_code == 201, not_required.text
    assert not_required.json()["required_for_assessment"] is False
    assert not_required.json()["approved_fee_delta_cents"] == 0


def test_role_boundary_prevents_cross_case_access(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD)
    case_id = created.json()["id"]

    assert client.get(f"/api/v1/cases/{case_id}", headers=SECOND_CUSTOMER_HEADERS).status_code == 403
    assert client.get(f"/api/v1/cases/{case_id}", headers=ADVISOR_HEADERS).status_code == 403
    assert client.get("/api/v1/admin/audit-logs").status_code == 403
    assert client.get("/api/v1/jobboard").status_code == 403
    assert client.get("/api/v1/cases").status_code == 200
