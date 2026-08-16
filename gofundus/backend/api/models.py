from django.db import models
from django.contrib.auth.models import User
import uuid

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('donor', 'Donor'),
        ('institution_admin', 'Institution Administrator'),
        ('system_admin', 'System Administrator'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='donor')
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Donor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='donor_profile')
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, default=6.6885)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, default=-1.6244)
    preferred_causes = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Donor: {self.user.get_full_name() or self.user.username}"


class Institution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='institution_profile')
    name = models.CharField(max_length=200)
    cause_description = models.TextField()
    district = models.CharField(max_length=100, default='Kumasi Metropolitan')
    address = models.CharField(max_length=255)
    gps_lat = models.DecimalField(max_digits=9, decimal_places=6)
    gps_lng = models.DecimalField(max_digits=9, decimal_places=6)
    children_count = models.PositiveIntegerField(default=0)
    funding_gap = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # GHS
    most_lacking_need = models.CharField(max_length=100, default='Food & Groceries', blank=True)
    # Tracks when an admin last confirmed the funding_gap figure — used as a
    # data-freshness signal for donors, NOT as a donation-amount ledger.
    funding_last_updated = models.DateField(null=True, blank=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    cluster_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class InterestStatement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='interest_statements')
    text = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Statement by {self.donor} at {self.submitted_at.strftime('%Y-%m-%d %H:%M')}"


class Cluster(models.Model):
    cluster_id = models.IntegerField(primary_key=True)
    centroid_lat = models.DecimalField(max_digits=9, decimal_places=6)
    centroid_lng = models.DecimalField(max_digits=9, decimal_places=6)
    silhouette_score = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cluster {self.cluster_id} (Silhouette: {self.silhouette_score:.3f})"


class Match(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='matches')
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='matches')
    statement = models.ForeignKey(InterestStatement, on_delete=models.SET_NULL, null=True, blank=True)
    similarity_score = models.FloatField()
    priority_score = models.FloatField()
    final_rank = models.IntegerField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['final_rank']

    def __str__(self):
        return f"Match #{self.final_rank}: {self.institution.name} for {self.donor}"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert for {self.donor}: {self.message[:30]}..."
