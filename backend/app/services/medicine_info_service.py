from typing import Dict, Any, List
import re

MEDICINE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "amoxicillin": {
        "purpose": "Antibiotic prescribed to fight bacterial infections such as ear, chest, throat, dental, and urinary tract infections.",
        "category": "Penicillin-class Antibiotic",
        "food_relation": "Can be taken with or without food. Taking with meals or a light snack helps reduce mild stomach upset.",
        "safety_tips": [
            "Complete the entire prescribed duration even if you feel completely better.",
            "Space doses evenly throughout your waking hours (e.g. morning, afternoon, night).",
            "Drink a full glass of water with each dose to aid absorption.",
            "Do not share or save leftover antibiotics for future illnesses."
        ],
        "common_side_effects": [
            "Mild nausea or loose stools",
            "Headache",
            "Altered taste sensation"
        ],
        "when_to_call_doctor": "Seek emergency medical help if you develop a widespread rash, facial swelling, difficulty breathing, or severe watery diarrhea.",
        "disclaimer": "Informational summary. Always follow your prescribing physician's directions and consult your pharmacist with questions."
    },
    "metformin": {
        "purpose": "First-line oral medication used to help lower blood sugar levels and enhance insulin sensitivity in type 2 diabetes.",
        "category": "Biguanide Antidiabetic Agent",
        "food_relation": "Always take with or immediately following meals to minimize gastrointestinal discomfort.",
        "safety_tips": [
            "Take with meals to prevent stomach cramps or nausea.",
            "Swallow extended-release (ER) tablets whole; never crush, chew, or break them.",
            "Stay well hydrated throughout the day.",
            "Avoid excessive alcohol consumption while taking Metformin."
        ],
        "common_side_effects": [
            "Mild nausea, stomach bloating, or gas",
            "Metallic taste in mouth",
            "Soft stools (usually improves after the first few weeks)"
        ],
        "when_to_call_doctor": "Contact your doctor immediately if you experience persistent severe fatigue, muscle aches, trouble breathing, or severe abdominal pain (rare lactic acidosis alert).",
        "disclaimer": "Informational summary. Regularly monitor your blood glucose as advised by your healthcare team."
    },
    "lisinopril": {
        "purpose": "Antihypertensive medication used to lower high blood pressure and protect kidney function in diabetic patients.",
        "category": "ACE (Angiotensin-Converting Enzyme) Inhibitor",
        "food_relation": "May be taken with or without food. Consistent daily timing is key.",
        "safety_tips": [
            "Take at roughly the same time every day to maintain steady blood pressure.",
            "Rise slowly from sitting or lying down to prevent lightheadedness.",
            "Avoid potassium supplements or salt substitutes containing potassium without physician approval.",
            "Keep hydrated, especially in hot weather."
        ],
        "common_side_effects": [
            "Mild dizziness when standing up",
            "Dry, persistent tickling cough",
            "Mild headache"
        ],
        "when_to_call_doctor": "Call your doctor immediately if you develop swelling of the face, lips, tongue, or throat (angioedema), or severe lightheadedness.",
        "disclaimer": "Informational summary. Never stop taking blood pressure medications abruptly without consulting your doctor."
    },
    "atorvastatin": {
        "purpose": "Lipid-lowering medication used to decrease LDL ('bad') cholesterol, reduce triglycerides, and lower risk of heart attacks and stroke.",
        "category": "HMG-CoA Reductase Inhibitor (Statin)",
        "food_relation": "Can be taken with or without meals. Frequently taken in the evening or at bedtime for peak efficacy.",
        "safety_tips": [
            "Taking once daily in the evening or bedtime is commonly recommended.",
            "Avoid consuming large amounts of grapefruit or grapefruit juice, as it increases drug concentration.",
            "Maintain a heart-healthy diet low in saturated fats.",
            "Do not discontinue without speaking to your doctor."
        ],
        "common_side_effects": [
            "Mild joint or muscle achiness",
            "Digestive discomfort or constipation",
            "Slight headache"
        ],
        "when_to_call_doctor": "Report unexplained muscle pain, tenderness, or weakness immediately, particularly if accompanied by dark urine or fever.",
        "disclaimer": "Informational summary. Periodic cholesterol and liver enzyme blood tests are standard medical practice."
    },
    "omeprazole": {
        "purpose": "Gastric acid reducer used to treat acid reflux (GERD), heartburn, gastric ulcers, and promote healing of the esophagus.",
        "category": "Proton Pump Inhibitor (PPI)",
        "food_relation": "Best taken in the morning 30 to 60 minutes before your first meal of the day.",
        "safety_tips": [
            "Swallow capsules whole with water; do not crush or chew the pellets.",
            "Take 30–60 minutes before breakfast for optimal acid suppression.",
            "If prescribed once daily, morning administration provides the highest daytime relief.",
            "Consult doctor if taken over-the-counter for longer than 14 consecutive days."
        ],
        "common_side_effects": [
            "Mild headache",
            "Abdominal gas or mild diarrhea",
            "Nausea"
        ],
        "when_to_call_doctor": "Seek care if heartburn persists accompanied by chest pain, radiating pain to shoulder/jaw, or vomiting blood.",
        "disclaimer": "Informational summary. Do not alter dose or duration without healthcare provider guidance."
    },
    "prednisone": {
        "purpose": "Steroid anti-inflammatory used to treat acute allergic reactions, arthritis flare-ups, asthma exacerbations, and autoimmune disorders.",
        "category": "Corticosteroid",
        "food_relation": "Must always be taken with food, milk, or breakfast to protect the stomach lining.",
        "safety_tips": [
            "Always take with meals or milk to protect stomach lining.",
            "Take your dose in the morning to mimic natural body cortisol and avoid sleep disruption.",
            "Do NOT stop taking suddenly if you have been taking it for multiple weeks; follow doctor's taper instructions.",
            "Monitor blood pressure and blood sugar, especially if diabetic."
        ],
        "common_side_effects": [
            "Increased appetite and mild water retention",
            "Restlessness, jitteriness, or trouble sleeping",
            "Mild mood elevation or irritability"
        ],
        "when_to_call_doctor": "Contact doctor if you develop black/tarry stools, signs of infection (fever), severe mood swings, or vision changes.",
        "disclaimer": "Informational summary. Taper schedules must be followed precisely as prescribed by your doctor."
    }
}

def lookup_medicine_info(medicine_name: str) -> Dict[str, Any]:
    """
    Looks up clinical basic information for a medicine name.
    Falls back gracefully to high-yield clinical safety principles if not in standard dictionary.
    """
    clean_name = re.sub(r'[^a-zA-Z]', '', medicine_name.lower())
    
    for key, data in MEDICINE_KNOWLEDGE_BASE.items():
        if key in clean_name or clean_name in key:
            return data

    # Clean fallback for any arbitrary medication detected
    return {
        "purpose": f"Prescription medication ({medicine_name}) prescribed by your physician for targeted symptom management or disease control.",
        "category": "Prescription Therapeutic Agent",
        "food_relation": "Follow the specific instructions on the prescription label. When in doubt, taking with water and a light meal helps prevent nausea.",
        "safety_tips": [
            "Take precisely as indicated by your doctor or printed on the pharmacy label.",
            "Keep in original container with child-resistant cap in a cool, dry place away from heat.",
            "Do not adjust or skip doses without consulting your doctor or pharmacist.",
            "Keep an updated list of all your prescription and over-the-counter medicines."
        ],
        "common_side_effects": [
            "Mild stomach fullness or nausea",
            "Transient drowsiness or lightheadedness"
        ],
        "when_to_call_doctor": "Report any rash, hives, difficulty breathing, sudden swelling, or severe unexpected symptoms to your healthcare provider immediately.",
        "disclaimer": "Informational summary. Always follow your prescribing doctor's exact instructions."
    }
