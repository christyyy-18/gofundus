# PostgreSQL Migration

Production uses PostgreSQL when `DATABASE_URL` is set. SQLite is retained only for local development with `DJANGO_DEBUG=True`.

## Export the current local database

From the `backend` directory, with the local SQLite configuration enabled:

```powershell
python manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --indent 2 > data.json
```

Keep `data.json` private. It contains account and application data and is ignored by Git.

## Prepare the hosted database

Set these environment variables on the backend host:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<fresh-secret>
DATABASE_URL=<hosted-postgresql-url>
DJANGO_ALLOWED_HOSTS=<backend-domain>
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
CSRF_TRUSTED_ORIGINS=https://<frontend-domain>
```

Run migrations on the hosted database:

```bash
python manage.py migrate
```

Load the private fixture using the hosted database environment:

```bash
python manage.py loaddata data.json
```

For a clean dataset instead of the current SQLite records, run the existing management commands after `migrate`, such as `load_hk_datasets` and the project seed command.