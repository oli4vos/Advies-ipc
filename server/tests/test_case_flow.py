from sqlalchemy import func, select

from app import models


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
    "external_ai_answer": "Een externe AI zei zonder bron dat er niets hoeft te gebeuren.",
}


def test_full_intake_publish_and_jobboard_flow(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD)
    assert created.status_code == 201, created.text
    case = created.json()
    case_id = case["id"]

    assert case["status"] == "PENDING_REVIEW"
    assert case["original_description"].startswith("Mijn naam")
    assert "jan@example.nl" not in case["anonymized_description"]
    assert case["external_ai_answer"].startswith("Een externe AI")
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
    assert blocked_publish.status_code == 409

    confirmed = client.post(f"/api/v1/cases/{case_id}/confirm-structure")
    assert confirmed.status_code == 200
    assert all(fact["customer_confirmation"] == "CONFIRMED" for fact in confirmed.json()["facts"])

    published = client.post(f"/api/v1/admin/cases/{case_id}/publish")
    assert published.status_code == 200
    assert published.json()["status"] == "PUBLISHED"

    board = client.get("/api/v1/jobboard")
    assert board.status_code == 200
    assert [item["id"] for item in board.json()] == [case_id]
    assert "jan@example.nl" not in board.text

    public_detail = client.get(f"/api/v1/jobboard/{case_id}")
    assert public_detail.status_code == 200
    assert public_detail.json()["original_description"] is None
    assert "jan@example.nl" not in public_detail.text

    audit = client.get("/api/v1/admin/audit-logs")
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


def test_claim_selection_payment_and_expert_review_flow(client) -> None:
    created = client.post("/api/v1/cases", json=PAYLOAD).json()
    case_id = created["id"]
    client.post(f"/api/v1/cases/{case_id}/confirm-structure")
    client.post(f"/api/v1/admin/cases/{case_id}/publish")

    claim = client.post(
        f"/api/v1/cases/{case_id}/claims",
        json={"message": "Ik kan deze casus binnen één werkdag beoordelen."},
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
    )
    assert reviewed.status_code == 200, reviewed.text
    final_case = reviewed.json()
    assert final_case["status"] == "DELIVERED"
    assert final_case["reviews"][0]["items"][0]["verdict"] == "PARTIALLY_CORRECT"
    assert any(
        record["origin_type"] == "HUMAN_FEEDBACK" for record in final_case["provenance"]
    )

    audit = client.get("/api/v1/admin/audit-logs").json()
    assert {entry["action"] for entry in audit} >= {
        "EXPERT_CLAIM_CREATED",
        "EXPERT_SELECTED",
        "MOCK_PAYMENT_PAID",
        "EXPERT_REVIEW_SUBMITTED",
    }
