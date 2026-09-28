from app.config import get_settings


PAYLOAD = {
    "title": "Lokale documenttest",
    "description": "Ik wil een fictieve btw-vraag met een document laten beoordelen.",
    "question": "Kan dit document lokaal aan mijn casus worden gekoppeld?",
    "category": "Btw",
    "tax_year": "2025",
    "client_type": "Eenmanszaak",
    "urgency": "Normaal",
    "external_ai_answer": "",
}


def test_customer_upload_is_private_and_metadata_is_exposed_without_path(client, tmp_path, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "storage_path", str(tmp_path / "private"))

    created = client.post("/api/v1/cases", json=PAYLOAD).json()
    response = client.post(
        f"/api/v1/cases/{created['id']}/attachments",
        files={"file": ("aangifte.txt", b"fictieve inhoud", "text/plain")},
    )

    assert response.status_code == 201, response.text
    attachment = response.json()
    assert attachment["original_name"] == "aangifte.txt"
    assert attachment["size_bytes"] == len(b"fictieve inhoud")
    assert attachment["scan_status"] == "CLEARED"
    assert attachment["sha256"]
    assert list((tmp_path / "private").rglob("*"))
    assert "aangifte.txt" not in str(next((tmp_path / "private").rglob("*")))

    detail = client.get(f"/api/v1/cases/{created['id']}")
    assert detail.status_code == 200
    assert detail.json()["attachments"][0]["original_name"] == "aangifte.txt"

    downloaded = client.get(
        f"/api/v1/cases/{created['id']}/attachments/{attachment['id']}"
    )
    assert downloaded.status_code == 200
    assert downloaded.content == b"fictieve inhoud"


def test_upload_rejects_unsupported_extension(client, tmp_path, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "storage_path", str(tmp_path / "private"))
    created = client.post("/api/v1/cases", json=PAYLOAD).json()

    response = client.post(
        f"/api/v1/cases/{created['id']}/attachments",
        files={"file": ("malware.exe", b"not executable", "application/octet-stream")},
    )

    assert response.status_code == 415
    private_root = tmp_path / "private"
    assert not any(path.is_file() for path in private_root.rglob("*"))


def test_local_scanner_rejects_eicar_test_signature(client, tmp_path, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "storage_path", str(tmp_path / "private"))
    created = client.post("/api/v1/cases", json=PAYLOAD).json()

    response = client.post(
        f"/api/v1/cases/{created['id']}/attachments",
        files={"file": ("eicar.txt", b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE", "text/plain")},
    )

    assert response.status_code == 422
    assert "EICAR" in response.json()["detail"]
    private_root = tmp_path / "private"
    assert not any(path.is_file() for path in private_root.rglob("*"))
