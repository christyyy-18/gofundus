from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Institution


# Real, publicly documented Ghanaian children's homes. The names, districts,
# and cause descriptions describe each organization's actual, publicly known
# mission. The operational numbers below (children_count, funding_gap,
# most_lacking_need, funding_last_updated) are GENERATED DEMO VALUES for
# exercising the AI matching algorithm — they are NOT confirmed figures from
# the institutions and must not be treated as real donation targets until an
# institution admin confirms them through the platform.
GHANA_DEMO_INSTITUTIONS = [
    {
        "name": "Mampong Babies Home",
        "district": "Mampong Municipal",
        "address": "Mampong, Ashanti Region, Ghana",
        "gps_lat": 7.0627,
        "gps_lng": -1.4000,
        "cause_description": (
            "Residential nursery care for infants and newborns separated from their mothers, "
            "including babies whose mothers died during or shortly after childbirth. Staff provide "
            "round-the-clock feeding, infant health monitoring, and work toward family reunification "
            "or adoption placement when it is safe and practical."
        ),
        "children_count": 41,
        "funding_gap": 16800,
        "most_lacking_need": "Infant Formula & Medical Supplies",
        "days_since_update": 11,
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
        "name": "SOS Children's Village, Kumasi",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "Part of the SOS Children's Villages network, this Kumasi site places children who have "
            "lost parental care into family-style homes led by trained caregivers. Programs cover "
            "primary and secondary education, healthcare access, and life-skills preparation for "
            "eventual independent living."
        ),
        "children_count": 54,
        "funding_gap": 27600,
        "most_lacking_need": "Education Materials",
        "days_since_update": 6,
    },
    {
        "name": "SOS Children's Village, Tema",
        "district": "Tema Metropolitan",
        "address": "Tema, Greater Accra Region, Ghana",
        "gps_lat": 5.6698,
        "gps_lng": -0.0166,
        "cause_description": (
            "An SOS Children's Villages community in Tema offering family-based residential care "
            "alongside outreach programs that strengthen vulnerable birth families so children can "
            "remain with relatives whenever possible. Education sponsorship and community nutrition "
            "support are central to the model."
        ),
        "children_count": 63,
        "funding_gap": 33200,
        "most_lacking_need": "Food & Groceries",
        "days_since_update": 19,
    },
    {
        "name": "SOS Children's Village, Asiakwa",
        "district": "Asiakwa",
        "address": "Asiakwa, Eastern Region, Ghana",
        "gps_lat": 6.2833,
        "gps_lng": -0.4833,
        "cause_description": (
            "One of the earliest SOS Children's Villages established in Ghana, located in Asiakwa in "
            "the Eastern Region. Children live in family units with a dedicated caregiver, attend "
            "local schools, and receive support accessing safe drinking water and sanitation on the "
            "village grounds."
        ),
        "children_count": 47,
        "funding_gap": 19500,
        "most_lacking_need": "Clean Water & Sanitation",
        "days_since_update": 27,
    },
    {
        "name": "Osu Children's Home",
        "district": "Osu Klottey",
        "address": "Osu, Greater Accra Region, Ghana",
        "gps_lat": 5.5560,
        "gps_lng": -0.1820,
        "cause_description": (
            "A government-supported residential facility in Osu caring for children removed from "
            "unsafe situations by Ghana's social welfare system. The home provides shelter, basic "
            "schooling, and protective supervision while case workers pursue family reintegration or "
            "alternative long-term placement."
        ),
        "children_count": 38,
        "funding_gap": 24100,
        "most_lacking_need": "Shelter Repairs",
        "days_since_update": 52,
    },
    {
        "name": "Kumasi Children's Home",
        "district": "Kumasi Metropolitan",
        "address": "Kumasi, Ashanti Region, Ghana",
        "gps_lat": 6.6885,
        "gps_lng": -1.6244,
        "cause_description": (
            "State-run children's home in Kumasi providing emergency shelter, meals, and schooling for "
            "children in need of care and protection under Ghana's Department of Social Welfare. Many "
            "residents are awaiting family tracing or foster placement and need warm clothing and "
            "bedding through the harmattan season."
        ),
        "children_count": 45,
        "funding_gap": 17300,
        "most_lacking_need": "Clothing & Bedding",
        "days_since_update": 8,
    },
    {
        "name": "Echoing Hills Village, Gomoa Adam",
        "district": "Gomoa East",
        "address": "Gomoa Adam, Central Region, Ghana",
        "gps_lat": 5.3667,
        "gps_lng": -0.6667,
        "cause_description": (
            "A residential community in the Central Region serving children and adults living with "
            "severe physical and intellectual disabilities who have been abandoned or rejected by "
            "their families. Care includes physiotherapy, feeding support, and long-term nursing for "
            "residents who require lifelong medical assistance."
        ),
        "children_count": 22,
        "funding_gap": 29800,
        "most_lacking_need": "Medical Supplies & Mobility Equipment",
        "days_since_update": 15,
    },
    {
        "name": "Village of Hope Ghana, Techiman",
        "district": "Techiman Municipal",
        "address": "Techiman, Bono East Region, Ghana",
        "gps_lat": 7.5833,
        "gps_lng": -1.9333,
        "cause_description": (
            "A residential and outreach program in Techiman supporting orphaned and vulnerable "
            "children through family-style housing, basic education, and vocational skills training "
            "such as tailoring, carpentry, and agriculture to prepare older youth for independent "
            "livelihoods."
        ),
        "children_count": 58,
        "funding_gap": 22700,
        "most_lacking_need": "Vocational Training Tools",
        "days_since_update": 41,
    },
]


class Command(BaseCommand):
    help = (
        "Replace institution records with real, publicly documented Ghanaian children's homes, "
        "paired with generated demo operational numbers for testing the AI donor-matching flow."
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
            f"Loaded {len(GHANA_DEMO_INSTITUTIONS)} real Ghanaian institutions with demo operational data."
        ))
