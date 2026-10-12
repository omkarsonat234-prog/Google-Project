# MedBridge — Prescription Understanding & Medication Routine Assistant

> **Tagline**: From prescription to a clearer medication routine.  
> **One-Line Pitch**: MedBridge helps patients and caregivers turn prescriptions into understandable daily medication routines through source-linked extraction, uncertainty detection, professional verification, and reminders.  
> **Hackathon Track**: Healthcare & Wellness

---

## 1. Problem & Solution

### The Problem
Patients and caregivers frequently struggle to interpret written prescriptions, dosage instructions, and schedules. Basic reminder apps only notify — they cannot verify whether prescription instructions were extracted accurately or understood correctly. Blind reliance on OCR or generative AI without human verification can lead to dangerous dosing errors.

### The MedBridge 5-Step Solution
1. **Upload or Capture**: Secure ingestion of prescription slips or PDFs.
2. **OCR Extraction**: Verbatim text extraction preserving raw unedited text streams.
3. **Source Linking**: Interactive side-by-side view highlighting exact coordinates on the prescription slip.
4. **Uncertainty Gate**: Automated detection of illegible, ambiguous, missing, or conflicting directions that strictly blocks routine activation.
5. **Verified Routine & Reminders**: Clear daily medication routines created only after human verification, with distinct alert acknowledgment vs. reported intake tracking.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Web Audio API.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2, Pillow.
- **OCR**: Google Cloud Vision API (`vision.ImageAnnotatorClient`) with High-Fidelity Local Optical Adapter.
- **AI Structuring**: Google Gemini API (`gemini-1.5-pro` / `gemini-2.0`) with Clinical Rule & Uncertainty Engine.
- **Data Persistence**: SQLite persistent store (`medbridge.db`) with relational integrity and immutable audit logs.
- **Reminders**: Real-time Web Audio synthesized chime and in-app alert notification engine.
- **Containerization**: Google Cloud Run ready (`Dockerfile` compatible).

---

## 3. Project Directory Structure

```text
Google Project/
├── backend/
│   ├── app/
│   │   ├── config.py                 # Configuration & GCP status inspector
│   │   ├── main.py                   # FastAPI app & lifecycle manager
│   │   ├── models/
│   │   │   ├── database.py           # SQLite persistence & audit logging
│   │   │   └── schemas.py            # Pydantic models for Rx, Meds, Schedules, Reminders
│   │   ├── services/
│   │   │   ├── ocr_service.py        # Cloud Vision OCR & transparent adapter
│   │   │   ├── gemini_service.py     # Gemini structuring & strict uncertainty analyzer
│   │   │   ├── verification_service.py # Verification gate enforcement & schedule versioning
│   │   │   ├── reminder_service.py   # Reminders & intake vs acknowledgment tracking
│   │   │   └── sample_prescriptions.py # 5 clinical test cases & image generator
│   │   ├── routes/
│   │   │   ├── prescriptions.py      # Upload & preset loading endpoints
│   │   │   ├── medications.py        # Corrections & verification gate
│   │   │   ├── schedules.py          # Non-destructive versioned schedules
│   │   │   ├── reminders.py          # Acknowledge vs mark-as-taken endpoints
│   │   │   ├── caregivers.py         # Explicit consent management
│   │   │   ├── audit.py              # Forensic activity trail
│   │   │   ├── demo.py               # Instant seed & reset endpoints
│   │   │   └── system.py             # System status & live dashboard stats
│   │   └── static/
│   │       ├── samples/              # Generated synthetic clinical Rx images
│   │       └── uploads/              # Secure uploads folder
│   ├── tests/
│   │   └── test_backend.py           # 10 automated pytest test cases (100% passing)
│   ├── requirements.txt
│   └── run.py                        # Backend runner script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Header with role switcher & system badge
│   │   │   ├── Footer.tsx            # Disclaimers & Google stack summary
│   │   │   ├── DisclaimerBanner.tsx  # Safety notices
│   │   │   ├── SystemStatusBadge.tsx # Genuine GCP vs Adapter audit modal
│   │   │   ├── SourceLinkedViewer.tsx # Side-by-side Rx slip & bounding box link
│   │   │   ├── UncertaintyAlert.tsx  # Amber warning box for missing/blurry data
│   │   │   ├── VerificationGateModal.tsx # Safety checklist & verifier role stamp
│   │   │   ├── ReminderNotification.tsx # Web Audio chime toast
│   │   │   └── DemoRunnerBar.tsx     # Floating 90s speed-run toolbar
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # 5-step workflow overview & CTA
│   │   │   ├── DashboardPage.tsx     # Real statistics & today's reminders
│   │   │   ├── UploadPage.tsx        # Upload & source-linked review workspace
│   │   │   ├── SchedulePage.tsx      # Versioned daily routine timeline
│   │   │   ├── RemindersPage.tsx     # Acknowledge alert vs report intake
│   │   │   ├── CaregiverPage.tsx     # Consent-based caregiver access
│   │   │   ├── HistoryPage.tsx       # Forensic audit log
│   │   │   └── EvaluationPage.tsx    # Measurable benchmark report
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Patient / Caregiver / Reviewer role switcher
│   │   │   └── ReminderAudioContext.tsx # Web Audio tone generator
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   ├── ARCHITECTURE.md               # Technical architecture & sequence diagrams
│   ├── DEMO_SCRIPT.md                # 90-second judge presentation walkthrough
│   └── EVALUATION_REPORT.md          # Benchmark metrics & automated test report
└── README.md
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Step 1: Install Backend Dependencies & Start FastAPI
```bash
# In project root
python -m pip install -r backend/requirements.txt
python backend/run.py
```
*The backend starts at `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`).*

### Step 2: Install Frontend Dependencies & Start Vite
```bash
# In frontend directory
cd frontend
npm install
npm run dev
```
*The web app opens at `http://localhost:5173/`.*

---

## 5. Environment Variables & Genuine Google Cloud Configuration

MedBridge adheres to a **zero-fake-claims** standard. It operates seamlessly in dual modes:

| Variable | Description | If Provided | If Omitted |
|---|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP Service Account JSON with Cloud Vision API enabled. | Connects to live Google Cloud Vision OCR. | Uses high-fidelity local optical adapter with coordinate matching. |
| `GEMINI_API_KEY` | Google AI Studio or Vertex AI API Key. | Connects to live Google Gemini 2.0 / 1.5 Pro API. | Uses high-fidelity local clinical rule & uncertainty engine. |
| `PORT` | Server port (default: 8000). | Configures custom server port. | Defaults to 8000. |

*To inspect connection status anytime in the app, click the **System Architecture** badge in the top navigation bar.*

---

## 6. How to Run the Automated Test Suite

MedBridge comes with an automated Python test suite verifying upload, uncertainty triggers, verification gates, versioning, and distinct reminder states:

```bash
python -m pytest backend/tests/test_backend.py -v
```

**Test Coverage Highlights**:
- `test_clear_prescription_loading_and_source_linking`: Verifies OCR extraction and field bounding box links.
- `test_uncertainty_flagging_on_blurry_prescription`: Confirms illegible handwriting flags `instructions`, `frequency`, and `timing`.
- `test_missing_instructions_flagged`: Confirms "Use as directed" blocks schedule creation without hallucinating dosing times.
- `test_verification_gate_blocks_uncertain_activation`: Verifies HTTP 422 block when unresolved uncertainties attempt activation.
- `test_verification_gate_success_after_corrections`: Verifies activation after human corrections are logged.
- `test_reminder_acknowledgement_distinct_from_intake`: Proves `acknowledged` does **not** record medication intake.
- `test_schedule_versioning_audit`: Proves schedule edits advance versions (`v1` → `v2`) without overwriting previous data.

---

## 7. The 90-Second Live Hackathon Demo Flow

Use the floating **Hackathon 90s Demo Suite** toolbar at the bottom of the screen:

1. **Dashboard Overview**: Inspect live counts (Prescriptions, Awaiting Verification, Active Schedules, Today's Reminders).
2. **Upload & Presets**: Open **Upload & Review**. Click **Sample 1: Clear Amoxicillin**. Hover over fields on the right to see the exact bounding box light up on the prescription slip.
3. **Demonstrate Uncertainty Detection**: Click **Sample 2: Blurry Metformin**. Observe the amber banner: *"Schedule Activation Blocked: Cannot safely infer tablet count"*. Click **Review & Activate Routine** to demonstrate the Verification Gate blocking incomplete activation.
4. **Verification Gate**: Correct the text or switch to **Sample 1**. Click **Review & Activate Routine**. Notice the honest status: *"User-Reviewed Schedule"*. Confirm checklist and daily times (`08:00`, `20:00`) to activate.
5. **Accountable Reminders**: Go to **Reminders** (or click **Test Live Alert**). Listen to the Web Audio chime. Click **Acknowledge Alert** — notice it notes notification delivery without marking the pill as swallowed. Click **Mark as Taken** to separately record user intake.
6. **Caregiver Consent**: Visit **Caregiver** to observe consent-restricted schedule sharing.
7. **Forensic Audit Log**: Open **Activity & Audit** to view the immutable ledger recording every OCR, human correction, verification, and intake event.

---

## 8. Genuine vs. Simulated Architecture Disclosure

In accordance with hackathon transparency guidelines:
- **Genuinely Live & Functional**:
  - React + TypeScript + Tailwind responsive user interface.
  - Python FastAPI REST backend.
  - SQLite persistent database with relational constraints and immutable audit logging.
  - Human Verification Gate enforcing safety checklists and preventing schedule creation on unverified data.
  - Non-destructive schedule versioning engine.
  - Distinction between reminder alert delivery, alert acknowledgment, and intake self-report.
  - Web Audio synthesized notification chime.
  - Role switcher (Patient, Caregiver, Pharmacist, Physician).
  - Automated 10-test verification suite.
- **Adaptive Fallback Engine**:
  - If GCP Cloud Vision credentials or Gemini API keys are omitted, MedBridge runs transparent local clinical adapters rather than failing or fabricating fake API responses. The System Status badge clearly identifies the operating mode.

---

## 9. Google Cloud Run Deployment

To deploy MedBridge to Google Cloud Run:

```bash
# Build & deploy container to Cloud Run
gcloud builds submit --tag gcr.io/[PROJECT_ID]/medbridge
gcloud run deploy medbridge \
  --image gcr.io/[PROJECT_ID]/medbridge \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=[KEY],GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcp-key.json
```

---

## 10. Medical Safety Disclaimer
> **Important**: MedBridge is an assistive workflow and organization assistant. It does not provide medical diagnosis, clinical prescription decisions, or dosage recommendations. Always confirm unclear, ambiguous, or altered medication instructions directly with a licensed physician or pharmacist.
