import math
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from api.models import UserProfile, Donor, Institution, InterestStatement, Cluster, Match, Notification
from api.serializers import (
    UserSerializer, DonorSerializer, InstitutionSerializer,
    InterestStatementSerializer, MatchSerializer, NotificationSerializer
)
from api.clustering import perform_kmeans_clustering

class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.all().order_by('-children_count')
    serializer_class = InstitutionSerializer

    def get_queryset(self):
        queryset = Institution.objects.all()
        district = self.request.query_params.get('district')
        search = self.request.query_params.get('search')
        if district and district != 'All Districts':
            queryset = queryset.filter(district__icontains=district)
        if search:
            queryset = queryset.filter(cause_description__icontains=search) | queryset.filter(name__icontains=search)
        return queryset


class InterestStatementViewSet(viewsets.ModelViewSet):
    queryset = InterestStatement.objects.all().order_by('-submitted_at')
    serializer_class = InterestStatementSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer


@api_view(['GET', 'POST'])
def get_or_run_clusters(request):
    """
    Geospatial Clustering API:
    Executes or retrieves K-Means clusters and Silhouette validation score.
    """
    if request.method == 'POST' or not Cluster.objects.exists():
        res = perform_kmeans_clustering()
        return Response(res)
    
    clusters = Cluster.objects.all()
    institutions = Institution.objects.exclude(cluster_id__isnull=True)
    
    return Response({
        "status": "success",
        "optimal_k": clusters.count(),
        "silhouette_score": clusters.first().silhouette_score if clusters.exists() else 0.0,
        "clusters": [
            {
                "cluster_id": c.cluster_id,
                "centroid_lat": float(c.centroid_lat),
                "centroid_lng": float(c.centroid_lng),
                "institution_count": institutions.filter(cluster_id=c.cluster_id).count()
            }
            for c in clusters
        ]
    })


@api_view(['POST'])
def match_donor_interests(request):
    """
    Core AI Matching Endpoint:
    Receives free-text interest statement + optional donor location coordinates.
    Computes Semantic Cause Match + Priority Urgency Score -> Returns Ranked Institutions.
    """
    donor_text = request.data.get('interest_statement', '')
    donor_lat = float(request.data.get('lat', 6.6885))
    donor_lng = float(request.data.get('lng', -1.6244))

    if not donor_text:
        return Response({"error": "Please provide an interest statement text."}, status=status.HTTP_400_BAD_REQUEST)

    institutions = list(Institution.objects.all())
    if not institutions:
        return Response({"matches": []})

    # 1. Semantic Similarity Calculation (TF-IDF & Cosine Similarity)
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        corpus = [donor_text] + [inst.cause_description for inst in institutions]
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    except Exception as e:
        print("Scikit-learn TF-IDF fallback:", e)
        query_words = set(donor_text.lower().split())
        similarity_scores = []
        for inst in institutions:
            desc_words = set(inst.cause_description.lower().split())
            intersection = query_words.intersection(desc_words)
            score = len(intersection) / max(len(query_words), 1)
            similarity_scores.append(score)

    # 2. Priority Score & Aggregated Final Rank Calculation
    max_children = max([inst.children_count for inst in institutions] or [1])
    max_gap = max([float(inst.funding_gap) for inst in institutions] or [1.0])

    ranked_results = []
    w_sim      = 0.40   # semantic match (TF-IDF cosine similarity)
    w_children = 0.30   # institutional scale (children in care)
    w_gap      = 0.30   # self-reported financial need (funding_gap)
    # NOTE: time-since-last-update is intentionally excluded from scoring.
    # It is shown to donors as a data-freshness indicator only.

    for idx, inst in enumerate(institutions):
        sim_score = float(similarity_scores[idx])

        norm_children = inst.children_count / max_children
        norm_gap      = float(inst.funding_gap) / max_gap

        # Priority score: purely institutional scale + self-reported need.
        # No recency component — that signal is surfaced as data freshness below.
        priority_score = (w_children * norm_children) + (w_gap * norm_gap)
        
        # Combined Final Rank Score
        final_score = (w_sim * sim_score) + ((1 - w_sim) * priority_score)

        # Distance calculation (Haversine formula in km)
        d_lat = math.radians(float(inst.gps_lat) - donor_lat)
        d_lng = math.radians(float(inst.gps_lng) - donor_lng)
        a = math.sin(d_lat/2)**2 + math.cos(math.radians(donor_lat)) * math.cos(math.radians(float(inst.gps_lat))) * math.sin(d_lng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance_km = round(6371 * c, 2)

        # Data freshness label (for display only, not used in scoring)
        from datetime import date as _date
        days_since_update = (
            (_date.today() - inst.funding_last_updated).days
            if inst.funding_last_updated else None
        )
        if days_since_update is None:
            freshness_note = "Need info: not yet confirmed"
        elif days_since_update <= 7:
            freshness_note = f"Need confirmed {days_since_update}d ago"
        elif days_since_update <= 30:
            freshness_note = f"Need info: {days_since_update}d old"
        else:
            freshness_note = f"Need info: {days_since_update}d old — may be stale"

        ranked_results.append({
            "institution": InstitutionSerializer(inst).data,
            "similarity_score": round(sim_score, 4),
            "priority_score": round(priority_score, 4),
            "final_score": round(final_score, 4),
            "distance_km": distance_km,
            "match_reasons": [
                f"Semantic Cause Match: {int(sim_score * 100)}%",
                f"Children in Care: {inst.children_count}",
                f"Funding Gap: GHS {inst.funding_gap:,.2f}",
                f"Distance: {distance_km} km away in {inst.district}",
                freshness_note,
            ]
        })

    # Sort descending by final combined score
    ranked_results.sort(key=lambda x: x["final_score"], reverse=True)
    for index, item in enumerate(ranked_results):
        item["rank"] = index + 1

    return Response({
        "query": donor_text,
        "total_matched": len(ranked_results),
        "matches": ranked_results
    })


@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'donor')

    if not username or not password:
        return Response({"error": "Username and password required."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, role=role)
    if role == 'donor':
        Donor.objects.create(user=user)

    return Response({
        "message": "User registered successfully",
        "user": UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        "message": "Login successful",
        "user": UserSerializer(user).data
    })


@api_view(['GET'])
def get_my_profile(request):
    """
    Returns the full donor profile for a given username.
    Usage: GET /api/profile/me/?username=chris
    """
    username = request.query_params.get('username')
    if not username:
        return Response({"error": "username query param required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    profile = getattr(user, 'profile', None)
    role = profile.role if profile else 'donor'

    donor_data = None
    matches_data = []
    notifications_data = []

    if hasattr(user, 'donor_profile'):
        donor = user.donor_profile
        donor_data = DonorSerializer(donor).data
        matches = donor.matches.select_related('institution').order_by('final_rank')[:10]
        matches_data = MatchSerializer(matches, many=True).data
        notifications = donor.notifications.order_by('-created_at')[:10]
        notifications_data = NotificationSerializer(notifications, many=True).data

    return Response({
        "user": UserSerializer(user).data,
        "role": role,
        "donor": donor_data,
        "matches": matches_data,
        "notifications": notifications_data,
    })


@api_view(['POST'])
def notify_institution_update(request, pk):
    """
    Admin action: Sends an automated prompt/notification to an institution
    requesting them to update their operational funding gap & headcount.
    """
    try:
        inst = Institution.objects.get(pk=pk)
    except Institution.DoesNotExist:
        return Response({"error": "Institution not found"}, status=status.HTTP_404_NOT_FOUND)

    # Create a broadcast notification / log item
    from api.models import Donor
    donors = Donor.objects.all()
    for d in donors:
        Notification.objects.create(
            donor=d,
            message=f"Admin update requested for {inst.name} ({inst.district}). Needs refresh pending."
        )

    return Response({
        "status": "success",
        "message": f"Update notification successfully dispatched to {inst.name}.",
        "institution_id": inst.id
    })


