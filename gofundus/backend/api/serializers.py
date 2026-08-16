from rest_framework import serializers
from django.contrib.auth.models import User
from api.models import UserProfile, Donor, Institution, InterestStatement, Cluster, Match, Notification

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone']


class DonorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Donor
        fields = ['id', 'user', 'location_lat', 'location_lng', 'preferred_causes']


class InstitutionSerializer(serializers.ModelSerializer):
    days_since_funding_update = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'district', 'address', 'cause_description',
            'gps_lat', 'gps_lng', 'children_count', 'funding_gap',
            'most_lacking_need', 'funding_last_updated', 'days_since_funding_update',
            'contact_email', 'contact_phone', 'cluster_id', 'created_at'
        ]

    def get_days_since_funding_update(self, obj):
        if obj.funding_last_updated:
            from datetime import date
            return (date.today() - obj.funding_last_updated).days
        return None  # None means "never confirmed" — treat as unknown freshness


class InterestStatementSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.user.get_full_name', read_only=True)

    class Meta:
        model = InterestStatement
        fields = ['id', 'donor', 'donor_name', 'text', 'submitted_at']


class MatchSerializer(serializers.ModelSerializer):
    institution = InstitutionSerializer(read_only=True)

    class Meta:
        model = Match
        fields = [
            'id', 'donor', 'institution', 'similarity_score',
            'priority_score', 'final_rank', 'generated_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'donor', 'message', 'is_read', 'created_at']
