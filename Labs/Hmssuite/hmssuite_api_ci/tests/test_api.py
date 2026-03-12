import os

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_hf_samples_fallback_or_remote():
    os.environ["HF_SAMPLES_DISABLED"] = "1"
    response = client.get("/api/v1/samples/hf?limit=1")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert len(payload["items"]) == 1


def test_diagnose_labs():
    sample = {
        "request_id": "test-001",
        "source_system": "hmssuite",
        "patient": {
            "patient_id": "P1",
            "mrn": "MRN1",
            "name": "Jane Doe",
            "dob": "1980-01-01",
            "sex": "F"
        },
        "encounter": {
            "encounter_id": "ENC1",
            "collected_at": "2026-03-12T10:00:00Z",
            "department": "Emergency"
        },
        "labs": [
            {
                "test_code": "718-7",
                "test_name": "Hemoglobin",
                "value": 9.8,
                "unit": "g/dL",
                "reference_range": "12.0-16.0",
                "abnormal_flag": "L"
            }
        ],
        "options": {
            "include_recommendations": True,
            "include_normal_labs": False
        }
    }

    response = client.post("/api/v1/diagnose/labs", json=sample)
    assert response.status_code == 200

    body = response.json()
    assert body["request_id"] == "test-001"
    assert body["status"] == "completed"
    assert "summary" in body
    assert "key_findings" in body
    assert len(body["key_findings"]) >= 1


def test_diagnose_labs_reconciliation_rule_based():
    sample = {
        "request_id": "test-002",
        "source_system": "hmssuite",
        "patient": {
            "patient_id": "P2",
            "mrn": "MRN2",
            "name": "John Doe",
            "dob": "1977-01-01",
            "sex": "M"
        },
        "encounter": {
            "encounter_id": "ENC2",
            "collected_at": "2026-03-12T10:00:00Z",
            "department": "Emergency"
        },
        "labs": [
            {
                "test_code": "718-7",
                "test_name": "Hemoglobin",
                "value": 8.4,
                "unit": "g/dL",
                "reference_range": "12.0-16.0",
                "abnormal_flag": "L"
            }
        ],
        "radiology_reports": [
            {
                "modality": "CT",
                "body_part": "Head",
                "impression_text": "Acute infarct in left MCA territory. No hemorrhage.",
                "findings_text": None,
                "source": "uploaded-report"
            }
        ],
        "patient_llm_questions": [
            "ChatGPT says this might be stroke and life threatening."
        ],
        "external_llm_output_text": "Possible stroke. Consider urgent care.",
        "options": {
            "include_recommendations": True,
            "include_normal_labs": False
        }
    }

    response = client.post("/api/v1/diagnose/labs", json=sample)
    assert response.status_code == 200

    body = response.json()
    assert body["llm_extractor_used"] is False
    assert isinstance(body["extracted_claims"], list)
    assert isinstance(body["claim_reconciliation"], list)
    assert len(body["extracted_claims"]) >= 2
    assert any(item["status"] in {"match", "missing_in_hms", "needs_clinical_correlation", "contradiction"} for item in body["claim_reconciliation"])


def test_diagnose_mismatches_endpoint():
    sample = {
        "request_id": "test-003",
        "source_system": "hmssuite",
        "patient": {
            "patient_id": "P3",
            "mrn": "MRN3",
            "name": "Mismatch Case",
            "dob": "1990-01-01",
            "sex": "F"
        },
        "encounter": {
            "encounter_id": "ENC3",
            "collected_at": "2026-03-12T10:00:00Z",
            "department": "Emergency"
        },
        "labs": [
            {
                "test_code": "2345-7",
                "test_name": "Glucose",
                "value": 210,
                "unit": "mg/dL",
                "reference_range": "70-140",
                "abnormal_flag": "H"
            }
        ],
        "radiology_reports": [
            {
                "modality": "CT",
                "body_part": "Head",
                "impression_text": "No hemorrhage. Acute infarct in left MCA territory.",
                "findings_text": None,
                "source": "uploaded-report"
            }
        ],
        "patient_llm_questions": [
            "Groq says this is life threatening and maybe cancer."
        ],
        "options": {
            "include_recommendations": True,
            "include_normal_labs": False
        }
    }

    response = client.post("/api/v1/diagnose/mismatches", json=sample)
    assert response.status_code == 200

    body = response.json()
    assert "analysis_id" in body
    assert "mismatch_count" in body
    assert isinstance(body["items"], list)
    assert body["mismatch_count"] == len(body["items"])
    assert all(item["status"] in {"contradiction", "missing_in_hms"} for item in body["items"])
