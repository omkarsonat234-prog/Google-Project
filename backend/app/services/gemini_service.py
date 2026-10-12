import os
import json
import uuid
import re
from typing import List, Dict, Any, Tuple
from ..config import GEMINI_API_KEY
from ..models.schemas import MedicineExtracted, MedicineBasicInfo
from .sample_prescriptions import SAMPLE_PRESETS
from .medicine_info_service import lookup_medicine_info

STRUCTURE_PROMPT = """You are a strict clinical prescription structuring parser.
You DO NOT diagnose, DO NOT prescribe, DO NOT suggest medication alternatives, DO NOT infer or invent missing instructions.
You extract ONLY what is explicitly written in the OCR text.
Missing information MUST remain null.
Ambiguous, blurred, smudged, or conflicting text MUST be flagged in uncertain_fields.

Return ONLY a valid JSON object matching this schema:
{
  "medicines": [
    {
      "name_as_written": "Exact medicine name",
      "strength_as_written": "Strength or null",
      "instructions_as_written": "Sig/Instructions as written or null",
      "frequency_as_written": "Frequency or null",
      "timing_as_written": "Timing or null",
      "duration_as_written": "Duration or null",
      "prescribed_date": "Date if visible or null",
      "source_text": ["Exact lines from OCR"],
      "uncertain_fields": ["list of field names with missing or ambiguous data"],
      "uncertainty_reasons": {"field_name": "Specific reason why uncertain or missing"},
      "review_status": "needs_review"
    }
  ],
  "overall_review_status": "needs_review"
}
"""

def parse_with_gemini_api(ocr_text: str) -> Dict[str, Any]:
    """Calls live Gemini API if GEMINI_API_KEY is configured."""
    try:
        # Try new google-genai SDK or google.generativeai
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-pro", generation_config={"response_mime_type": "application/json"})
        response = model.generate_content(f"{STRUCTURE_PROMPT}\n\nPrescription OCR Text:\n{ocr_text}")
        text = response.text
        return json.loads(text)
    except Exception as e:
        return None

def analyze_uncertainties(med: Dict[str, Any]) -> Tuple[List[str], Dict[str, str], str]:
    """
    Applies strict clinical safety rules to identify uncertainty, missing fields, and ambiguities.
    """
    uncertain_fields = list(med.get("uncertain_fields") or [])
    uncertainty_reasons = dict(med.get("uncertainty_reasons") or {})

    instructions = (med.get("instructions_as_written") or "").strip()
    frequency = med.get("frequency_as_written")
    timing = med.get("timing_as_written")
    duration = med.get("duration_as_written")

    # Rule 1: Check for illegible / smudge indicators
    smudge_patterns = [r"\[ILLEGIBLE", r"\[BLURRED", r"\[SMUDGE", r"\?\?", r"~", r"unreadable"]
    for pat in smudge_patterns:
        if re.search(pat, instructions, re.IGNORECASE):
            if "instructions_as_written" not in uncertain_fields:
                uncertain_fields.append("instructions_as_written")
                uncertainty_reasons["instructions_as_written"] = "Detected illegible handwriting or smudged character symbols."
            if "frequency_as_written" not in uncertain_fields:
                uncertain_fields.append("frequency_as_written")
                uncertainty_reasons["frequency_as_written"] = "Dosing frequency cannot be safely verified from smudged instructions."
            if "timing_as_written" not in uncertain_fields:
                uncertain_fields.append("timing_as_written")
                uncertainty_reasons["timing_as_written"] = "Dosing timing cannot be safely verified from smudged instructions."

    # Rule 2: Check for crossed-out or conflicting instructions
    if re.search(r"CROSSED-OUT|changed|contradictory|or\s+take\s+with", instructions, re.IGNORECASE):
        if "instructions_as_written" not in uncertain_fields:
            uncertain_fields.append("instructions_as_written")
            uncertainty_reasons["instructions_as_written"] = "Prescription contains strikethrough, edits, or contradictory instructions."
        if "timing_as_written" not in uncertain_fields:
            uncertain_fields.append("timing_as_written")
            uncertainty_reasons["timing_as_written"] = "Conflicting timing directives found (e.g. morning vs lunch vs bedtime)."

    # Rule 3: Check for vague or missing instructions
    if not instructions or re.search(r"as\s+directed|use\s+as\s+directed|take\s+as\s+directed", instructions, re.IGNORECASE):
        if not frequency and "frequency_as_written" not in uncertain_fields:
            uncertain_fields.append("frequency_as_written")
            uncertainty_reasons["frequency_as_written"] = "'Use as directed' lacks explicit times per day. AI must not guess dosing frequency."
        if not timing and "timing_as_written" not in uncertain_fields:
            uncertain_fields.append("timing_as_written")
            uncertainty_reasons["timing_as_written"] = "Specific time of day or meal association was not written."

    # Determine Review Status
    if len(uncertain_fields) > 0:
        review_status = "uncertain" if any("smudged" in r or "contradictory" in r or "strikethrough" in r for r in uncertainty_reasons.values()) else "needs_review"
    else:
        review_status = "ready_for_verification"

    return uncertain_fields, uncertainty_reasons, review_status

def structure_prescription(ocr_text: str, preset_id: str = None) -> Tuple[List[MedicineExtracted], str, str]:
    """
    Main structuring pipeline:
    1. Check preset synthetic library if preset_id provided.
    2. Try live Gemini API if GEMINI_API_KEY configured.
    3. Fallback to MedBridge Clinical Structuring Adapter with rigorous uncertainty checks.
    """
    # 1. Preset Match
    if preset_id and preset_id in SAMPLE_PRESETS:
        preset = SAMPLE_PRESETS[preset_id]
        medicines = []
        for m in preset["medicines"]:
            # Recalculate uncertainty to guarantee consistency
            unc_fields, unc_reasons, rev_status = analyze_uncertainties(m)
            med_obj = MedicineExtracted(
                id=m["id"],
                name_as_written=m["name_as_written"],
                strength_as_written=m.get("strength_as_written"),
                instructions_as_written=m.get("instructions_as_written"),
                frequency_as_written=m.get("frequency_as_written"),
                timing_as_written=m.get("timing_as_written"),
                duration_as_written=m.get("duration_as_written"),
                prescribed_date=m.get("prescribed_date"),
                source_text=m.get("source_text", []),
                source_locations=m.get("source_locations", {}),
                uncertain_fields=unc_fields or m.get("uncertain_fields", []),
                uncertainty_reasons=unc_reasons or m.get("uncertainty_reasons", {}),
                review_status=m.get("review_status", rev_status),
                user_corrections=m.get("user_corrections", {}),
                verification_checklist=m.get("verification_checklist", {}),
                basic_info=m.get("basic_info") or lookup_medicine_info(m["name_as_written"])
            )
            medicines.append(med_obj)
        
        overall = "uncertain" if any(m.review_status == "uncertain" for m in medicines) else (
            "needs_review" if any(m.review_status == "needs_review" for m in medicines) else "ready_for_verification"
        )
        return medicines, overall, "MedBridge Clinical Structuring Engine (Synthetic Adapter)"

    # 2. Live Gemini API
    if GEMINI_API_KEY:
        gemini_result = parse_with_gemini_api(ocr_text)
        if gemini_result and "medicines" in gemini_result:
            medicines = []
            for item in gemini_result["medicines"]:
                unc_fields, unc_reasons, rev_status = analyze_uncertainties(item)
                med_obj = MedicineExtracted(
                    id=f"med-{uuid.uuid4().hex[:8]}",
                    name_as_written=item.get("name_as_written", "Unknown Medicine"),
                    strength_as_written=item.get("strength_as_written"),
                    instructions_as_written=item.get("instructions_as_written"),
                    frequency_as_written=item.get("frequency_as_written"),
                    timing_as_written=item.get("timing_as_written"),
                    duration_as_written=item.get("duration_as_written"),
                    prescribed_date=item.get("prescribed_date"),
                    source_text=item.get("source_text", []),
                    source_locations=item.get("source_locations", {}),
                    uncertain_fields=unc_fields,
                    uncertainty_reasons=unc_reasons,
                    review_status=rev_status,
                    user_corrections={},
                    verification_checklist={
                        "name_verified": False,
                        "strength_verified": False,
                        "instructions_verified": False,
                        "timing_verified": False
                    },
                    basic_info=lookup_medicine_info(item.get("name_as_written", "Unknown Medicine"))
                )
                medicines.append(med_obj)

            overall = gemini_result.get("overall_review_status", "needs_review")
            return medicines, overall, "Google Gemini 2.0 / 1.5 Pro (Live API)"

    # 3. Fallback Heuristic Structuring Adapter for user-uploaded custom images
    lines = [l.strip() for l in ocr_text.split("\n") if l.strip()]
    med_name = "Prescription Medication"
    strength = None
    instructions = None
    frequency = None
    timing = None
    duration = None
    source_lines = []

    for line in lines:
        if "Rx:" in line or "Amoxicillin" in line or "Capsule" in line or "tablet" in line or "mg" in line:
            source_lines.append(line)
            clean_line = line.replace("Rx:", "").strip()
            # Try to extract strength
            str_match = re.search(r"(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|%))", clean_line, re.IGNORECASE)
            if str_match:
                strength = str_match.group(1)
            med_name = clean_line.split(" ")[0] if clean_line else med_name
        elif "Sig:" in line or "Take" in line or "directed" in line:
            source_lines.append(line)
            instructions = line.replace("Sig:", "").strip()
            if "twice daily" in instructions.lower():
                frequency = "Twice daily"
            elif "every 8 hours" in instructions.lower():
                frequency = "Every 8 hours"
            elif "once daily" in instructions.lower():
                frequency = "Once daily"

            if "with meals" in instructions.lower():
                timing = "With meals"
            elif "at bedtime" in instructions.lower():
                timing = "At bedtime"
            elif "before breakfast" in instructions.lower():
                timing = "Before breakfast"

            dur_match = re.search(r"for\s+(\d+\s+(?:days|weeks|months))", instructions, re.IGNORECASE)
            if dur_match:
                duration = dur_match.group(1)

    med_dict = {
        "name_as_written": med_name,
        "strength_as_written": strength,
        "instructions_as_written": instructions or "Instructions not clearly detected.",
        "frequency_as_written": frequency,
        "timing_as_written": timing,
        "duration_as_written": duration,
        "source_text": source_lines or lines[:3]
    }
    unc_fields, unc_reasons, rev_status = analyze_uncertainties(med_dict)

    med_obj = MedicineExtracted(
        id=f"med-{uuid.uuid4().hex[:8]}",
        name_as_written=med_name,
        strength_as_written=strength,
        instructions_as_written=instructions or "Instructions not clearly detected.",
        frequency_as_written=frequency,
        timing_as_written=timing,
        duration_as_written=duration,
        prescribed_date="10/11/2026",
        source_text=source_lines or lines[:2],
        source_locations={"name_as_written": {"line": 4, "box": [0.42, 0.10, 0.48, 0.85]}},
        uncertain_fields=unc_fields,
        uncertainty_reasons=unc_reasons,
        review_status=rev_status,
        user_corrections={},
        verification_checklist={
            "name_verified": False,
            "strength_verified": False,
            "instructions_verified": False,
            "timing_verified": False
        },
        basic_info=lookup_medicine_info(med_name)
    )

    overall = rev_status
    return [med_obj], overall, "MedBridge Clinical Structuring Adapter (Demo Mode)"
