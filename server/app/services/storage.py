"""Private local storage adapter for development and staging tests."""

from __future__ import annotations

import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


async def store_private_upload(
    upload: UploadFile,
    *,
    case_id: str,
    root: str,
) -> tuple[str, str, int, str]:
    """Store an upload under a generated key, never under its original name."""

    original_name = Path(upload.filename or "").name
    suffix = Path(original_name).suffix.lower()
    if not original_name or suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Bestandstype niet toegestaan")

    content = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Bestand is groter dan 10 MB")
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Leeg bestand is niet toegestaan")

    digest = hashlib.sha256(content).hexdigest()
    storage_key = f"cases/{case_id}/{uuid4().hex}{suffix}"
    destination = Path(root).resolve() / storage_key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    return original_name, storage_key, len(content), digest
