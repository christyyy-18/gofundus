from django.http import HttpResponse
import os

# Path to the built frontend index.html (adjust if using dev server)
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
INDEX_PATH = os.path.join(FRONTEND_DIR, 'index.html')

def serve_frontend(request, *args, **kwargs):
    """Serve the SPA index.html for any route not matched by other Django URLs.
    This enables client‑side routing via React Router.
    """
    try:
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse('Frontend not built. Run `npm run build`.', status=500)
