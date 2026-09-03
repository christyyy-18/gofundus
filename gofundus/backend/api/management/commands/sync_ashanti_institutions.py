from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Institution


# Publicly documented organizations only. Operational figures are intentionally
# left blank or zero until confirmed by the institution or Ghana's social
# welfare authorities.
GHANA_INSTITUTIONS = [
    {
        "name": "Mampong Babies Home",
        "district": "Mampong Municipal",
        "address": "Mampong, Ashanti Region, Ghana",
        "gps_lat": 7.0627,
        "gps_lng": -1.4000,
        "cause_description": (
            "Residential care for infants whose mothers have died during or shortly after childbirth. "
            "The home maintains contact with families of origin and supports reunification when safe and practical."
        ),
    },
    {
        "name": "Missionaries of Charity, Kumasi",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "A Kumasi home serving children with physical and intellectual disabilities, as well as adults "
            "who need residential care and protection."
        ),
    },
    {
        "name": "SOS Children's Villages, Kumasi",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "Supports children, young people, and families in Kumasi through family-based care, education, "
            "healthcare, family strengthening, and preparation for independent living."
        ),
    },
    {
        "name": "Kumasi Children's Home",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "State-run residential home providing care, shelter, protection, and education "
            "for children in need of care and protection."
        ),
    },
    {
        "name": "Osu Children's Home",
        "district": "Osu Klottey",
        "address": "Osu, Greater Accra Region, Ghana",
        "gps_lat": 5.5560,
        "gps_lng": -0.1820,
        "cause_description": (
            "Government-supported residential home providing care and protection for children "
            "in need of care and support."
        ),
    },
]


class Command(BaseCommand):
    help = "Replace test institution data with publicly documented Ghanaian institutions."

    @transaction.atomic
    def handle(self, *args, **options):
        deleted, _ = Institution.objects.all().delete()
        for data in GHANA_INSTITUTIONS:
            Institution.objects.create(
                **data,
                children_count=0,
                funding_gap=0,
                funding_last_updated=None,
                most_lacking_need="Needs confirmation",
                contact_email=None,
                contact_phone=None,
            )

        self.stdout.write(self.style.WARNING(f"Removed {deleted} existing institution records."))
        self.stdout.write(self.style.SUCCESS(
            f"Loaded {len(GHANA_INSTITUTIONS)} verified Ghana institutions."
        ))