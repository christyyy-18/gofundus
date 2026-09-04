# Deploying the GoFundUs Frontend to Vercel

The backend runs on Render (see `DEPLOYMENT_RENDER.md`) — Vercel hosts the frontend only, as one dedicated project.

---

## 1. Frontend Deployment (React + Vite SPA)

1. [vercel.com/new](https://vercel.com/new) → import the repository.
2. Open the Vercel project **Settings > General > Root Directory**.
3. Set Root Directory to **`frontend`** and save it.
4. Framework Preset: **Vite**. The committed `frontend/vercel.json` defines the install command, build command, and output directory.
5. Add the following **Environment Variables**:
   - `VITE_API_URL`: `https://gofundus-api.onrender.com/api`
   - `VITE_PAYSTACK_PUBLIC_KEY`: `pk_live_...` (or `pk_test_...` for testing)
   - `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET`: for profile photo uploads
   - `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID`: for Google sign-in
6. Click **Deploy** or trigger a redeploy.

### Using Vercel CLI
```bash
cd frontend
vercel
vercel --prod
```

---

## 2. Post-Deployment Verification Checklist
- [ ] Visit `https://gofundus-api.onrender.com/api/institutions/` — should return the list of institutions from Neon DB.
- [ ] Visit your frontend's Vercel URL — test Login (`chris` / `chris123` or `admin` / `GoFundUs@2026`).
- [ ] Test AI Matchmaker query on the live frontend.
- [ ] Verify Support ticket submission and Paystack donation modal.

## 3. Institution Data Synchronization

To update the database with the currently verified Ghana dataset, run from `backend` (via Render's dashboard, since there's no local database access by default):

```bash
python manage.py sync_ashanti_institutions
```

This replaces all existing institution records, including test records. The current records are limited to organizations documented by [Light for Children](https://www.lightforchildren.com/orphanages), [SOS Children's Villages](https://www.sos-childrensvillages.org/where-we-help/africa/ghana/kumasi), [Kumasi Children's Home](https://kumasichildrenshome.mogcsp.gov.gh/), and [Osu Children's Home](https://osuchildrenshome.gov.gh/). The UNICEF/MoGCSP mapping identified 115 homes nationally in 2016; this fixture is not presented as a complete current registry. Children counts, funding gaps, emails, and phone numbers are left unconfirmed until supplied by the institutions or Ghana social welfare authorities.

For a demo with 5 real, verified Kumasi institutions plus 5 clearly-fictional placeholder records (broadened need-category coverage for testing the AI matcher), run:

```bash
python manage.py seed_ghana_demo_institutions
```
