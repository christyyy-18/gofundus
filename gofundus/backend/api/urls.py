from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    InstitutionViewSet, InterestStatementViewSet, NotificationViewSet,
    match_donor_interests, get_or_run_clusters, register_user, login_user,
    get_my_profile, notify_institution_update, logout_user, csrf_token,
    send_support_inquiry, send_institution_contact,
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
    path('auth/logout/', logout_user, name='logout'),
    path('auth/csrf/', csrf_token, name='csrf-token'),
    path('profile/me/', get_my_profile, name='profile-me'),
    path('institutions/<uuid:pk>/notify_update/', notify_institution_update, name='notify-institution-update'),
    path('institutions/<uuid:pk>/contact/', send_institution_contact, name='institution-contact'),
    path('support/inquiry/', send_support_inquiry, name='support-inquiry'),
]

