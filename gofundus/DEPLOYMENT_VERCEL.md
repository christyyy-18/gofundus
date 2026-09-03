# Deploying GoFundUs to Vercel

GoFundUs can be hosted on Vercel with two separate linked projects (Frontend + Backend) or deployed via GitHub.

---

## 1. Backend Deployment (Django + Neon PostgreSQL)

### Option A: Using Vercel Web Dashboard
1. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
2. Under **Root Directory**, click **Edit** and select **`backend`**.
3. Framework Preset: **Other**.
4. Add the following **Environment Variables**:
   - `DATABASE_URL`: `<your-Neon-PostgreSQL-connection-string>`
   - `DJANGO_SECRET_KEY`: `<your-production-secret-key>`
   - `DJANGO_DEBUG`: `False`
   - `DJANGO_ALLOWED_HOSTS`: `.vercel.app`
   - `CORS_ALLOWED_ORIGINS`: `https://<your-frontend-project>.vercel.app`
   - `CSRF_TRUSTED_ORIGINS`: `https://<your-frontend-project>.vercel.app,https://*.vercel.app`
5. Click **Deploy**.
6. Note down your backend URL (e.g., `https://gofundus-api.vercel.app`).

### Option B: Using Vercel CLI
```bash
cd backend
vercel
# Follow the interactive prompts, select backend root directory
vercel --prod
```

---

## 2. Frontend Deployment (React + Vite SPA)

### Option A: Using Vercel Web Dashboard
1. Go to [vercel.com/new](https://vercel.com/new) and import your repository again for the frontend.
2. Under **Root Directory**, click **Edit** and select **`frontend`**.
3. Framework Preset: **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
4. Add the following **Environment Variables**:
   - `VITE_API_URL`: `https://<your-backend-project>.vercel.app/api`
   - `VITE_PAYSTACK_PUBLIC_KEY`: `pk_live_...` (or `pk_test_...` for testing)
5. Click **Deploy**.

### Option B: Using Vercel CLI
```bash
cd frontend
vercel
# Follow interactive prompts, select frontend root directory
vercel --prod
```

---

## 3. Post-Deployment Verification Checklist
- [ ] Visit `https://<your-backend-project>.vercel.app/api/institutions/` — should return list of institutions from Neon DB.
- [ ] Visit `https://<your-frontend-project>.vercel.app` — test Login (`chris` / `chris123` or `admin` / `GoFundUs@2026`).
- [ ] Test AI Matchmaker query on the live frontend.
- [ ] Verify Support ticket submission and Paystack donation modal.
