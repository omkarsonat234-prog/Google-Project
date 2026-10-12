import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from ..models.database import get_connection

router = APIRouter(prefix="/api/formulary", tags=["Medicines Formulary"])

# ─── Comprehensive Medicine Dataset ───────────────────────────────────────────
FORMULARY_SEED = [
    # ── OPD Oral Medicines ──────────────────────────────────────────────────
    {
        "name": "Amoxicillin 500mg Capsule",
        "generic_name": "Amoxicillin",
        "category": "Penicillin Antibiotic",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Capsule 250mg, 500mg; Suspension 125mg/5mL",
        "standard_dosage": "500mg every 8 hours for 7–10 days; Children: 25mg/kg/day divided q8h",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "with_or_without_food", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Can be taken with or without food. Take with water to avoid throat irritation."},
        "sugar_impact_notes": "Minimal direct glucose impact. Complete full course to prevent resistant infections.",
        "indications": "Bacterial infections: ear, throat, chest, urinary tract, skin, dental abscess.",
        "contraindications": "Penicillin allergy, mononucleosis (causes rash).",
        "adverse_effects": "Nausea, diarrhoea, skin rash, allergic reaction (anaphylaxis rare).",
        "avoid_foods": ["Alcohol (reduces gut absorption)", "Grapefruit (minor interaction)"],
        "avoid_drinks": ["Alcohol"],
        "patient_instructions": "Swallow whole with a full glass of water. Space doses evenly (8 hrs apart). Complete full course even if feeling better."
    },
    {
        "name": "Metformin 500mg Tablet",
        "generic_name": "Metformin HCl",
        "category": "Biguanide Antidiabetic",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Tablet 500mg, 850mg, 1000mg; Extended-Release Tablet",
        "standard_dosage": "500mg twice daily with meals; max 2000mg/day. Titrate slowly to minimise GI effects.",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "with_meal", "preprandial_mins": 0, "postprandial_hours": None, "food_instructions": "MUST be taken with food or immediately after meals to reduce nausea and GI side effects."},
        "sugar_impact_notes": "Lowers fasting and postprandial glucose. Monitor for hypoglycaemia when combined with insulin or sulfonylureas.",
        "indications": "Type 2 Diabetes Mellitus, insulin resistance, pre-diabetes (off-label), PCOS.",
        "contraindications": "eGFR < 30 mL/min (renal impairment), active liver disease, excessive alcohol use, IV contrast agents (hold 48h).",
        "adverse_effects": "Nausea, metallic taste, diarrhoea (common, improves with time), lactic acidosis (rare but serious).",
        "avoid_foods": ["High-sugar foods and drinks", "Refined carbohydrates (white rice, white bread, maida)", "Alcohol (lactic acidosis risk)"],
        "avoid_drinks": ["Alcohol", "Sugary soft drinks", "Fruit juices", "Energy drinks"],
        "patient_instructions": "Take with meals — never on empty stomach. ER tablets: swallow whole, never crush. Stay well hydrated. Report severe fatigue or abdominal pain immediately."
    },
    {
        "name": "Lisinopril 10mg Tablet",
        "generic_name": "Lisinopril",
        "category": "ACE Inhibitor Antihypertensive",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Tablet 2.5mg, 5mg, 10mg, 20mg",
        "standard_dosage": "10mg once daily; adjust to 20–40mg/day; reduce in renal impairment.",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "any_time_consistent", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Take at the same time each day. Food does not significantly affect absorption."},
        "sugar_impact_notes": "May cause mild hypoglycaemia in diabetic patients on insulin. Monitor glucose.",
        "indications": "Hypertension, heart failure, post-MI cardioprotection, diabetic nephropathy.",
        "contraindications": "Pregnancy (teratogenic), bilateral renal artery stenosis, history of ACE inhibitor-induced angioedema.",
        "adverse_effects": "Dry persistent cough, dizziness (first-dose hypotension), hyperkalaemia, angioedema (rare but emergency).",
        "avoid_foods": ["High-potassium foods in excess: bananas, oranges, potatoes, tomatoes (risk of hyperkalaemia)", "Potassium supplements without doctor advice"],
        "avoid_drinks": ["Alcohol (additive hypotension)", "Excessive liquorice drinks"],
        "patient_instructions": "Take at same time daily. Rise slowly from bed or chair to prevent dizziness. Do not stop without consulting your doctor. Immediate ER if throat or face swells."
    },
    {
        "name": "Atorvastatin 20mg Tablet",
        "generic_name": "Atorvastatin Calcium",
        "category": "HMG-CoA Reductase Inhibitor (Statin)",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Tablet 10mg, 20mg, 40mg, 80mg",
        "standard_dosage": "20–40mg once daily at bedtime; adjust as per LDL target.",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "evening_or_bedtime", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Preferably at bedtime for maximum LDL reduction. Can be taken with or without food."},
        "sugar_impact_notes": "Statins can slightly increase blood glucose — monitor HbA1c annually in diabetics.",
        "indications": "Hypercholesterolaemia, mixed dyslipidaemia, primary prevention of cardiovascular events.",
        "contraindications": "Active liver disease, elevated transaminases (>3× ULN), pregnancy and breastfeeding.",
        "adverse_effects": "Muscle pain/weakness (myopathy), elevated liver enzymes, headache, mild GI upset.",
        "avoid_foods": ["Grapefruit and grapefruit juice (increases atorvastatin blood levels by 83%)", "Excessive fatty/fried foods (counteracts lipid-lowering effect)"],
        "avoid_drinks": ["Grapefruit juice (entire 24h window)", "Alcohol in excess (additive liver strain)"],
        "patient_instructions": "Take at bedtime. AVOID grapefruit juice entirely. Report unexplained muscle pain with dark urine urgently. Do not stop without doctor consultation."
    },
    {
        "name": "Omeprazole 20mg Capsule",
        "generic_name": "Omeprazole",
        "category": "Proton Pump Inhibitor (PPI)",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Capsule 10mg, 20mg, 40mg; IV Injection (IPD use)",
        "standard_dosage": "20mg once daily before breakfast for 4–8 weeks; 40mg for severe GERD.",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "preprandial_30_min", "preprandial_mins": 30, "postprandial_hours": None, "food_instructions": "Take 30–60 minutes BEFORE the first meal of the day for maximum acid suppression."},
        "sugar_impact_notes": "No direct sugar impact. May reduce B12 absorption with long-term use.",
        "indications": "GERD, peptic ulcers, H. pylori eradication (with antibiotics), Zollinger-Ellison syndrome.",
        "contraindications": "Hypersensitivity to PPIs, concurrent rilpivirine (HIV drug).",
        "adverse_effects": "Headache, diarrhoea, nausea, B12 and magnesium deficiency (long-term), C. difficile risk.",
        "avoid_foods": ["Spicy foods", "Acidic foods (tomatoes, citrus) if symptomatic", "High-fat meals (delays gastric emptying)"],
        "avoid_drinks": ["Coffee and caffeinated drinks", "Alcohol", "Carbonated drinks"],
        "patient_instructions": "Swallow capsule whole — do NOT crush or chew pellets. Take 30 min before breakfast. Avoid coffee, alcohol, and spicy/acidic foods. Limit use to prescribed duration."
    },
    {
        "name": "Amlodipine 5mg Tablet",
        "generic_name": "Amlodipine Besylate",
        "category": "Calcium Channel Blocker (CCB)",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Tablet 2.5mg, 5mg, 10mg",
        "standard_dosage": "5mg once daily; max 10mg/day for hypertension or angina.",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "any_time_consistent", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Take at the same time each day. Food does not affect absorption."},
        "sugar_impact_notes": "No direct glucose effect. Useful in diabetic hypertension as it does not mask hypoglycaemic symptoms.",
        "indications": "Hypertension, chronic stable angina, vasospastic angina.",
        "contraindications": "Cardiogenic shock, severe aortic stenosis, hypersensitivity.",
        "adverse_effects": "Pedal oedema (ankle swelling), flushing, dizziness, palpitations.",
        "avoid_foods": ["Grapefruit and grapefruit juice (raises amlodipine plasma levels)"],
        "avoid_drinks": ["Grapefruit juice", "Alcohol (additive vasodilation/hypotension)"],
        "patient_instructions": "Take at the same time each day. AVOID grapefruit juice. Ankle swelling is common — elevate feet when seated. Report severe dizziness."
    },
    {
        "name": "Prednisone 10mg Tablet",
        "generic_name": "Prednisone",
        "category": "Corticosteroid (Systemic)",
        "care_setting": "OPD",
        "route": "Oral",
        "dosage_forms": "Tablet 1mg, 5mg, 10mg, 20mg, 50mg; Solution",
        "standard_dosage": "Varies: 5–60mg/day depending on indication; always taper to stop.",
        "syringe_specs": None,
        "meal_timing": {"timing_rule": "with_food_morning", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "MUST be taken with food or milk. Morning dosing mirrors natural cortisol rhythm and reduces sleep disruption."},
        "sugar_impact_notes": "RAISES blood glucose significantly — even in non-diabetics. Diabetic patients must increase monitoring to 4× daily. Insulin adjustment required for hospitalised patients.",
        "indications": "Acute allergy, asthma exacerbation, autoimmune conditions, arthritis, inflammatory bowel disease.",
        "contraindications": "Active untreated infections (viral, fungal), live vaccines during therapy.",
        "adverse_effects": "Increased appetite/weight gain, fluid retention, insomnia, blood sugar elevation, adrenal suppression on abrupt cessation.",
        "avoid_foods": ["Salty/high-sodium foods (fluid retention)", "High-sugar foods (glucose spike)", "Alcohol (additive GI damage)"],
        "avoid_drinks": ["Alcohol", "Sugary beverages"],
        "patient_instructions": "ALWAYS take with food. Take in the MORNING. NEVER stop abruptly — follow taper schedule. Monitor blood sugar closely. Report black stools, infection, or mood changes."
    },
    # ── IPD Injectable Medicines ─────────────────────────────────────────────
    {
        "name": "Insulin Regular (Actrapid) 100 IU/mL Injection",
        "generic_name": "Regular Human Insulin",
        "category": "Short-Acting Insulin",
        "care_setting": "IPD",
        "route": "Subcutaneous Injection / Intravenous Infusion",
        "dosage_forms": "10mL Vial (100 IU/mL); 3mL Cartridge; 3mL Prefilled Pen",
        "standard_dosage": "SC: 0.1–0.2 IU/kg 30 min before meals. IV: 0.1 IU/kg/hr infusion (ICU only). Dose individualised per physician.",
        "syringe_specs": {
            "type": "Insulin Syringe (U-100)",
            "capacity_ml": 1.0,
            "graduations": "1 IU per line (100 IU = 1 mL)",
            "needle_gauge": "28–31 G",
            "needle_length_mm": "4–8 mm",
            "injection_angle_degrees": "45–90° (90° for obese; 45° for lean)",
            "injection_sites": ["Abdomen (2 inches from navel) — fastest absorption", "Outer thigh", "Upper outer arm", "Upper buttock"],
            "site_rotation": "Rotate within same region. Never inject same spot twice in a row.",
            "technique": [
                "Wash hands. Clean injection site with alcohol swab; allow to dry.",
                "Pinch skin if < 4mm fat layer; release for 8mm needles.",
                "Insert needle at correct angle in one swift motion.",
                "Push plunger slowly and steadily.",
                "Hold needle in for 10 seconds before withdrawing.",
                "Do NOT recap needle. Dispose in sharps container."
            ]
        },
        "meal_timing": {"timing_rule": "preprandial_30_min", "preprandial_mins": 30, "postprandial_hours": None, "food_instructions": "Administer 30 minutes BEFORE meal. Patient MUST eat within 30 minutes of injection."},
        "sugar_impact_notes": "High hypoglycaemia risk. Monitor glucose before and 1–2h post-injection. Have glucose tablets/juice available at all times.",
        "indications": "Type 1 Diabetes, Type 2 Diabetes uncontrolled on oral agents, DKA, surgical hyperglycaemia.",
        "contraindications": "Hypoglycaemia (glucose < 70 mg/dL), hypersensitivity.",
        "adverse_effects": "Hypoglycaemia, lipodystrophy at injection sites, local reactions.",
        "avoid_foods": ["Alcohol (profound hypoglycaemia risk)", "High-sugar foods without dose adjustment"],
        "avoid_drinks": ["Alcohol"],
        "patient_instructions": "Always have glucose tablets or a fast sugar source nearby. Never skip meals after injection. Rotate injection sites. Store unused vials in refrigerator (2–8°C); in-use vials: room temperature up to 28 days."
    },
    {
        "name": "Ceftriaxone 1g IV Injection",
        "generic_name": "Ceftriaxone Sodium",
        "category": "3rd Generation Cephalosporin Antibiotic",
        "care_setting": "IPD",
        "route": "Intravenous Infusion / Intramuscular Injection",
        "dosage_forms": "Powder for injection: 250mg, 500mg, 1g, 2g vials",
        "standard_dosage": "1–2g IV/IM once daily; severe infections: 2–4g/day; meningitis: 4g/day. Children: 50–100mg/kg/day.",
        "syringe_specs": {
            "type": "Standard IV Syringe or IV Infusion Set",
            "iv_preparation": "Reconstitute 1g vial with 10mL sterile water; dilute in 50–100mL NS or D5W for IV infusion.",
            "capacity_ml": "50–100 mL (infusion bag)",
            "infusion_duration_min": "30–60 minutes (never rapid IV push for > 1g)",
            "im_preparation": "For IM: reconstitute with 3.5mL 1% lignocaine (reduces pain). Give into large muscle (gluteus).",
            "im_needle_gauge": "21–23 G",
            "im_needle_length_mm": "38–51 mm (1.5–2 inch for gluteal IM)",
            "injection_angle_degrees": "90° (IM into gluteus)",
            "technique": [
                "IV: Check IV line patency. Infuse over 30–60 min using infusion pump.",
                "IM: Aspirate before injecting — if blood, reposition needle.",
                "Do NOT mix with calcium-containing solutions (precipitate forms).",
                "Monitor for anaphylaxis in first 30 min of first dose."
            ]
        },
        "meal_timing": {"timing_rule": "independent_of_meals", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Meal timing not applicable for IV/IM route."},
        "sugar_impact_notes": "No direct glucose effect. Monitor renal function in diabetic patients.",
        "indications": "Severe pneumonia, septicaemia, meningitis, typhoid, complicated UTI, surgical prophylaxis.",
        "contraindications": "Cephalosporin/penicillin allergy, neonates with hyperbilirubinaemia, calcium-containing IV solutions (neonates).",
        "adverse_effects": "Diarrhoea, C. difficile colitis, phlebitis at IV site, raised liver enzymes, biliary sludge.",
        "avoid_foods": ["Alcohol (rare disulfiram-like reaction)"],
        "avoid_drinks": ["Alcohol"],
        "patient_instructions": "Administered by healthcare professional only. Inform nurse immediately if chest tightness, rash, or breathing difficulty occurs during infusion."
    },
    {
        "name": "Morphine Sulfate 10mg/mL Injection",
        "generic_name": "Morphine Sulfate",
        "category": "Opioid Analgesic",
        "care_setting": "IPD",
        "route": "Intravenous / Intramuscular / Subcutaneous Injection",
        "dosage_forms": "Ampoule 10mg/mL (1mL); 15mg/mL (1mL)",
        "standard_dosage": "IV: 2–4mg slow IV q3–4h PRN. IM/SC: 5–10mg q4h. PCA: 1mg demand bolus, 5–10 min lockout.",
        "syringe_specs": {
            "type": "Luer-Lock Syringe",
            "capacity_ml": 5.0,
            "preparation": "Dilute to 1mg/mL: draw 10mg (1mL) + 9mL normal saline = 10mL at 1mg/mL.",
            "iv_rate": "Give IV over minimum 4–5 minutes (NEVER rapid bolus — respiratory arrest risk).",
            "im_sc_needle_gauge": "23–25 G",
            "im_needle_length_mm": "25–38 mm",
            "injection_angle_degrees": "90° IM; 45° SC",
            "technique": [
                "CONTROLLED DRUG: Two-nurse verification of dose required.",
                "IV: Always dilute. Administer with naloxone (reversal) immediately available.",
                "Monitor respiratory rate, SaO2, and consciousness level during administration.",
                "SC: Use abdominal or thigh site. Avoid areas with poor circulation."
            ]
        },
        "meal_timing": {"timing_rule": "independent_of_meals", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Oral morphine: take at prescribed times; can take with food to reduce nausea."},
        "sugar_impact_notes": "Stress-related hyperglycaemia common in surgical patients. Monitor glucose regularly.",
        "indications": "Severe acute pain (post-op, trauma, MI, burns, cancer pain), palliative dyspnoea.",
        "contraindications": "Respiratory depression, paralytic ileus, raised intracranial pressure, concurrent MAOIs.",
        "adverse_effects": "Respiratory depression, sedation, nausea, constipation, urinary retention, dependence.",
        "avoid_foods": ["Alcohol (potentiates CNS depression — DANGEROUS)"],
        "avoid_drinks": ["Alcohol (absolutely contraindicated)"],
        "patient_instructions": "Administered ONLY by trained healthcare staff. Do not drive or operate machinery. Report difficulty breathing, severe drowsiness, or confusion immediately. Controlled substance — prescription required."
    },
    {
        "name": "Heparin Sodium 5000 IU/mL Injection",
        "generic_name": "Unfractionated Heparin",
        "category": "Anticoagulant",
        "care_setting": "IPD",
        "route": "Subcutaneous Injection / Intravenous Infusion",
        "dosage_forms": "5000 IU/mL (1mL ampoule); 25000 IU/5mL vial",
        "standard_dosage": "DVT prophylaxis SC: 5000 IU q8–12h. Therapeutic IV: 80 IU/kg bolus then 18 IU/kg/hr infusion (weight-based nomogram).",
        "syringe_specs": {
            "type": "Tuberculin/Insulin Syringe (SC) or Infusion Pump (IV)",
            "capacity_ml": 1.0,
            "iv_preparation": "Add to 500mL NS for IV infusion — run via infusion pump only.",
            "sc_needle_gauge": "25–26 G",
            "sc_needle_length_mm": "16 mm (5/8 inch)",
            "injection_angle_degrees": "90° (pinch skin fold; do NOT aspirate)",
            "injection_sites": ["Abdominal fat — 2 inches from navel preferred", "Outer thigh"],
            "technique": [
                "SC: Pinch skin fold. Insert at 90°. Do NOT aspirate before injection (increases bruising risk).",
                "Do NOT massage injection site after administration.",
                "Rotate sites systematically to minimise bruising.",
                "IV: ONLY via infusion pump — NEVER bolus without specific medical order.",
                "Monitor aPTT every 6h during IV therapy; target 60–100 seconds.",
                "Have protamine sulfate (reversal agent) available."
            ]
        },
        "meal_timing": {"timing_rule": "independent_of_meals", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Not applicable for injection. Oral anticoagulants only: Warfarin — avoid large changes in vitamin K intake."},
        "sugar_impact_notes": "No direct glucose effect. Falsely lowers glucose readings in some glucometers — use venous blood for accurate results.",
        "indications": "VTE prophylaxis, DVT/PE treatment, STEMI anticoagulation, haemodialysis circuit anticoagulation.",
        "contraindications": "Active major bleeding, HIT (heparin-induced thrombocytopaenia), severe thrombocytopaenia < 50,000.",
        "adverse_effects": "Bleeding, heparin-induced thrombocytopaenia (HIT), hyperkalaemia with prolonged use, osteoporosis.",
        "avoid_foods": ["High vitamin K foods (for concurrent warfarin patients): spinach, kale, green tea in excess"],
        "avoid_drinks": ["Alcohol (bleeding risk)"],
        "patient_instructions": "Administered by nursing staff only. Report bruising, blood in urine/stool, or unexpected bleeding. No NSAIDs or aspirin without doctor approval."
    },
    {
        "name": "Dextrose 50% (D50W) 50mL IV Push",
        "generic_name": "Dextrose 50%",
        "category": "IV Hypoglycaemia Reversal Agent",
        "care_setting": "IPD",
        "route": "Intravenous Push",
        "dosage_forms": "50mL prefilled syringe (50% dextrose = 25g glucose)",
        "standard_dosage": "25g (50mL D50W) IV over 3–5 minutes for symptomatic hypoglycaemia. May repeat once if glucose < 70 mg/dL after 15 min.",
        "syringe_specs": {
            "type": "Prefilled Syringe / Large Bore 50mL Luer-Lock",
            "capacity_ml": 50.0,
            "concentration": "50% Dextrose (500mg/mL) = 25g/50mL",
            "rate": "Give slowly over 3–5 minutes — rapid push causes vein sclerosis",
            "needle_gauge": "18–20 G (large bore for viscous solution)",
            "technique": [
                "Confirm patent IV access — extravasation causes tissue necrosis.",
                "Give over 3–5 minutes minimum.",
                "Check blood glucose 15 minutes after administration.",
                "Follow with oral glucose or IV dextrose infusion to prevent rebound hypoglycaemia.",
                "Document time, dose, and pre/post glucose levels."
            ]
        },
        "meal_timing": {"timing_rule": "emergency_as_needed", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Emergency IV treatment — meal timing not applicable."},
        "sugar_impact_notes": "Rapidly raises blood glucose. Post-treatment: monitor glucose every 30 minutes for 2 hours to detect rebound hypoglycaemia.",
        "indications": "Severe symptomatic hypoglycaemia (< 50 mg/dL), unconscious hypoglycaemic patient, DKA fluid management.",
        "contraindications": "Hyperglycaemia (glucose > 200 mg/dL without concurrent insulin cover), anuria.",
        "adverse_effects": "Hyperglycaemia rebound, fluid overload, hyponatraemia, phlebitis/extravasation injury.",
        "avoid_foods": [],
        "avoid_drinks": [],
        "patient_instructions": "Emergency medication — administered by clinical staff only in hospital setting."
    },
    {
        "name": "Furosemide (Lasix) 20mg/2mL Injection",
        "generic_name": "Furosemide",
        "category": "Loop Diuretic",
        "care_setting": "BOTH",
        "route": "Intravenous / Intramuscular / Oral Tablet",
        "dosage_forms": "Injection 10mg/mL (2mL ampoule); Tablet 20mg, 40mg, 80mg",
        "standard_dosage": "Oral (OPD): 20–40mg once or twice daily. IV (IPD): 20–40mg slow IV push over 2 min; max 600mg/day in severe oedema.",
        "syringe_specs": {
            "type": "Luer-Lock Syringe",
            "capacity_ml": 5.0,
            "iv_rate": "Give IV slowly at 4mg/min maximum — too fast causes ototoxicity (deafness).",
            "im_needle_gauge": "21–23 G",
            "im_needle_length_mm": "38 mm",
            "injection_angle_degrees": "90° IM",
            "technique": [
                "IV: Administer at ≤ 4mg/min. Monitor urine output and electrolytes.",
                "IM: Inject deep into large muscle. Avoid sciatic nerve region.",
                "Monitor for dehydration, hyponatraemia, hypokalaemia."
            ]
        },
        "meal_timing": {"timing_rule": "morning_preferred", "preprandial_mins": None, "postprandial_hours": None, "food_instructions": "Oral tablets: take in the morning to avoid nocturnal urination. Can take with food if stomach upset."},
        "sugar_impact_notes": "May raise blood glucose in diabetics. Monitor glucose more frequently when starting furosemide.",
        "indications": "Oedema (cardiac, hepatic, renal), hypertension, acute pulmonary oedema (IV), hypercalcaemia.",
        "contraindications": "Anuria, sulfonamide allergy, electrolyte depletion, severe dehydration.",
        "adverse_effects": "Hypokalaemia, hyponatraemia, dehydration, ototoxicity (high IV doses), photosensitivity.",
        "avoid_foods": ["Low-potassium diet worsens hypokalaemia — eat potassium-rich foods: banana, orange, potato", "Salty/high-sodium foods (counteracts diuretic effect)"],
        "avoid_drinks": ["Alcohol", "Excessive caffeine"],
        "patient_instructions": "Take in morning. Monitor urine output. Eat potassium-rich foods (bananas, tomatoes, oranges). Rise slowly from bed. Report muscle cramps or extreme thirst."
    }
]


def seed_formulary():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM medicines_formulary")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
    now = datetime.now(timezone.utc).isoformat()
    for med in FORMULARY_SEED:
        mid = f"form-{uuid.uuid4().hex[:10]}"
        cursor.execute("""
        INSERT INTO medicines_formulary (
            id, name, generic_name, category, care_setting, route, dosage_forms,
            standard_dosage, syringe_specs_json, meal_timing_json, sugar_impact_notes,
            indications, contraindications, adverse_effects, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            mid, med["name"], med["generic_name"], med["category"], med["care_setting"],
            med["route"], med["dosage_forms"], med["standard_dosage"],
            json.dumps(med.get("syringe_specs")), json.dumps(med.get("meal_timing")),
            med.get("sugar_impact_notes", ""), med["indications"],
            med["contraindications"], med["adverse_effects"], now
        ))
    conn.commit()
    conn.close()


@router.get("")
def list_formulary(care_setting: str = Query("ALL"), search: str = Query("")):
    seed_formulary()
    conn = get_connection()
    cursor = conn.cursor()
    if care_setting in ["OPD", "IPD"]:
        cursor.execute(
            "SELECT * FROM medicines_formulary WHERE care_setting = ? OR care_setting = 'BOTH'",
            (care_setting,)
        )
    else:
        cursor.execute("SELECT * FROM medicines_formulary")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        for field in ["syringe_specs_json", "meal_timing_json"]:
            try:
                d[field.replace("_json", "")] = json.loads(d.pop(field) or "null")
            except Exception:
                d[field.replace("_json", "")] = None
        # Attach avoid_foods from seed
        for seed in FORMULARY_SEED:
            if seed["generic_name"].lower() in d["generic_name"].lower():
                d["avoid_foods"] = seed.get("avoid_foods", [])
                d["avoid_drinks"] = seed.get("avoid_drinks", [])
                d["patient_instructions"] = seed.get("patient_instructions", "")
                break
        result.append(d)
    if search:
        sl = search.lower()
        result = [r for r in result if sl in r.get("name", "").lower() or sl in r.get("generic_name", "").lower() or sl in r.get("category", "").lower()]
    return result


@router.get("/opd")
def get_opd_medicines():
    return list_formulary(care_setting="OPD", search="")


@router.get("/ipd")
def get_ipd_medicines():
    return list_formulary(care_setting="IPD", search="")


@router.get("/{medicine_id}")
def get_medicine_detail(medicine_id: str):
    seed_formulary()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medicines_formulary WHERE id = ?", (medicine_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Medicine not found in formulary.")
    d = dict(row)
    for field in ["syringe_specs_json", "meal_timing_json"]:
        try:
            d[field.replace("_json", "")] = json.loads(d.pop(field) or "null")
        except Exception:
            d[field.replace("_json", "")] = None
    for seed in FORMULARY_SEED:
        if seed["generic_name"].lower() in d["generic_name"].lower():
            d["avoid_foods"] = seed.get("avoid_foods", [])
            d["avoid_drinks"] = seed.get("avoid_drinks", [])
            d["patient_instructions"] = seed.get("patient_instructions", "")
            break
    return d
