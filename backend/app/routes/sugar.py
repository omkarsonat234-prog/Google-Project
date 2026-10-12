import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..models.database import get_connection, log_audit

router = APIRouter(prefix="/api/sugar", tags=["Diabetes & Blood Sugar"])

# Clinical thresholds (ADA 2024)
THRESHOLDS = {
    "fasting_preprandial": {"optimal": (80, 130), "hypo": 70, "hyper": 180},
    "postprandial_2hr":   {"optimal": (80, 180), "hypo": 70, "hyper": 200},
    "random":              {"optimal": (80, 180), "hypo": 70, "hyper": 200},
    "bedtime":             {"optimal": (100, 140), "hypo": 80, "hyper": 180},
}

MEAL_SUGGESTIONS = {
    "hypo": [
        "⚠️ HYPOGLYCEMIA ALERT: Blood sugar dangerously low.",
        "Immediately consume 15g fast-acting carbs: 4 glucose tablets, 4 oz orange juice, or 5–6 crackers.",
        "Re-check blood glucose after 15 minutes.",
        "If still below 70 mg/dL — repeat. Do NOT eat a full meal during hypo treatment.",
        "Notify your physician or caregiver immediately if symptoms persist."
    ],
    "optimal": [
        "✅ Blood glucose is within your target range — excellent control.",
        "Maintain your current meal plan and medication schedule.",
        "Continue regular monitoring as prescribed.",
        "Stay hydrated and keep your activity routine consistent."
    ],
    "elevated": [
        "⚠️ Blood glucose slightly elevated — monitor closely.",
        "Avoid high-GI carbohydrates: white rice, white bread, sugary drinks, sweets.",
        "Increase water intake to at least 2–3 litres today.",
        "A 15–20 minute post-meal walk significantly lowers blood glucose.",
        "Review portion sizes at your next meal and consult your physician if this persists."
    ],
    "hyper": [
        "🔴 HYPERGLYCEMIA: Blood glucose critically high — action required.",
        "Do NOT consume any carbohydrates, sugar, or sweetened drinks.",
        "Drink water immediately and every 15 minutes.",
        "Check for ketones if glucose >240 mg/dL — seek emergency care if ketones present.",
        "Contact your physician or diabetes care team today.",
        "Do not skip any scheduled insulin or antidiabetic medication doses."
    ]
}

AVOID_FOODS_DIABETIC = {
    "strictly_avoid": [
        "Sugary soft drinks, colas, fruit juices, energy drinks",
        "White rice, maida (refined flour), white bread, cornflakes",
        "Deep-fried snacks: samosas, pakoras, chips, french fries",
        "Full-fat dairy: whole milk, cream, butter in excess",
        "Sweets: mithai, chocolate, ice cream, gulab jamun, jalebi",
        "Processed meats, fast food, instant noodles",
        "Alcohol (raises and then drops blood glucose unpredictably)"
    ],
    "limit_carefully": [
        "Fruit: prefer low-GI (apple, pear, guava) over mango, banana, grapes",
        "Rice: prefer brown or basmati rice in small portions",
        "Potatoes: small portions, never fried",
        "Whole wheat bread: maximum 2 slices/day"
    ],
    "recommended": [
        "Leafy greens: spinach, fenugreek (methi), bitter gourd (karela)",
        "Legumes: lentils (dal), chickpeas, kidney beans",
        "Whole grains: oats, barley, millets (bajra, jowar, ragi)",
        "Lean proteins: skinless chicken, fish, eggs, paneer (low-fat)",
        "Healthy fats: a small handful of walnuts, almonds (unsalted)",
        "2–3 litres of plain water daily"
    ]
}


def classify_reading(reading_type: str, glucose: float):
    t = THRESHOLDS.get(reading_type, THRESHOLDS["random"])
    if glucose < t["hypo"]:
        return "hypo"
    elif glucose > t["hyper"]:
        return "hyper"
    elif glucose > t["optimal"][1]:
        return "elevated"
    else:
        return "optimal"


class SugarLogCreate(BaseModel):
    patient_id: str
    reading_type: str  # fasting_preprandial | postprandial_2hr | random | bedtime
    glucose_mg_dl: float
    meal_context: str  # before_breakfast | after_breakfast | before_lunch | after_lunch | before_dinner | after_dinner
    notes: Optional[str] = None


@router.post("/log")
def log_blood_sugar(data: SugarLogCreate):
    flag = classify_reading(data.reading_type, data.glucose_mg_dl)
    suggestions = MEAL_SUGGESTIONS.get(flag, MEAL_SUGGESTIONS["optimal"])
    lid = f"bsl-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO blood_sugar_logs (
        id, patient_id, reading_type, glucose_mg_dl, measured_at, meal_context,
        clinical_flag, suggested_steps, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        lid, data.patient_id, data.reading_type, data.glucose_mg_dl, now,
        data.meal_context, flag, json.dumps(suggestions), data.notes, now
    ))
    conn.commit()
    conn.close()
    log_audit("BLOOD_SUGAR_LOGGED", data.patient_id, "patient", "blood_sugar_logs", lid,
              {"glucose": data.glucose_mg_dl, "flag": flag})
    return {
        "id": lid,
        "glucose_mg_dl": data.glucose_mg_dl,
        "clinical_flag": flag,
        "flag_label": {"hypo": "Hypoglycemia", "optimal": "Normal Range", "elevated": "Elevated", "hyper": "Hyperglycemia"}[flag],
        "suggested_steps": suggestions,
        "dietary_guidance": AVOID_FOODS_DIABETIC,
        "measured_at": now
    }


@router.get("/logs")
def get_sugar_logs(patient_id: str = Query("demo-patient"), limit: int = Query(30)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM blood_sugar_logs WHERE patient_id = ? ORDER BY measured_at DESC LIMIT ?",
        (patient_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["suggested_steps"] = json.loads(d.get("suggested_steps") or "[]")
        except Exception:
            pass
        result.append(d)
    return result


@router.get("/dietary-guide")
def get_dietary_guide():
    return {
        "title": "Diabetic Patient Dietary Guidance",
        "subtitle": "Evidence-based food recommendations for blood sugar control",
        "guidelines": AVOID_FOODS_DIABETIC,
        "meal_timing": {
            "preprandial_target": "80–130 mg/dL (before meals)",
            "postprandial_target": "< 180 mg/dL (2 hours after meals)",
            "bedtime_target": "100–140 mg/dL",
            "meal_frequency": "3 main meals + 2 small snacks; no meal gap > 4 hours",
            "portion_guide": "Fill half the plate with non-starchy vegetables, ¼ with lean protein, ¼ with whole grain"
        },
        "preprandial_tips": [
            "Check blood glucose 30 min before eating.",
            "Take antidiabetic medications as prescribed (e.g. Metformin with meals).",
            "Avoid skipping any meal — this causes dangerous blood sugar swings.",
            "Insulin-dependent patients: administer rapid-acting insulin 15–30 min pre-meal as directed."
        ],
        "postprandial_tips": [
            "Check blood glucose 2 hours after first bite of meal.",
            "A short walk (15–20 min) after meals is clinically proven to reduce post-meal spike.",
            "Avoid lying down immediately after eating.",
            "Avoid high-carb desserts or sweet drinks after meals."
        ]
    }
