from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Institution


# Synthetic demonstration records. These names, locations, counts, and needs
# are not claims about real institutions and must be replaced before launch.
KUMASI_MOCK_INSTITUTIONS = [
    ("Kumasi Community Home 01", "Bantama", 6.7001, -1.6322, 38, 18500, "Food & Groceries", 8),
    ("Kumasi Community Home 02", "Asokwa", 6.6698, -1.6142, 52, 24600, "Education Materials", 16),
    ("Kumasi Community Home 03", "Bohyen", 6.7270, -1.6740, 27, 12400, "Medical Supplies", 23),
    ("Kumasi Community Home 04", "Daban", 6.7420, -1.6460, 64, 31800, "Food & Groceries", 31),
    ("Kumasi Community Home 05", "Dikrom", 6.7040, -1.5850, 21, 9800, "Clothing & Bedding", 12),
    ("Kumasi Community Home 06", "Ejisu", 6.7270, -1.4650, 45, 27500, "Clean Water", 19),
    ("Kumasi Community Home 07", "Kaase", 6.6400, -1.5930, 33, 15700, "Healthcare", 27),
    ("Kumasi Community Home 08", "Kenyasi", 6.7350, -1.6060, 71, 40200, "Education Materials", 38),
    ("Kumasi Community Home 09", "KNUST", 6.6745, -1.5710, 29, 14300, "Digital Learning", 14),
    ("Kumasi Community Home 10", "Kokomlemle", 6.6950, -1.6250, 56, 28900, "Food & Groceries", 44),
    ("Kumasi Community Home 11", "Krofrom", 6.7090, -1.5970, 42, 22100, "Shelter Repairs", 21),
    ("Kumasi Community Home 12", "Kumasi Central", 6.6930, -1.6240, 19, 8700, "Sanitation", 9),
    ("Kumasi Community Home 13", "Kwadaso", 6.6850, -1.6580, 48, 26300, "Vocational Training", 35),
    ("Kumasi Community Home 14", "Mankranso", 6.7810, -1.7620, 24, 11200, "Food & Groceries", 18),
    ("Kumasi Community Home 15", "Manhyia", 6.7050, -1.6150, 36, 19600, "Healthcare", 29),
    ("Kumasi Community Home 16", "Nhyiaeso", 6.6900, -1.6400, 58, 33700, "Education Materials", 47),
    ("Kumasi Community Home 17", "Oforikrom", 6.6912, -1.5490, 31, 16800, "School Fees", 25),
    ("Kumasi Community Home 18", "Sofoline", 6.6920, -1.6520, 67, 36500, "Clean Water", 52),
    ("Kumasi Community Home 19", "Suame", 6.7188, -1.6211, 43, 23400, "Vocational Training", 33),
    ("Kumasi Community Home 20", "Tafo", 6.7310, -1.6030, 76, 42800, "Food & Groceries", 61),
]


class Command(BaseCommand):
    help = "Replace institution records with 20 clearly labeled synthetic Kumasi demo records."

    @transaction.atomic
    def handle(self, *args, **options):
        deleted, _ = Institution.objects.all().delete()
        for name, district, lat, lng, children, gap, need, days_old in KUMASI_MOCK_INSTITUTIONS:
            Institution.objects.create(
                name=name,
                district=district,
                address=f"{district}, Kumasi, Ashanti Region, Ghana (demo location)",
                gps_lat=lat,
                gps_lng=lng,
                children_count=children,
                funding_gap=gap,
                funding_last_updated=date.today() - timedelta(days=days_old),
                most_lacking_need=need,
                cause_description=(
                    f"Synthetic demo profile for testing donor matching. This record represents "
                    f"a Kumasi children's home seeking support for {need.lower()}."
                ),
                contact_email=None,
                contact_phone=None,
            )

        self.stdout.write(self.style.WARNING(f"Removed {deleted} existing institution records."))
        self.stdout.write(self.style.SUCCESS(
            f"Loaded {len(KUMASI_MOCK_INSTITUTIONS)} synthetic Kumasi demo records."
        ))
