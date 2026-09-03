# Deploying the GoFundUs Backend to Render

The backend can use the existing Neon PostgreSQL database. A Render PostgreSQL database is optional and should not be created when `DATABASE_URL` points to Neon.

## 1. Prepare Neon

1. In the Neon dashboard, create or select the production project and database.
2. Copy the pooled PostgreSQL connection string.
3. Keep the connection string private. Do not commit it to the repository.
4. Confirm the Neon database allows connections from Render.

## 2. Create the Render service

1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select the repository and deploy the Blueprint.
4. Render will read `render.yaml` and create the `gofundus-api` web service.
5. Do not create a Render PostgreSQL database for this setup.

The Blueprint uses:

```text
Root directory: backend
Build command: pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
Start command: gunicorn config.wsgi:application
Health check: /api/institutions/
```

## 3. Set environment variables

In the Render service environment settings, add:

```text
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<strong-random-production-secret>
DJANGO_ALLOWED_HOSTS=gofundus-api.onrender.com
DATABASE_URL=<your-Neon-connection-string>
CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
CSRF_TRUSTED_ORIGINS=https://<your-frontend-domain>
```

Replace the host and frontend domain with the actual values. Add custom domains to these comma-separated variables when applicable.

Optional email settings:

```text
EMAIL_HOST=<smtp-host>
EMAIL_PORT=587
EMAIL_HOST_USER=<smtp-user>
EMAIL_HOST_PASSWORD=<smtp-password>
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=<verified-sender-email>
```

## 4. Deploy and verify

1. Trigger the first deployment.
2. Wait for the build command to run migrations and collect static files.
3. Open:

```text
https://gofundus-api.onrender.com/api/institutions/
```

4. Confirm that the response contains the records from Neon.
5. In the frontend deployment, set:

```text
VITE_API_URL=https://gofundus-api.onrender.com/api
```

6. Redeploy the frontend and test login, registration, institution listings, matching, support messages, and donations.

## Important database notes

- Run migrations only against the production Neon database.
- Back up Neon before the first production migration.
- Do not commit `DATABASE_URL`, SMTP passwords, or other secrets.
- If the Neon connection string currently exists in any committed documentation, rotate that database password and replace the documentation with a placeholder.