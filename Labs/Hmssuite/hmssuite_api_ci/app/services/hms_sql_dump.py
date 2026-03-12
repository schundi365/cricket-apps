from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, UTC
from pathlib import Path
import os


@dataclass
class HmsPatient:
    patient_id: str
    name: str
    sex: str | None
    dob: str | None


@dataclass
class HmsLab:
    test_id: int
    test_name: str
    test_code: str
    attribute_name: str
    value: float | None
    unit: str
    reference_range: str | None
    abnormal_flag: str | None
    collected_at: str
    is_critical: bool


@dataclass
class HmsMedication:
    drug_id: int | None
    drug_name: str
    generic_name: str | None
    dosage: str | None
    frequency: str | None
    number_of_days: int | None
    source: str


class HmsSqlDumpRepository:
    _cache: dict[str, list[list[str | None]]] = {}

    # Column ordering matches CREATE TABLE definitions in hms_suite.sql
    _columns = {
        "patient_registration": [
            "Patient_Id", "hospital_id", "salutation", "First_Name", "Last_Name", "Middle_Name",
            "Gender", "State_Id", "District_Id", "Taluka", "Address", "Pincode", "Contact_Number",
            "Email_Id", "Kin_First_Name", "Kin_Last_Name", "Kin_Relation", "Kin_Contact_Number",
            "Registered_By", "Regirtation_Date", "DateOfBirth", "First_NameM", "Middle_NameM", "Last_NameM",
            "AdharCard", "photoIMG", "UIDName", "UIDNo", "marital_status", "Food_Habbits",
            "patient_occupation", "patient_current_salary", "Other_Info", "Spouse_Information",
            "PatientSuite_Access", "PDF_File_Location",
        ],
        "patient_pathology_details": [
            "ID", "hospital_id", "Patient_Id", "Admission_Visit_Id", "Dr_Id", "Test_id", "Test_Date",
            "IPD_OPD_Flag", "Status", "Lab_Assistant_Comments", "Doctor_Notification_Status",
            "Notification_Sent_date", "Notification_Attended_Date", "Notification_Comments", "report_path",
            "Test_result", "IPDRound_Id", "XRayUniqueId", "Speciment_Collected_Date", "Billing_Number",
            "updatedBy", "Update_Date", "Charges", "Specimen_Id", "investigations_correlation_Id",
            "PatientInTime", "PDF_File_Location",
        ],
        "patient_pathology_result_details": [
            "result_id", "patient_patho_id", "patient_id", "test_id", "subheader_id", "Attribute_id",
            "result_value", "Normal_range", "is_Highlighted", "Is_Critical",
        ],
        "pathology_master": [
            "Test_id", "Test_Rate", "hospital_id", "Description", "Test_Performing_Method",
            "Normal_Range", "Unit", "Category", "Is_Active", "Billing_Units_Allowed",
        ],
        "pathology_attrubute_master": [
            "Attribute_id", "SubHeader_Id", "Attribute_Name", "Unit", "Normal_Range", "Other_Details",
            "IsActive",
        ],
        "patient_prescription_details": [
            "Prescription_id", "Prescription_date", "drug_id", "dosage", "unit", "number_of_days", "patient_id",
            "admission_id", "morning", "noon", "evening", "sos", "before_after_flag", "Instruction_Id",
            "PharmacyPricription_Issued_Updatedby", "PharmacyPricription_Issued_UpdatedDate",
            "Pharmacy_Pricription_issued_flag",
        ],
        "patient_previous_medication": [
            "Id", "patient_id", "drug_id", "morning", "noon", "evening", "sos", "dosage", "updated_By",
            "updated_date", "Generic_Drug_Name",
        ],
        "drug_master": [
            "Drug_Id", "Drug_Name", "Drug_Type", "hospital_id", "NoOfDays", "morning", "noon", "evening",
            "sos", "Generic_Name", "Instructions", "Is_Active",
        ],
        "patient_drug_allergies_details": [
            "Id", "patientId", "allergiesdrug", "updated_By", "updated_date",
        ],
    }

    def __init__(self, sql_dump_path: str | None = None):
        default_path = Path(__file__).resolve().parents[3] / "hms_suite SQL Server" / "hms_suite.sql"
        self.sql_dump_path = Path(sql_dump_path or os.getenv("HMS_SQL_DUMP_PATH", str(default_path)))

    def is_available(self) -> bool:
        return self.sql_dump_path.exists()

    def _sql_to_python(self, token: str) -> str | None:
        tok = token.strip()
        if not tok or tok.upper() == "NULL":
            return None
        if tok.startswith("b'") and tok.endswith("'"):
            return tok[2:-1]
        if tok.startswith("'") and tok.endswith("'"):
            inner = tok[1:-1]
            inner = inner.replace("\\'", "'").replace("\\\\", "\\").replace("\\r", "\r").replace("\\n", "\n")
            return inner
        return tok

    def _split_tuple_fields(self, tuple_text: str) -> list[str | None]:
        fields: list[str] = []
        buf: list[str] = []
        in_quote = False
        i = 0
        while i < len(tuple_text):
            ch = tuple_text[i]
            if ch == "'":
                if i > 0 and tuple_text[i - 1] == "\\":
                    buf.append(ch)
                else:
                    in_quote = not in_quote
                    buf.append(ch)
            elif ch == "," and not in_quote:
                fields.append("".join(buf).strip())
                buf = []
            else:
                buf.append(ch)
            i += 1
        if buf:
            fields.append("".join(buf).strip())
        return [self._sql_to_python(f) for f in fields]

    def _extract_tuples(self, values_chunk: str) -> list[list[str | None]]:
        rows: list[list[str | None]] = []
        start = -1
        in_quote = False
        depth = 0
        i = 0
        while i < len(values_chunk):
            ch = values_chunk[i]
            if ch == "'":
                if i == 0 or values_chunk[i - 1] != "\\":
                    in_quote = not in_quote
            elif not in_quote:
                if ch == "(":
                    if depth == 0:
                        start = i + 1
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0 and start >= 0:
                        rows.append(self._split_tuple_fields(values_chunk[start:i]))
                        start = -1
            i += 1
        return rows

    def _load_table(self, table_name: str) -> list[list[str | None]]:
        if table_name in self._cache:
            return self._cache[table_name]

        if not self.is_available():
            self._cache[table_name] = []
            return []

        rows: list[list[str | None]] = []
        marker = f"INSERT INTO `{table_name}` VALUES"
        collecting = False
        chunk_parts: list[str] = []

        with self.sql_dump_path.open("r", encoding="utf-8", errors="ignore") as handle:
            for line in handle:
                if not collecting and marker in line:
                    collecting = True
                    chunk_parts = [line.split("VALUES", 1)[1]]
                    if line.rstrip().endswith(";"):
                        collecting = False
                        rows.extend(self._extract_tuples("".join(chunk_parts).rstrip(";\n")))
                        chunk_parts = []
                elif collecting:
                    chunk_parts.append(line)
                    if line.rstrip().endswith(";"):
                        collecting = False
                        rows.extend(self._extract_tuples("".join(chunk_parts).rstrip(";\n")))
                        chunk_parts = []

        self._cache[table_name] = rows
        return rows

    def _rows_as_dicts(self, table_name: str) -> list[dict[str, str | None]]:
        columns = self._columns[table_name]
        mapped: list[dict[str, str | None]] = []
        for row in self._load_table(table_name):
            if len(row) < len(columns):
                row = row + [None] * (len(columns) - len(row))
            mapped.append(dict(zip(columns, row[: len(columns)])))
        return mapped

    def _safe_int(self, raw: str | None) -> int | None:
        if raw is None:
            return None
        cleaned = str(raw).replace(",", "").strip()
        if not cleaned:
            return None
        try:
            return int(float(cleaned))
        except ValueError:
            return None

    def _safe_float(self, raw: str | None) -> float | None:
        if raw is None:
            return None
        cleaned = str(raw).replace(",", "").strip()
        if not cleaned:
            return None
        # Support values like "GCT : 110.2"
        for piece in cleaned.replace(":", " ").split():
            try:
                return float(piece)
            except ValueError:
                continue
        return None

    def _normalize_freq(self, row: dict[str, str | None]) -> str:
        slots: list[str] = []
        if row.get("morning") not in {None, "0", "\\0", "False", "false", ""}:
            slots.append("morning")
        if row.get("noon") not in {None, "0", "\\0", "False", "false", ""}:
            slots.append("noon")
        if row.get("evening") not in {None, "0", "\\0", "False", "false", ""}:
            slots.append("evening")
        if row.get("sos") not in {None, "0", "\\0", "False", "false", ""}:
            slots.append("sos")
        return ", ".join(slots) if slots else "as directed"

    def _normalize_patient_id(self, raw: str | None) -> str:
        if raw is None:
            return ""
        text = str(raw)
        digits = "".join(ch for ch in text if ch.isdigit())
        return digits or text.strip()

    def list_patients_with_labs(self, limit: int = 25) -> list[dict[str, str | int | None]]:
        patients = {str(row["Patient_Id"]): row for row in self._rows_as_dicts("patient_registration")}
        patho_rows = self._rows_as_dicts("patient_pathology_details")
        meds = self._rows_as_dicts("patient_prescription_details")
        result_rows = self._rows_as_dicts("patient_pathology_result_details")

        patho_patient_by_id: dict[int, str] = {}
        for row in patho_rows:
            rid = self._safe_int(row.get("ID"))
            pid = self._normalize_patient_id(row.get("Patient_Id"))
            if rid is not None and pid:
                patho_patient_by_id[rid] = pid

        processable_patient_ids: set[str] = set()
        for row in result_rows:
            patho_id = self._safe_int(row.get("patient_patho_id"))
            value = self._safe_float(row.get("result_value"))
            if patho_id is None or value is None:
                continue
            pid = patho_patient_by_id.get(patho_id)
            if pid:
                processable_patient_ids.add(pid)

        for row in patho_rows:
            pid = self._normalize_patient_id(row.get("Patient_Id"))
            if not pid:
                continue
            if self._safe_float(row.get("Test_result")) is not None:
                processable_patient_ids.add(pid)

        latest_by_patient: dict[str, dict[str, str | int | None]] = {}
        for row in patho_rows:
            patient_id = self._normalize_patient_id(row.get("Patient_Id"))
            if not patient_id or patient_id not in processable_patient_ids:
                continue
            test_date = str(row.get("Test_Date") or "")
            current = latest_by_patient.get(patient_id)
            if current is None or test_date > str(current.get("latest_lab_at") or ""):
                p = patients.get(patient_id, {})
                name = " ".join(filter(None, [p.get("First_Name"), p.get("Middle_Name"), p.get("Last_Name")])).strip()
                latest_by_patient[patient_id] = {
                    "patient_id": patient_id,
                    "mrn": patient_id,
                    "name": name or None,
                    "sex": p.get("Gender"),
                    "dob": str(p.get("DateOfBirth") or "") or None,
                    "encounter_id": str(row.get("Admission_Visit_Id") or "") or None,
                    "department": str(row.get("IPD_OPD_Flag") or "") or None,
                    "latest_lab_at": test_date or None,
                    "medication_count": 0,
                }

        med_count: dict[str, int] = {}
        for m in meds:
            pid = self._normalize_patient_id(m.get("patient_id"))
            if pid:
                med_count[pid] = med_count.get(pid, 0) + 1

        items = sorted(latest_by_patient.values(), key=lambda x: str(x.get("latest_lab_at") or ""), reverse=True)
        for it in items:
            it["medication_count"] = med_count.get(str(it["patient_id"]), 0)
        return items[:limit]

    def _drug_index(self) -> dict[int, dict[str, str | None]]:
        index: dict[int, dict[str, str | None]] = {}
        for row in self._rows_as_dicts("drug_master"):
            did = self._safe_int(row.get("Drug_Id"))
            if did is not None:
                index[did] = row
        return index

    def get_patient_snapshot(self, patient_id: str, max_lab_rows: int = 30) -> tuple[HmsPatient | None, list[HmsLab], list[HmsMedication], list[str]]:
        pid = self._normalize_patient_id(patient_id)
        patient = None
        for row in self._rows_as_dicts("patient_registration"):
            if self._normalize_patient_id(row.get("Patient_Id")) == pid:
                full_name = " ".join(filter(None, [row.get("First_Name"), row.get("Middle_Name"), row.get("Last_Name")])).strip()
                patient = HmsPatient(patient_id=pid, name=full_name or pid, sex=row.get("Gender"), dob=row.get("DateOfBirth"))
                break

        patho_details = [
            r
            for r in self._rows_as_dicts("patient_pathology_details")
            if self._normalize_patient_id(r.get("Patient_Id")) == pid
        ]
        patho_details.sort(key=lambda x: str(x.get("Test_Date") or ""), reverse=True)
        latest_details = patho_details[:max_lab_rows]
        patho_ids = {self._safe_int(r.get("ID")) for r in latest_details}
        patho_ids.discard(None)

        attr_index = {self._safe_int(a.get("Attribute_id")): a for a in self._rows_as_dicts("pathology_attrubute_master")}
        test_index = {self._safe_int(t.get("Test_id")): t for t in self._rows_as_dicts("pathology_master")}

        labs: list[HmsLab] = []
        for row in self._rows_as_dicts("patient_pathology_result_details"):
            patho_id = self._safe_int(row.get("patient_patho_id"))
            if patho_id not in patho_ids:
                continue

            test_id = self._safe_int(row.get("test_id")) or 0
            attr_id = self._safe_int(row.get("Attribute_id"))
            attr = attr_index.get(attr_id, {}) if attr_id is not None else {}
            test = test_index.get(test_id, {})

            is_critical = str(row.get("Is_Critical") or "").strip().lower() in {"true", "1", "yes"}
            highlighted = str(row.get("is_Highlighted") or "").strip().lower() in {"true", "1", "yes"}
            abnormal_flag = "H" if (is_critical or highlighted) else None

            detail_match = next((d for d in latest_details if self._safe_int(d.get("ID")) == patho_id), None)
            collected_at = str((detail_match or {}).get("Test_Date") or datetime.now(UTC).isoformat())

            value = self._safe_float(row.get("result_value"))
            unit = str(attr.get("Unit") or test.get("Unit") or "")
            test_name = str(test.get("Description") or f"Test-{test_id}")
            attr_name = str(attr.get("Attribute_Name") or test_name)
            ref = row.get("Normal_range") or attr.get("Normal_Range") or test.get("Normal_Range")

            labs.append(
                HmsLab(
                    test_id=test_id,
                    test_name=test_name,
                    test_code=f"HMS-{test_id}",
                    attribute_name=attr_name,
                    value=value,
                    unit=unit,
                    reference_range=str(ref) if ref is not None else None,
                    abnormal_flag=abnormal_flag,
                    collected_at=collected_at,
                    is_critical=is_critical,
                )
            )

        labs.sort(key=lambda x: x.collected_at, reverse=True)

        if not labs:
            for detail in latest_details:
                test_id = self._safe_int(detail.get("Test_id")) or 0
                test = test_index.get(test_id, {})
                value = self._safe_float(detail.get("Test_result"))
                if value is None:
                    continue
                test_name = str(test.get("Description") or f"Test-{test_id}")
                ref = test.get("Normal_Range")
                low_high = None
                if ref and isinstance(ref, str) and "-" in ref:
                    parts = ref.split("-", 1)
                    low = self._safe_float(parts[0])
                    high = self._safe_float(parts[1])
                    if low is not None and high is not None:
                        low_high = (low, high)
                abnormal = None
                if low_high is not None:
                    low, high = low_high
                    if value < low:
                        abnormal = "L"
                    elif value > high:
                        abnormal = "H"

                labs.append(
                    HmsLab(
                        test_id=test_id,
                        test_name=test_name,
                        test_code=f"HMS-{test_id}",
                        attribute_name=test_name,
                        value=value,
                        unit=str(test.get("Unit") or ""),
                        reference_range=str(ref) if ref is not None else None,
                        abnormal_flag=abnormal,
                        collected_at=str(detail.get("Test_Date") or datetime.now(UTC).isoformat()),
                        is_critical=False,
                    )
                )

            labs.sort(key=lambda x: x.collected_at, reverse=True)

        drug_index = self._drug_index()
        medications: list[HmsMedication] = []

        for row in self._rows_as_dicts("patient_prescription_details"):
            if self._normalize_patient_id(row.get("patient_id")) != pid:
                continue
            drug_id = self._safe_int(row.get("drug_id"))
            master = drug_index.get(drug_id or -1, {})
            name = str(master.get("Drug_Name") or f"Drug-{drug_id}" if drug_id else "Unknown Drug")
            medications.append(
                HmsMedication(
                    drug_id=drug_id,
                    drug_name=name,
                    generic_name=str(master.get("Generic_Name") or "") or None,
                    dosage=row.get("dosage"),
                    frequency=self._normalize_freq(row),
                    number_of_days=self._safe_int(row.get("number_of_days")),
                    source="patient_prescription_details",
                )
            )

        for row in self._rows_as_dicts("patient_previous_medication"):
            if self._normalize_patient_id(row.get("patient_id")) != pid:
                continue
            drug_id = self._safe_int(row.get("drug_id"))
            master = drug_index.get(drug_id or -1, {})
            name = str(master.get("Drug_Name") or f"Drug-{drug_id}" if drug_id else "Unknown Drug")
            medications.append(
                HmsMedication(
                    drug_id=drug_id,
                    drug_name=name,
                    generic_name=row.get("Generic_Drug_Name") or master.get("Generic_Name"),
                    dosage=row.get("dosage"),
                    frequency=self._normalize_freq(row),
                    number_of_days=None,
                    source="patient_previous_medication",
                )
            )

        allergies: list[str] = []
        for row in self._rows_as_dicts("patient_drug_allergies_details"):
            rid = self._normalize_patient_id(row.get("patientId"))
            if not rid:
                continue
            if rid != pid:
                continue
            allergy = str(row.get("allergiesdrug") or "").strip()
            if allergy:
                allergies.append(allergy)

        return patient, labs, medications, sorted(set(allergies))
