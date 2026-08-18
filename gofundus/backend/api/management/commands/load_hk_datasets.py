"""
Management command: load_hk_datasets
Parses the 4 Hong Kong residential child care CSV files and loads
them as Institution records for AI-system testing while Ghanaian
datasets are being sourced.

CSV files (tab-separated, UTF-16 LE):
  list-rccc-b.csv  — Residential Creches / Babies' homes
  list-rccc-ch.csv — Children's Homes (6-18 / 6-21)
  list-rccc-gh.csv — Group Homes & Homes with/without schools
  list-rccc-h.csv  — Hostels for young people

Run:  python manage.py load_hk_datasets
"""
import csv
import io
import os
import random
from datetime import date, timedelta
from pathlib import Path

from django.core.management.base import BaseCommand
from api.models import Institution


# ── Hong Kong district → approximate GPS mapping ─────────────────────────
# These are real-world coordinates for the areas mentioned in the CSV addresses.
HK_AREA_COORDS = {
    # Hong Kong Island
    "wong chuk hang":    (22.2480, 114.1700),
    "chai wan":          (22.2644, 114.2369),
    "causeway bay":      (22.2802, 114.1836),
    "leighton":          (22.2770, 114.1840),
    "happy valley":      (22.2710, 114.1830),
    "aberdeen":          (22.2480, 114.1550),
    "hong kong":         (22.2800, 114.1580),   # generic HK Island
    # Kowloon
    "mong kok":          (22.3190, 114.1694),
    "kwun tong":         (22.3130, 114.2260),
    "sham shui po":      (22.3300, 114.1630),
    "wong tai sin":      (22.3420, 114.1940),
    "kowloon":           (22.3193, 114.1694),   # generic Kowloon
    "clear water bay":   (22.3300, 114.2630),
    "shatin pass":       (22.3440, 114.1870),
    "tung tau":          (22.3410, 114.1870),
    "hung hom":          (22.3059, 114.1827),
    "to kwa wan":        (22.3130, 114.1870),
    "ho man tin":        (22.3180, 114.1770),
    "cornwall":          (22.3300, 114.1600),
    "lee on":            (22.3130, 114.2260),
    "choi hing":         (22.3130, 114.2260),
    # New Territories
    "tseung kwan o":     (22.3113, 114.2579),
    "fanling":           (22.4920, 114.1380),
    "tuen mun":          (22.3910, 113.9730),
    "tsing yi":          (22.3530, 114.1090),
    "sha tin":           (22.3810, 114.1880),
    "tai po":            (22.4510, 114.1640),
    "yuen long":         (22.4440, 114.0220),
    "sai kung":          (22.3810, 114.2700),
    "cheung hong":       (22.3530, 114.1090),
}

# Cause-description templates per source file type
CAUSE_TEMPLATES = {
    "b": [
        "Residential crèche providing 24-hour care for abandoned infants and toddlers. "
        "Services include infant milk formula, paediatric health screening, early childhood "
        "development programmes, and emergency foster placement coordination.",

        "Specialised residential nursery for babies and young children in need of protection. "
        "Offers nurturing care, developmental stimulation, nutritional support, immunisation "
        "programmes, and family reunification casework.",
    ],
    "ch": [
        "Children's home offering shelter, education, and holistic development for young people "
        "aged {age_range}. Provides schooling support, life-skills training, recreational "
        "activities, and psychological counselling for vulnerable youth.",

        "Residential care facility for children and adolescents aged {age_range}, providing "
        "a stable family-like environment, academic tutoring, vocational guidance, and "
        "trauma-informed therapeutic support.",
    ],
    "gh": [
        "Group home integrated with a School for Social Development, supporting youth "
        "needing structured educational and behavioural rehabilitation. Offers on-site "
        "schooling, mentorship, sports programmes, and community reintegration support.",

        "Residential facility providing shelter and developmental programmes for young people "
        "in need of care and protection. Services include daily meals, educational support, "
        "counselling, and vocational training.",
    ],
    "h": [
        "Hostel providing transitional shelter and supportive services for young people. "
        "Offers safe accommodation, independent living skills training, employment guidance, "
        "and aftercare follow-up for youth leaving residential care.",

        "Short-to-medium stay hostel for vulnerable young people, offering secure shelter, "
        "case management, life planning support, and community integration programmes.",
    ],
}


def _geocode_address(address: str) -> tuple:
    """
    Simple keyword-based geocoding from address text to (lat, lng).
    Falls back to central Hong Kong coordinates with random jitter.
    """
    addr_lower = address.lower()
    for area, coords in HK_AREA_COORDS.items():
        if area in addr_lower:
            # Add small jitter so institutions at the same area don't stack
            lat = coords[0] + random.uniform(-0.003, 0.003)
            lng = coords[1] + random.uniform(-0.003, 0.003)
            return (round(lat, 6), round(lng, 6))

    # Fallback: central Hong Kong with wider jitter
    return (
        round(22.280 + random.uniform(-0.04, 0.04), 6),
        round(114.158 + random.uniform(-0.06, 0.06), 6),
    )


def _extract_district(address: str) -> str:
    """Extract a district name from the Hong Kong address."""
    addr_lower = address.lower()
    for area in HK_AREA_COORDS:
        if area in addr_lower:
            return area.title()
    # Try to extract last comma-separated segment
    parts = [p.strip() for p in address.split(",")]
    if len(parts) >= 2:
        return parts[-1] if parts[-1] not in ("Hong Kong", "Kowloon") else parts[-2]
    return "Hong Kong"


def _parse_csv(filepath: str) -> list[dict]:
    """
    Parse a tab-separated, UTF-16-LE CSV file.
    Returns a list of row dictionaries (English columns only).
    """
    raw = Path(filepath).read_bytes()

    # Try UTF-16 first (the files have BOM), fall back to UTF-8
    for encoding in ("utf-16", "utf-8-sig", "utf-8"):
        try:
            text = raw.decode(encoding)
            break
        except (UnicodeDecodeError, UnicodeError):
            continue
    else:
        text = raw.decode("utf-8", errors="replace")

    reader = csv.reader(io.StringIO(text), delimiter="\t")
    rows = list(reader)
    if not rows:
        return []

    # The first row contains headers (repeated in EN/TC/SC).
    # We only keep English columns; the pattern is every 3rd column
    # starting from index 0 contains the English value.
    parsed = []
    header = rows[0]

    for row in rows[1:]:
        if not row or all(cell.strip() == "" for cell in row):
            continue
        # Build dict from English columns (every 3rd starting at 0)
        entry = {}
        for i in range(0, len(header), 3):
            key = header[i].strip() if i < len(header) else f"col_{i}"
            val = row[i].strip() if i < len(row) else ""
            if key:
                entry[key] = val
        if entry:
            parsed.append(entry)

    return parsed


class Command(BaseCommand):
    help = (
        "Load Hong Kong residential child care CSV datasets as "
        "Institution records for AI-system testing."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing HK-district institutions before importing.",
        )

    def handle(self, *args, **options):
        base_dir = Path(__file__).resolve().parents[4]  # -> gofundus/

        csv_files = {
            "b":  base_dir / "list-rccc-b.csv",
            "ch": base_dir / "list-rccc-ch.csv",
            "gh": base_dir / "list-rccc-gh.csv",
            "h":  base_dir / "list-rccc-h.csv",
        }

        # Verify files exist
        for key, fp in csv_files.items():
            if not fp.exists():
                self.stderr.write(self.style.ERROR(f"Missing CSV: {fp}"))
                return

        if options["clear"]:
            deleted, _ = Institution.objects.filter(
                district__in=[d.title() for d in HK_AREA_COORDS]
            ).delete()
            self.stdout.write(self.style.WARNING(
                f"Cleared {deleted} existing HK institution records."
            ))

        total_created = 0
        total_skipped = 0

        for file_key, filepath in csv_files.items():
            self.stdout.write(self.style.HTTP_INFO(
                f"\n-- Parsing {filepath.name} --"
            ))
            rows = _parse_csv(str(filepath))
            self.stdout.write(f"   Found {len(rows)} rows")

            templates = CAUSE_TEMPLATES[file_key]

            for row in rows:
                # Extract fields using the various column names across files
                agency_name = (
                    row.get("Name of Agency", "")
                    or row.get("Name of Organisation", "")
                    or row.get("Name of Organization", "")
                ).strip()

                unit_name = (
                    row.get("Name of Unit", "")
                ).strip()

                address = (
                    row.get("Address", "")
                    or row.get("Address ", "")  # trailing space in some headers
                ).strip()

                phone = (
                    row.get("Tel no.", "")
                    or row.get("Tel. No.", "")
                    or row.get("Telephone Number", "")
                ).strip()

                fax = (
                    row.get("Fax no.", "")
                    or row.get("Fax No.", "")
                    or row.get("Fax Number", "")
                ).strip()

                # Some files have extra context columns
                service_type = row.get("Type of Service", "").strip()
                target = row.get("Target Service Recipients", "").strip()
                remarks = row.get("Remarks", "").strip()

                # Build the institution name
                if unit_name and agency_name:
                    inst_name = f"{unit_name} ({agency_name})"
                elif unit_name:
                    inst_name = unit_name
                elif agency_name:
                    inst_name = agency_name
                else:
                    continue  # Skip blank rows

                if not address:
                    continue

                # Check for duplicates
                if Institution.objects.filter(name=inst_name).exists():
                    total_skipped += 1
                    continue

                # Geocode
                lat, lng = _geocode_address(address)

                # District
                district = _extract_district(address)

                # Build cause description from template + context
                template = random.choice(templates)
                age_range = "6 to 18"
                if target:
                    if "21" in target:
                        age_range = "6 to 21"
                    elif "11" in target:
                        age_range = "11 to 18"
                cause_desc = template.format(age_range=age_range)

                # Add context from remarks/service type if available
                if remarks:
                    cause_desc += f" ({remarks})"
                if service_type:
                    cause_desc = f"{service_type}: {cause_desc}"

                # Realistic random values for testing
                children_count = random.randint(15, 120)
                funding_gap = round(random.uniform(5000, 50000), 2)
                days_ago = random.randint(5, 200)

                Institution.objects.create(
                    name=inst_name,
                    district=district,
                    address=address,
                    cause_description=cause_desc,
                    gps_lat=lat,
                    gps_lng=lng,
                    children_count=children_count,
                    funding_gap=funding_gap,
                    most_lacking_need=random.choice([
                        "Food & Groceries",
                        "Medical Supplies",
                        "Educational Materials",
                        "Clothing & Bedding",
                        "Infrastructure Repairs",
                        "Staff Salaries",
                    ]),
                    funding_last_updated=date.today() - timedelta(days=days_ago),
                    contact_email=f"info@{agency_name.lower().replace(' ', '')[:20]}.org.hk"
                        if agency_name else None,
                    contact_phone=phone or None,
                )
                total_created += 1
                self.stdout.write(f"   [+] {inst_name}")

        self.stdout.write(self.style.SUCCESS(
            f"\n== Done! Created {total_created} institutions, "
            f"skipped {total_skipped} duplicates. "
            f"Total in DB: {Institution.objects.count()} =="
        ))
