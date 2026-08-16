"""
Management command: seed_chris
Creates (or updates) the 'chris' donor account with dummy track data.
Run: python manage.py seed_chris
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from datetime import date, timedelta

from api.models import UserProfile, Donor, Institution, InterestStatement, Match, Notification


class Command(BaseCommand):
    help = "Seed dummy data for the 'chris' donor account"

    def handle(self, *args, **kwargs):
        # 1. User (Chris - Donor)
        user, created = User.objects.get_or_create(username='chris')
        user.set_password('chris123')
        user.first_name = 'Chris'
        user.last_name = 'Mensah'
        user.email = 'chris.mensah@example.com'
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = 'donor'
        profile.phone = '+233 24 900 0001'
        profile.save()

        donor, _ = Donor.objects.get_or_create(user=user)
        donor.location_lat = 6.6885
        donor.location_lng = -1.6244
        donor.preferred_causes = 'education, healthcare, nutrition'
        donor.save()

        self.stdout.write(f"{'Created' if created else 'Updated'} user: chris")

        # 1b. Admin User
        admin_user, admin_created = User.objects.get_or_create(username='admin')
        admin_user.set_password('GoFundUs@2026')
        admin_user.first_name = 'System'
        admin_user.last_name = 'Administrator'
        admin_user.email = 'admin@gofundus.org'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        admin_profile, _ = UserProfile.objects.get_or_create(user=admin_user)
        admin_profile.role = 'admin'
        admin_profile.phone = '+233 20 000 9999'
        admin_profile.save()

        self.stdout.write(f"{'Created' if admin_created else 'Updated'} admin user: admin")

        # 2. Institutions
        institutions_data = [
            {
                'name': 'Mampong Babies Home',
                'district': 'Asokwa',
                'address': 'Plot 14 Block B, Asokwa, Kumasi',
                'cause_description': 'Pediatric care, infant milk formula, early childhood education for abandoned infants.',
                'gps_lat': 6.6698, 'gps_lng': -1.6142,
                'children_count': 48, 'funding_gap': 18500,
                'funding_last_updated': date.today() - timedelta(days=42),
                'contact_email': 'info@mampongbabies.org',
                'contact_phone': '+233 24 412 3456',
                'cluster_id': 1,
            },
            {
                'name': 'King Jesus Charity Home',
                'district': 'Ayigya',
                'address': 'Near KNUST Campus Gate 3, Ayigya, Kumasi',
                'cause_description': 'Primary education, nutrition, IT literacy for orphans and street children.',
                'gps_lat': 6.6782, 'gps_lng': -1.5714,
                'children_count': 72, 'funding_gap': 32000,
                'funding_last_updated': date.today() - timedelta(days=85),
                'contact_email': 'contact@kingjesuscharity.org',
                'contact_phone': '+233 20 811 9922',
                'cluster_id': 1,
            },
            {
                'name': "Cherubs Children's Home",
                'district': 'Santasi',
                'address': 'Santasi Anyinam Road, Kumasi',
                'cause_description': 'Special needs orphans, physical rehabilitation, healthcare and inclusive education.',
                'gps_lat': 6.6543, 'gps_lng': -1.6421,
                'children_count': 36, 'funding_gap': 14200,
                'funding_last_updated': date.today() - timedelta(days=60),
                'contact_email': 'admin@cherubshome.org',
                'contact_phone': '+233 26 555 7890',
                'cluster_id': 2,
            },
        ]

        saved_institutions = []
        for data in institutions_data:
            inst, _ = Institution.objects.get_or_create(name=data['name'], defaults=data)
            saved_institutions.append(inst)
            self.stdout.write(f"  Institution: {inst.name}")

        # 3. Interest statements
        statements_text = [
            "I want to help orphaned children get access to quality education and nutritious meals.",
            "I care about infant care and healthcare for vulnerable toddlers in Kumasi.",
            "I am interested in supporting vocational training and rehabilitation for disabled orphans.",
        ]
        for text in statements_text:
            InterestStatement.objects.get_or_create(donor=donor, text=text)
        self.stdout.write(f"  Statements: {len(statements_text)}")

        # 4. Matches
        stmt = InterestStatement.objects.filter(donor=donor).first()
        for i, inst in enumerate(saved_institutions):
            Match.objects.get_or_create(
                donor=donor, institution=inst,
                defaults={
                    'statement': stmt,
                    'similarity_score': round(0.92 - i * 0.07, 2),
                    'priority_score': round(0.85 - i * 0.05, 2),
                    'final_rank': i + 1,
                }
            )
        self.stdout.write(f"  Matches: {len(saved_institutions)}")

        # 5. Notifications
        msgs = [
            "🎉 Welcome, Chris! Your donor profile is active.",
            "📍 Mampong Babies Home near you needs urgent support.",
            "💡 Your match score with King Jesus Charity Home is 92%.",
            "🔔 Cherubs Children's Home — 60 days without a donation.",
            "✅ Your interest statement matched 3 institutions.",
        ]
        for msg in msgs:
            Notification.objects.get_or_create(donor=donor, message=msg)
        self.stdout.write(f"  Notifications: {len(msgs)}")

        self.stdout.write(self.style.SUCCESS("\nDone. Login: chris / chris123 | admin / GoFundUs@2026"))

