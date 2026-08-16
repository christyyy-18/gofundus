from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    InstitutionViewSet, InterestStatementViewSet, NotificationViewSet,
    match_donor_interests, get_or_run_clusters, register_user, login_user,
    get_my_profile, notify_institution_update
)

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet, basename='institution')
router.register(r'interest-statements', InterestStatementViewSet, basename='interest-statement')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('match/', match_donor_interests, name='match-donor-interests'),
    path('clusters/', get_or_run_clusters, name='clusters'),
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('profile/me/', get_my_profile, name='profile-me'),
    path('institutions/<int:pk>/notify_update/', notify_institution_update, name='notify-institution-update'),
]

