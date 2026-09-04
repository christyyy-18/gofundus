from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Institution


# All 10 records are located in Kumasi, Ashanti Region.
#
# The first 5 are REAL, publicly documented Kumasi children's homes (names,
# districts, and cause descriptions reflect each organization's actual,
# publicly known mission). The last 5 (see the "FICTIONAL placeholder homes"
# section below) are made-up names used only to broaden the demo dataset for
# testing the AI matching algorithm across more need categories — they are
# NOT real organizations, even though the UI displays them like any other
# institution.
#
# For every record, the operational numbers (children_count, funding_gap,
# most_lacking_need, funding_last_updated) are GENERATED DEMO VALUES for
# exercising the matching flow — they are NOT confirmed figures from any real
# institution and must not be treated as real donation targets until an
# institution admin confirms them through the platform.
GHANA_DEMO_INSTITUTIONS = [
    # ── REAL, verified Kumasi institutions ──
    {
        "name": "Kumasi Children's Home",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi Children's Home, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "State-run children's home in Kumasi, established in 1965 by Ghana's Department of "
            "Social Welfare, providing emergency shelter, meals, and schooling for children in need "
            "of care and protection. Many residents are awaiting family tracing or foster placement "
            "and need warm clothing and bedding through the harmattan season."
        ),
        "children_count": 45,
        "funding_gap": 17300,
        "most_lacking_need": "Clothing & Bedding",
        "days_since_update": 8,
    },
    {
        "name": "SOS Children's Village, Kumasi",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6947,
        "gps_lng": -1.6082,
        "cause_description": (
            "Part of the SOS Children's Villages network, this Kumasi site is made up of 12 "
            "family-style houses caring for up to 120 children who have lost parental care. Trained "
            "caregivers lead each house, with programs covering primary and secondary education, "
            "healthcare access, and life-skills preparation for eventual independent living."
        ),
        "children_count": 54,
        "funding_gap": 27600,
        "most_lacking_need": "Education Materials",
        "days_since_update": 6,
    },
    {
        "name": "Missionaries of Charity, Kumasi",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "Run by the Sisters of the Missionaries of Charity, this home cares for children and "
            "adults living with physical and intellectual disabilities. Daily support includes basic "
            "nursing care, feeding assistance, physiotherapy exercises, and a stable residential "
            "environment for residents who have nowhere else to turn."
        ),
        "children_count": 29,
        "funding_gap": 21400,
        "most_lacking_need": "Healthcare & Mobility Aids",
        "days_since_update": 34,
    },
    {
        "name": "Cherubs Children's Home",
        "district": "Kumasi Metropolitan",
        "address": "Santasi-Apire, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6543,
        "gps_lng": -1.6421,
        "cause_description": (
            "Run by Cherubs Foundation International Ghana in Santasi-Apire, this home provides "
            "residential care, meals, and basic schooling for orphaned and vulnerable children. The "
            "foundation relies heavily on local community and church donations to keep the home "
            "running day to day."
        ),
        "children_count": 33,
        "funding_gap": 15800,
        "most_lacking_need": "Food & Groceries",
        "days_since_update": 13,
    },
    {
        "name": "Ashan Children's Home",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi-Offinso Highway, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.7452,
        "gps_lng": -1.6353,
        "cause_description": (
            "A residential home along the Kumasi-Offinso Highway caring for orphaned and abandoned "
            "children, providing shelter, daily meals, and access to nearby primary schools. The home "
            "depends on donor support for building upkeep and clean water access on the compound."
        ),
        "children_count": 26,
        "funding_gap": 13900,
        "most_lacking_need": "Clean Water & Sanitation",
        "days_since_update": 22,
    },

    # ── FICTIONAL placeholder homes (broaden demo coverage only) ──
    {
        "name": "Nhyira Children's Sanctuary",
        "district": "Asokwa",
        "address": "Asokwa, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6698,
        "gps_lng": -1.6142,
        "cause_description": (
            "A community-run home in Asokwa focused on early-childhood nutrition, providing daily "
            "balanced meals, growth monitoring, and supplementary feeding for malnourished infants "
            "and toddlers in its care."
        ),
        "children_count": 31,
        "funding_gap": 14200,
        "most_lacking_need": "Nutrition & Supplementary Feeding",
        "days_since_update": 17,
    },
    {
        "name": "Grace Haven Children's Home",
        "district": "Suame",
        "address": "Suame, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.7188,
        "gps_lng": -1.6211,
        "cause_description": (
            "A residential home in Suame supporting school-age orphans with textbooks, uniforms, "
            "school fees, and a dedicated study hall, aiming to keep every resident enrolled and "
            "performing well in local schools."
        ),
        "children_count": 39,
        "funding_gap": 19700,
        "most_lacking_need": "Education Materials",
        "days_since_update": 29,
    },
    {
        "name": "Bethel Hope Orphanage",
        "district": "Bantama",
        "address": "Bantama, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.7001,
        "gps_lng": -1.6322,
        "cause_description": (
            "A children's shelter in Bantama working to improve access to safe drinking water and "
            "proper sanitation on its compound, after years of relying on trucked-in water during dry "
            "season shortages."
        ),
        "children_count": 24,
        "funding_gap": 16500,
        "most_lacking_need": "Clean Water & Sanitation",
        "days_since_update": 40,
    },
    {
        "name": "Sunrise Children's Foundation",
        "district": "Asafo",
        "address": "Asafo, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6900,
        "gps_lng": -1.6180,
        "cause_description": (
            "A youth-focused home in Asafo preparing older teenage residents for independent living "
            "through vocational training in tailoring, carpentry, and computer literacy, alongside "
            "continued shelter and mentorship."
        ),
        "children_count": 42,
        "funding_gap": 23100,
        "most_lacking_need": "Vocational Training Tools",
        "days_since_update": 5,
    },
    {
        "name": "Little Angels Home",
        "district": "Kwadaso",
        "address": "Kwadaso, Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6850,
        "gps_lng": -1.6580,
        "cause_description": (
            "A small residential home in Kwadaso caring for children with chronic illnesses and "
            "disabilities, providing basic nursing care, physiotherapy sessions, and transport to "
            "hospital appointments in central Kumasi."
        ),
        "children_count": 18,
        "funding_gap": 20300,
        "most_lacking_need": "Medical Supplies & Mobility Equipment",
        "days_since_update": 25,
    },
]


class Command(BaseCommand):
    help = (
        "Replace institution records with 5 real, verified Kumasi children's homes and 5 clearly "
        "fictional Kumasi placeholder homes, paired with generated demo operational numbers for "
        "testing the AI donor-matching flow."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        deleted, _ = Institution.objects.all().delete()
        for data in GHANA_DEMO_INSTITUTIONS:
            days_since_update = data.pop("days_since_update")
            Institution.objects.create(
                **data,
                funding_last_updated=date.today() - timedelta(days=days_since_update),
                contact_email=None,
                contact_phone=None,
            )

        self.stdout.write(self.style.WARNING(f"Removed {deleted} existing institution records."))
        self.stdout.write(self.style.SUCCESS(
            f"Loaded {len(GHANA_DEMO_INSTITUTIONS)} Kumasi institutions (5 real + 5 fictional demo)."
        ))
