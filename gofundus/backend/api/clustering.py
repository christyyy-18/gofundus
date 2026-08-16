import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from api.models import Institution, Cluster

def perform_kmeans_clustering(min_k=2, max_k=5):
    """
    Algorithm 2: Geospatial Clustering (K-Means & Silhouette Validation)
    1. Retrieves GPS coordinates (lat, lng) of all Kumasi orphanages.
    2. Runs K-Means for k = min_k .. max_k.
    3. Evaluates optimal k using Silhouette Coefficient.
    4. Updates cluster assignments on Institution records and stores Cluster centroids.
    """
    institutions = list(Institution.objects.all())
    if len(institutions) < min_k:
        return {"status": "skipped", "reason": "Insufficient institutions for clustering"}

    coords = np.array([[float(inst.gps_lat), float(inst.gps_lng)] for inst in institutions])

    best_k = min_k
    best_score = -1.0
    best_kmeans = None

    # Test candidate cluster sizes
    upper_k = min(max_k + 1, len(institutions))
    for k in range(min_k, upper_k):
        try:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(coords)
            score = silhouette_score(coords, labels) if len(np.unique(labels)) > 1 else 0.0
            if score > best_score:
                best_score = score
                best_k = k
                best_kmeans = kmeans
        except Exception as e:
            print(f"K-Means iteration k={k} error:", e)

    if best_kmeans is not None:
        labels = best_kmeans.labels_
        centroids = best_kmeans.cluster_centers_

        # Clear old clusters
        Cluster.objects.all().delete()

        # Save new clusters
        cluster_objects = {}
        for idx, (c_lat, c_lng) in enumerate(centroids):
            cluster_obj = Cluster.objects.create(
                cluster_id=idx + 1,
                centroid_lat=round(c_lat, 6),
                centroid_lng=round(c_lng, 6),
                silhouette_score=round(best_score, 4)
            )
            cluster_objects[idx] = cluster_obj

        # Assign each institution to its cluster
        for idx, inst in enumerate(institutions):
            assigned_cluster_id = int(labels[idx]) + 1
            inst.cluster_id = assigned_cluster_id
            inst.save()

        return {
            "status": "success",
            "optimal_k": best_k,
            "silhouette_score": round(best_score, 4),
            "centroids": [
                {"cluster_id": idx + 1, "lat": round(c[0], 6), "lng": round(c[1], 6)}
                for idx, c in enumerate(centroids)
            ]
        }

    return {"status": "error", "reason": "Clustering algorithm failed"}
