from app.services.anonymisation import anonymise


def test_anonymises_supported_personal_identifiers() -> None:
    result = anonymise(
        "Mijn naam is Jan de Vries. Mail jan@example.nl of bel 06-12345678. "
        "Ik woon aan Kerkstraat 12, 1234 AB. BSN: 123456789, KvK: 12345678 "
        "en IBAN NL91 ABNA 0417 1643 00. Werkgever: Voorbeeldbedrijf BV."
    )

    assert "jan@example.nl" not in result.text
    assert "06-12345678" not in result.text
    assert "1234 AB" not in result.text
    assert "123456789" not in result.text
    assert "NL91 ABNA" not in result.text
    assert "Voorbeeldbedrijf" not in result.text
    assert "[PERSOON]" in result.text
    assert "[E-MAIL]" in result.text
    assert result.entity_counts["EMAIL"] == 1
    assert result.entity_counts["BSN"] == 1


def test_anonymises_a_named_employee_without_consuming_the_sentence() -> None:
    result = anonymise(
        "Mijn fictieve medewerker Jan Test werkt bij bedrijfsnaam: Voorbeeld BV."
    )

    assert "Jan Test" not in result.text
    assert "werkt bij" in result.text
    assert result.text.startswith("Mijn fictieve medewerker [PERSOON] werkt bij")
    assert result.entity_counts["PERSON"] == 1


def test_anonymises_free_form_name_and_company_markers() -> None:
    result = anonymise(
        "Ik heet Sophie Jansen. Mijn bedrijfsnaam is Noordster Advies BV. "
        "De contactpersoon: Peter de Wit belt later terug."
    )

    assert "Sophie Jansen" not in result.text
    assert "Noordster Advies BV" not in result.text
    assert "Peter de Wit" not in result.text
    assert "[PERSOON]" in result.text
    assert "[BEDRIJF]" in result.text
    assert result.entity_counts["PERSON"] == 2
    assert result.entity_counts["COMPANY"] == 1
