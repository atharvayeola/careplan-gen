# Specialty Pharmacy Care Plan Generator (Django + Next.js)

AI-assisted intake and care-plan generator for specialty pharmacy teams. Frontend is a guided wizard (Next.js 16 + Tailwind). Backend is Django REST with strong validation, persistence, and LLM integration.

## Overview
- **Validation:** zod on the client; DRF serializers on the server. Provider name↔NPI and patient name/DOB/sex↔MRN consistency checks prevent mismatched credentials.
- **Persistence & Logic:** Models + services handle deduplication (patients, providers), duplicate order warnings, and CSV export.
- **Transport:** REST endpoints for submit, care-plan generation, export, and credential validation.
- **AI:** Gemini-backed care plan generation.
- **Tests:** Unit + integration tests cover serializers, services, and API flows. Easy to extend.

## Quickstart (runs end-to-end)
1) **Prerequisites:** Docker/Docker Compose, Node.js 18+, Python 3.9+  
2) **Database:** `docker-compose up -d` (Postgres on 5433).  
3) **Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
Required env (`backend/.env`):
```
GEMINI_API_KEY=your-gemini-key   # if omitted, backend returns a mock care plan
DATABASE_URL=postgres://user:password@localhost:5433/lamarhealth  # optional; settings.py already points here
```
4) **Frontend:**
```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```
Open `http://localhost:3000` and complete the wizard.

## API Surface (transport)
- `POST /api/provider/validate/` — validates provider name/NPI pairing.
- `POST /api/patient/validate/` — validates patient name/DOB/sex vs MRN pairing.
- `POST /api/submit/` — persists provider/patient/order, warns on 24h duplicate meds, blocks duplicate patients.
- `POST /api/generate-care-plan/` — generates and stores a care plan for an order.
- `GET /api/export/` — downloads CSV of orders + patient/provider context.

## Tests (critical logic covered)
Backend (unit + integration):
```bash
cd backend
source venv/bin/activate
python manage.py test careplan
```
Frontend (placeholder smoke):
```bash
npm run test
```
Key coverage: serializers (NPI/MRN/date/required), services (dedupe, duplicate orders), views (submit flow, conflict handling), provider/patient credential validation.

## Project Structure (modular responsibilities)
- `backend/`
  - `careplan/models.py` — persistence schema for Provider, Patient, Order, CarePlan.
  - `careplan/serializers.py` — transport/validation boundaries (provider, patient, order, submit, credential checks).
  - `careplan/services.py` — business rules and DB access (dedupe, duplicate detection, creation helpers).
  - `careplan/views.py` — REST endpoints (submit, generate, export, provider/patient validation).
  - `careplan/llm.py` — Gemini prompt + mock fallback.
  - `careplan/test_*.py` — unit/integration tests.
- `src/`
  - `components/` — `PatientForm` wizard, `ExportButton`.
  - `lib/` — zod validation, API helpers/LLM stub.
  - `app/` — Next.js app shell/page.

## Operational Notes
- Duplicate patients are blocked; duplicate orders within 24h raise warnings but are allowed.
- Errors are sanitized (no PHI/keys) and rendered in red, monospace on the client.
- Running without `GEMINI_API_KEY` returns a mock care plan so the app remains demoable.
