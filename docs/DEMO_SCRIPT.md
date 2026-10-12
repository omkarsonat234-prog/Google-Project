# MedBridge — 90-Second Hackathon Live Demo Script

**Track**: Healthcare & Wellness  
**Presenter Goal**: Demonstrate the end-to-end verified workflow from prescription to active routine in under 90 seconds.

---

### Step 0: The Quick Setup (0:00 - 0:08)
- **Action**: Open `http://localhost:5173/` in your browser.
- **Presenter**: *"Welcome to MedBridge: From prescription to a clearer medication routine. Most medication reminder apps assume transcription is flawless. MedBridge bridges this safety gap by connecting extraction directly to physical sources, enforcing uncertainty detection, human verification gates, and distinct reminder tracking."*

---

### Step 1: The Dashboard & Architecture Transparency (0:08 - 0:20)
- **Action**: Click the **System Architecture** pill in the top header.
- **Presenter**: *"Notice our transparent architecture panel. When Google Cloud credentials are configured, MedBridge connects directly to Cloud Vision and Gemini 2.0. In hackathon presentation environments without active billing, our high-fidelity local adapters run with zero fabricated claims."*

---

### Step 2: Upload & Interactive Presets (0:20 - 0:35)
- **Action**: Navigate to **Upload & Review**. Click the preset **"Clear & Specified Prescription (Amoxicillin 500mg)"**.
- **Presenter**: *"We process the physical prescription slip. Look at the left panel: when I hover over 'Medicine Name', 'Strength', or 'Instructions' on the right, MedBridge dynamically highlights the exact bounding box and line coordinate on the physical prescription slip. Users can verify transcription instantly against the raw document."*

---

### Step 3: Demonstrating Uncertainty Detection (0:35 - 0:50)
- **Action**: Click the preset **"Blurry / Partially Illegible Prescription (Metformin 500mg)"**.
- **Presenter**: *"Now observe what happens with ambiguous handwriting. The OCR text detected smudged symbols. Instead of hallucinating a dangerous dose, MedBridge flags the field in amber: 'Schedule Activation Blocked: Cannot safely infer tablet count'. If we try to activate this directly..."*
- **Action**: Click **Review & Activate Routine**. Notice the amber alert: *"Uncertain fields remain unresolved."*
- **Presenter**: *"The Verification Gate strictly blocks activation until a human verifies or corrects the instruction with a clinician."*

---

### Step 4: The Verification Gate (0:50 - 1:05)
- **Action**: Switch back to the **Amoxicillin** prescription or click **Edit & Correct Fields** to correct the text. Click **Review & Activate Routine**.
- **Presenter**: *"Here is our human verification gate. Notice the honest labeling: because I am logged in as a patient or caregiver, the routine is marked as 'User-Reviewed Schedule' rather than claiming fake clinical certification. I confirm the safety checklist, verify daily times (08:00, 20:00), and activate the routine."*
- **Action**: Click **Confirm & Activate Routine**.

---

### Step 5: Verified Schedule & Accountable Reminders (1:05 - 1:20)
- **Action**: Navigate to **Reminders** (or click **Test Live Alert** in the bottom floating toolbar).
- **Presenter**: *"The active schedule generates accountable reminders. Listen to the Web Audio chime. Notice the crucial clinical distinction: clicking 'Acknowledge Alert' notes that the notification was seen, but does NOT claim the pill was swallowed. Only when the patient explicitly clicks 'Mark as Taken' is the dose recorded in the medical audit log."*
- **Action**: Click **Acknowledge Alert** on one card, and **Mark as Taken** on the other.

---

### Step 6: Immutable Forensic History & Wrap-Up (1:20 - 1:30)
- **Action**: Click **Activity & Audit**.
- **Presenter**: *"Every step — OCR ingestion, field corrections, verification gate timestamps, alert acknowledgments, and intake reports — is preserved in our immutable audit trail. MedBridge brings patient safety, transparency, and clarity to daily prescription management. Thank you!"*
