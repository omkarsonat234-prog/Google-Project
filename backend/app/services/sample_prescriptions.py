import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from ..config import SAMPLES_DIR

SAMPLE_PRESETS = {
    "sample-clear": {
        "id": "sample-clear",
        "title": "Clear & Fully Specified Prescription",
        "category": "Ideal Case",
        "filename": "sample_clear_amoxicillin.png",
        "description": "Standard readable prescription with explicit dose, frequency, timing, and duration.",
        "original_ocr_text": """METRO HEALTH CLINIC
100 Elm Street, Suite 400
Dr. Sarah Jenkins, MD - Lic #94821

Patient: Johnathan Doe (Age: 38)
Date: 10/11/2026

Rx:
Amoxicillin 500mg capsules
Sig: Take 1 capsule orally every 8 hours with meals for 7 days.
Disp: #21 capsules
Refills: 0

Dr. Sarah Jenkins, MD [Signed]""",
        "medicines": [
            {
                "id": "med-clear-1",
                "name_as_written": "Amoxicillin",
                "strength_as_written": "500mg",
                "instructions_as_written": "Take 1 capsule orally every 8 hours with meals for 7 days.",
                "frequency_as_written": "Every 8 hours (3 times daily)",
                "timing_as_written": "With meals",
                "duration_as_written": "7 days",
                "prescribed_date": "10/11/2026",
                "source_text": [
                    "Amoxicillin 500mg capsules",
                    "Sig: Take 1 capsule orally every 8 hours with meals for 7 days.",
                    "Disp: #21 capsules"
                ],
                "source_locations": {
                    "name_as_written": {"line": 7, "box": [0.42, 0.12, 0.48, 0.55]},
                    "strength_as_written": {"line": 7, "box": [0.42, 0.35, 0.48, 0.52]},
                    "instructions_as_written": {"line": 8, "box": [0.49, 0.12, 0.56, 0.88]},
                    "frequency_as_written": {"line": 8, "box": [0.49, 0.42, 0.56, 0.65]},
                    "timing_as_written": {"line": 8, "box": [0.49, 0.66, 0.56, 0.78]},
                    "duration_as_written": {"line": 8, "box": [0.49, 0.79, 0.56, 0.88]}
                },
                "uncertain_fields": [],
                "uncertainty_reasons": {},
                "review_status": "ready_for_verification",
                "user_corrections": {},
                "verification_checklist": {
                    "name_verified": False,
                    "strength_verified": False,
                    "instructions_verified": False,
                    "timing_verified": False
                }
            }
        ],
        "default_times": ["08:00", "14:00", "20:00"]
    },

    "sample-blurry": {
        "id": "sample-blurry",
        "title": "Blurry / Partially Illegible Prescription",
        "category": "Uncertainty Detection",
        "filename": "sample_blurry_metformin.png",
        "description": "Handwriting is smudged and unreadable. Demonstrates uncertainty detection and blocked schedule activation.",
        "original_ocr_text": """VALLEY ENDOCRINE ASSOCIATES
Dr. Robert Martinez, MD
Date: 10/10/2026
Patient: Eleanor Vance

Rx:
Metformin 500mg
Sig: Take [ILLEGIBLE ~?~] tab [BLURRED] meals [SMUDGE] ...
Disp: 60 tabs

Refill: 1""",
        "medicines": [
            {
                "id": "med-blurry-1",
                "name_as_written": "Metformin",
                "strength_as_written": "500mg",
                "instructions_as_written": "Take [ILLEGIBLE ~?~] tab [BLURRED] meals [SMUDGE]",
                "frequency_as_written": None,
                "timing_as_written": None,
                "duration_as_written": None,
                "prescribed_date": "10/10/2026",
                "source_text": [
                    "Metformin 500mg",
                    "Sig: Take [ILLEGIBLE ~?~] tab [BLURRED] meals [SMUDGE]"
                ],
                "source_locations": {
                    "name_as_written": {"line": 6, "box": [0.38, 0.12, 0.44, 0.45]},
                    "strength_as_written": {"line": 6, "box": [0.38, 0.46, 0.44, 0.62]},
                    "instructions_as_written": {"line": 7, "box": [0.46, 0.12, 0.54, 0.85]}
                },
                "uncertain_fields": [
                    "instructions_as_written",
                    "frequency_as_written",
                    "timing_as_written"
                ],
                "uncertainty_reasons": {
                    "instructions_as_written": "OCR text contains illegible symbols and blurred regions. Cannot safely infer tablet count.",
                    "frequency_as_written": "Frequency text is smudged. Guessing doses is prohibited for patient safety.",
                    "timing_as_written": "Meal relationship is partially obscured."
                },
                "review_status": "uncertain",
                "user_corrections": {},
                "verification_checklist": {
                    "name_verified": True,
                    "strength_verified": True,
                    "instructions_verified": False,
                    "timing_verified": False
                }
            }
        ],
        "default_times": []
    },

    "sample-missing": {
        "id": "sample-missing",
        "title": "Prescription with Missing Instructions",
        "category": "Missing Data Handling",
        "filename": "sample_missing_lisinopril.png",
        "description": "Medication and dosage are clearly visible, but instructions state only 'Take as directed' with no time or frequency.",
        "original_ocr_text": """CARDIOVASCULAR CARE CENTER
Dr. Angela Chen, MD
Date: 10/08/2026
Patient: Marcus Brody

Rx:
Lisinopril 10mg tablets
Sig: Use as directed.
Quantity: 30

Dr. Angela Chen [Signed]""",
        "medicines": [
            {
                "id": "med-missing-1",
                "name_as_written": "Lisinopril",
                "strength_as_written": "10mg",
                "instructions_as_written": "Use as directed.",
                "frequency_as_written": None,
                "timing_as_written": None,
                "duration_as_written": None,
                "prescribed_date": "10/08/2026",
                "source_text": [
                    "Lisinopril 10mg tablets",
                    "Sig: Use as directed."
                ],
                "source_locations": {
                    "name_as_written": {"line": 6, "box": [0.38, 0.12, 0.45, 0.48]},
                    "strength_as_written": {"line": 6, "box": [0.38, 0.49, 0.45, 0.65]},
                    "instructions_as_written": {"line": 7, "box": [0.47, 0.12, 0.54, 0.55]}
                },
                "uncertain_fields": [
                    "frequency_as_written",
                    "timing_as_written",
                    "duration_as_written"
                ],
                "uncertainty_reasons": {
                    "frequency_as_written": "'Use as directed' does not state how many times per day. AI must never infer dosage.",
                    "timing_as_written": "No morning/evening or meal timing specified.",
                    "duration_as_written": "No duration stated."
                },
                "review_status": "needs_review",
                "user_corrections": {},
                "verification_checklist": {
                    "name_verified": True,
                    "strength_verified": True,
                    "instructions_verified": False,
                    "timing_verified": False
                }
            }
        ],
        "default_times": []
    },

    "sample-multi": {
        "id": "sample-multi",
        "title": "Multi-Medication Complex Prescription",
        "category": "Multi-Item Extraction",
        "filename": "sample_multi_medications.png",
        "description": "Prescription containing two distinct medications with distinct schedules and instructions.",
        "original_ocr_text": """COMPREHENSIVE GERIATRIC & INTERNAL MEDICINE
Dr. Emily Thorne, MD - Date: 10/09/2026
Patient: Thomas Wright (Age: 71)

1. Atorvastatin 20mg
   Sig: Take 1 tablet orally once daily at bedtime.
   Disp: #30, Refills: 2

2. Omeprazole 20mg delayed-release
   Sig: Take 1 capsule orally once daily in the morning 30 minutes before breakfast.
   Disp: #30, Refills: 1

Dr. Emily Thorne, MD""",
        "medicines": [
            {
                "id": "med-multi-1",
                "name_as_written": "Atorvastatin",
                "strength_as_written": "20mg",
                "instructions_as_written": "Take 1 tablet orally once daily at bedtime.",
                "frequency_as_written": "Once daily",
                "timing_as_written": "At bedtime",
                "duration_as_written": "30 days (refills: 2)",
                "prescribed_date": "10/09/2026",
                "source_text": [
                    "1. Atorvastatin 20mg",
                    "Sig: Take 1 tablet orally once daily at bedtime."
                ],
                "source_locations": {
                    "name_as_written": {"line": 5, "box": [0.35, 0.12, 0.41, 0.45]},
                    "strength_as_written": {"line": 5, "box": [0.35, 0.46, 0.41, 0.60]},
                    "instructions_as_written": {"line": 6, "box": [0.42, 0.12, 0.48, 0.85]}
                },
                "uncertain_fields": [],
                "uncertainty_reasons": {},
                "review_status": "ready_for_verification",
                "user_corrections": {},
                "verification_checklist": {
                    "name_verified": False,
                    "strength_verified": False,
                    "instructions_verified": False,
                    "timing_verified": False
                }
            },
            {
                "id": "med-multi-2",
                "name_as_written": "Omeprazole",
                "strength_as_written": "20mg delayed-release",
                "instructions_as_written": "Take 1 capsule orally once daily in the morning 30 minutes before breakfast.",
                "frequency_as_written": "Once daily",
                "timing_as_written": "Morning (30 mins before breakfast)",
                "duration_as_written": "30 days (refills: 1)",
                "prescribed_date": "10/09/2026",
                "source_text": [
                    "2. Omeprazole 20mg delayed-release",
                    "Sig: Take 1 capsule orally once daily in the morning 30 minutes before breakfast."
                ],
                "source_locations": {
                    "name_as_written": {"line": 9, "box": [0.55, 0.12, 0.61, 0.45]},
                    "strength_as_written": {"line": 9, "box": [0.55, 0.46, 0.61, 0.72]},
                    "instructions_as_written": {"line": 10, "box": [0.62, 0.12, 0.69, 0.95]}
                },
                "uncertain_fields": [],
                "uncertainty_reasons": {},
                "review_status": "ready_for_verification",
                "user_corrections": {},
                "verification_checklist": {
                    "name_verified": False,
                    "strength_verified": False,
                    "instructions_verified": False,
                    "timing_verified": False
                }
            }
        ],
        "default_times": ["21:00", "07:30"]
    },

    "sample-conflicting": {
        "id": "sample-conflicting",
        "title": "Conflicting & Cross-Annotated Prescription",
        "category": "Conflict & Ambiguity",
        "filename": "sample_conflicting_prednisone.png",
        "description": "Prescription contains crossed-out instructions and contradictory timing annotations requiring pharmacist resolution.",
        "original_ocr_text": """ALLERGY & RHEUMATOLOGY CLINIC
Dr. Nathan Hayes, MD
Date: 10/11/2026
Patient: Susan Miller

Rx:
Prednisone 10mg
Sig: Take 2 tablets daily [CROSSED-OUT: for 5 days] -> Changed: Take 3 tabs morning, then 1 tab afternoon?
Note: Or take with lunch only if stomach upset occurs.
Disp: #20

Dr. Nathan Hayes [Signed]""",
        "medicines": [
            {
                "id": "med-conflict-1",
                "name_as_written": "Prednisone",
                "strength_as_written": "10mg",
                "instructions_as_written": "Take 2 tablets daily [CROSSED-OUT: for 5 days] -> Changed: Take 3 tabs morning, then 1 tab afternoon? Note: Or take with lunch only if stomach upset occurs.",
                "frequency_as_written": "Contradictory / Unclear taper",
                "timing_as_written": "Conflicting (Morning vs Lunch)",
                "duration_as_written": "Unclear (crossed out 5 days)",
                "prescribed_date": "10/11/2026",
                "source_text": [
                    "Prednisone 10mg",
                    "Sig: Take 2 tablets daily [CROSSED-OUT: for 5 days] -> Changed: Take 3 tabs morning, then 1 tab afternoon?",
                    "Note: Or take with lunch only if stomach upset occurs."
                ],
                "source_locations": {
                    "name_as_written": {"line": 6, "box": [0.38, 0.12, 0.44, 0.45]},
                    "strength_as_written": {"line": 6, "box": [0.38, 0.46, 0.44, 0.62]},
                    "instructions_as_written": {"line": 7, "box": [0.46, 0.12, 0.62, 0.95]}
                },
                "uncertain_fields": [
                    "instructions_as_written",
                    "frequency_as_written",
                    "timing_as_written",
                    "duration_as_written"
                ],
                "uncertainty_reasons": {
                    "instructions_as_written": "Crossed-out instructions and taper schedule are contradictory.",
                    "frequency_as_written": "Multiple dosage values written (2 tabs vs 3 tabs + 1 tab).",
                    "timing_as_written": "Conflicting directions: morning vs lunch upon stomach upset.",
                    "duration_as_written": "Original duration crossed out without explicit replacement duration."
                },
                "review_status": "uncertain",
                "user_corrections": {},
                "verification_checklist": {
                    "name_verified": True,
                    "strength_verified": True,
                    "instructions_verified": False,
                    "timing_verified": False
                }
            }
        ],
        "default_times": []
    }
}

from .medicine_info_service import lookup_medicine_info

for preset in SAMPLE_PRESETS.values():
    for med in preset["medicines"]:
        if "basic_info" not in med or not med["basic_info"]:
            med["basic_info"] = lookup_medicine_info(med["name_as_written"])

def generate_sample_images():
    """Generates visual realistic prescription PNG files for each preset."""
    for preset_id, data in SAMPLE_PRESETS.items():
        filepath = SAMPLES_DIR / data["filename"]
        if filepath.exists():
            continue

        # Render high quality medical prescription canvas
        width, height = 750, 1000
        image = Image.new("RGB", (width, height), color=(252, 252, 250))
        draw = ImageDraw.Draw(image)

        # Draw prescription border and header background
        draw.rectangle([20, 20, width - 20, height - 20], outline=(200, 210, 215), width=2)
        draw.rectangle([25, 25, width - 25, 140], fill=(240, 246, 248))
        draw.line([25, 140, width - 25, 140], fill=(13, 148, 136), width=3)

        # Header Clinic Text
        lines = data["original_ocr_text"].split("\n")
        y = 45
        for line in lines[:3]:
            draw.text((45, y), line, fill=(30, 41, 59))
            y += 28

        # Prescription watermark / Rx icon
        draw.text((45, 160), "Rx", fill=(13, 148, 136))
        
        # Patient & Date section
        y = 200
        for line in lines[3:5]:
            draw.text((45, y), line, fill=(51, 65, 85))
            y += 26
        
        draw.line([45, y + 10, width - 45, y + 10], fill=(226, 232, 240), width=1)
        y += 30

        # Medication instructions body
        for line in lines[5:]:
            # Highlight if smudged or crossed out
            if "[ILLEGIBLE" in line or "[BLURRED" in line or "[SMUDGE]" in line:
                draw.rectangle([40, y - 4, width - 45, y + 26], fill=(254, 243, 199))
                draw.text((45, y), line, fill=(180, 83, 9))
            elif "[CROSSED-OUT" in line:
                draw.rectangle([40, y - 4, width - 45, y + 26], fill=(254, 226, 226))
                draw.text((45, y), line, fill=(185, 28, 28))
                # draw strikethrough line
                draw.line([45, y + 10, width - 60, y + 10], fill=(220, 38, 38), width=2)
            else:
                draw.text((45, y), line, fill=(15, 23, 42))
            y += 36

        # Draw security footer & signature line
        draw.line([width - 320, height - 90, width - 50, height - 90], fill=(100, 116, 139), width=1)
        draw.text((width - 310, height - 80), "Authorized Prescriber Signature", fill=(100, 116, 139))
        draw.text((45, height - 50), "MedBridge Medical Verification Standard - Synthetic Test Prescription", fill=(148, 163, 184))

        image.save(filepath, format="PNG")
