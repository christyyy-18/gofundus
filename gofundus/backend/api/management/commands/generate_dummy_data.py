import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, Donor, Institution, InterestStatement

KUMASI_ORPHANAGES = [
    {
        "name": "Mampong Babies Home (Kumasi Outreach Center)",
        "district": "Asokwa",
        "address": "Plot 14 Block B, Asokwa Residential Area, Kumasi",
        "gps_lat": 6.669800,
        "gps_lng": -1.614200,
        "children_count": 48,
        "funding_gap": 18500.00,
        "days_ago_donation": 42,
        "contact_email": "info@mampongbabies-ks.org",
        "contact_phone": "+233 24 412 3456",
        "cause_description": (
            "Dedicated to nurturing abandoned infants, toddlers, and vulnerable orphans. "
            "We provide 24/7 specialized pediatric care, infant milk formula, medical screening, "
            "and early childhood educational development for motherless infants in Kumasi."
        ),
    },
    {
        "name": "King Jesus Charity Home",
        "district": "Ayigya",
        "address": "Near KNUST Campus Gate 3, Ayigya, Kumasi",
        "gps_lat": 6.678200,
        "gps_lng": -1.571400,
        "children_count": 72,
        "funding_gap": 32000.00,
        "days_ago_donation": 85,
        "contact_email": "contact@kingjesuscharity.org",
        "contact_phone": "+233 20 811 9922",
        "cause_description": (
            "Providing holistic shelter, primary education, and nutritional support for street children "
            "and orphans. We focus on basic schooling fees, textbook provision, IT literacy, and "
            "vocational skill empowerment in tailoring, carpentry, and computer skills."
        ),
    },
    {
        "name": "All Nations Charity Children's Home",
        "district": "Ayigya Zongo",
        "address": "House No. AK-102, Ayigya Zongo, Kumasi",
        "gps_lat": 6.681100,
        "gps_lng": -1.564400,
        "children_count": 55,
        "funding_gap": 21500.00,
        "days_ago_donation": 14,
        "contact_email": "help@allnationschildren.org",
        "contact_phone": "+233 24 399 4411",
        "cause_description": (
            "Focusing on rescue, emergency shelter, and educational re-integration of street orphans "
            "and displaced children. We provide clean drinking water, sanitation facilities, daily cooked meals, "
            "and senior high school scholarship support."
        ),
    },
    {
        "name": "Cherubs Children's Home",
        "district": "Santasi",
        "address": "Santasi Anyinam Road, Kumasi",
        "gps_lat": 6.654300,
        "gps_lng": -1.642100,
        "children_count": 36,
        "funding_gap": 14200.00,
        "days_ago_donation": 60,
        "contact_email": "admin@cherubshome.org",
        "contact_phone": "+233 26 555 7890",
        "cause_description": (
            "A safe haven for special needs orphans, disabled children, and abandoned toddlers. "
            "We offer physical rehabilitation, special education tools, wheel-chair accessible facilities, "
            "and personalized healthcare treatment."
        ),
    },
    {
        "name": "Kokoase Children's Village",
        "district": "Kokoase / Abrepo",
        "address": "Off Abrepo Main Road, Kokoase, Kumasi",
        "gps_lat": 6.721000,
        "gps_lng": -1.635000,
        "children_count": 94,
        "funding_gap": 45000.00,
        "days_ago_donation": 110,
        "contact_email": "info@kokoasechildren.org",
        "contact_phone": "+233 24 900 1122",
        "cause_description": (
            "A family-style children's village offering group homes, maternal care, primary and secondary school tuition, "
            "agricultural youth training, and clean solar water power for over 90 children."
        ),
    },
    {
        "name": "Hope for Children Foundation Kumasi",
        "district": "Oforikrom",
        "address": "Anwomaso New Site, Oforikrom, Kumasi",
        "gps_lat": 6.691200,
        "gps_lng": -1.549000,
        "children_count": 42,
        "funding_gap": 16800.00,
        "days_ago_donation": 8,
        "contact_email": "support@hopeforchildrenks.org",
        "contact_phone": "+233 50 123 4567",
        "cause_description": (
            "Providing orphan scholarship funds, school uniforms, exercise books, STEM mentorship, "
            "and evening tutorial classes for children from low-income background families and child-headed households."
        ),
    },
    {
        "name": "Bantama Grace Orphan Care",
        "district": "Bantama",
        "address": "Opposite Komfo Anokye Teaching Hospital Staff Quarters, Bantama, Kumasi",
        "gps_lat": 6.700100,
        "gps_lng": -1.632200,
        "children_count": 64,
        "funding_gap": 27500.00,
        "days_ago_donation": 95,
        "contact_email": "bantamagrace@orphan-gh.org",
        "contact_phone": "+233 24 666 3322",
        "cause_description": (
            "Partnering with KATH hospital social workers to rescue sick, malnourished, and abandoned infants. "
            "We supply intensive nutritional rehabilitation, infant formula, immunizations, and healthcare insurance."
        ),
    },
    {
        "name": "Suame Youth & Children Shelter",
        "district": "Suame",
        "address": "Magazine Zone 4, Suame, Kumasi",
        "gps_lat": 6.718800,
        "gps_lng": -1.621100,
        "children_count": 80,
        "funding_gap": 38000.00,
        "days_ago_donation": 130,
        "contact_email": "suameyouth@charity.org.gh",
        "contact_phone": "+233 20 444 8899",
        "cause_description": (
            "Empowering teenage orphans and street youth with practical technical skills, auto-mechanics, welding, "
            "electrical wiring, computer repair, shelter, and financial literacy to prevent youth poverty."
        ),
    },
    {
        "name": "Kwadaso Sunshine Haven",
        "district": "Kwadaso",
        "address": "Near Kwadaso Agricultural College, Kumasi",
        "gps_lat": 6.685000,
        "gps_lng": -1.658000,
        "children_count": 30,
        "funding_gap": 11000.00,
        "days_ago_donation": 21,
        "contact_email": "sunshine@kwadasohaven.org",
        "contact_phone": "+233 27 777 1144",
        "cause_description": (
            "Focusing on female child protection, girl-child education, menstrual hygiene dignity kits, "
            "scholarships for young girls, and shelter for orphaned young mothers in Kwadaso."
        ),
    },
    {
        "name": "Aboabo Community Children's Home",
        "district": "Aboabo",
        "address": "Aboabo Post Office Area, Kumasi",
        "gps_lat": 6.695500,
        "gps_lng": -1.608000,
        "children_count": 68,
        "funding_gap": 29000.00,
        "days_ago_donation": 150,
        "contact_email": "aboabochildren@ghana-charity.org",
        "contact_phone": "+233 24 333 9900",
        "cause_description": (
            "Community-supported orphanage providing nutritious meals, Quranic and secular basic education, "
            "clothing, health insurance cards, and shelter for Zongo street orphans."
        ),
    },
    {
        "name": "Manhyia Royal Infant Sanctuary",
        "district": "Manhyia",
        "address": "Near Manhyia Palace Museum, Kumasi",
        "gps_lat": 6.705000,
        "gps_lng": -1.615000,
        "children_count": 50,
        "funding_gap": 22000.00,
        "days_ago_donation": 30,
        "contact_email": "manhyiasanctuary@ashanti.org",
        "contact_phone": "+233 32 202 1234",
        "cause_description": (
            "Caring for vulnerable infants and orphaned newborns in the Manhyia historical district. "
            "Provides specialized nursery equipment, diaper supplies, lactation support, and pediatric medical checks."
        ),
    },
    {
        "name": "Chirapatre Hope & Restoration Home",
        "district": "Chirapatre",
        "address": "Chirapatre Estate, Kumasi",
        "gps_lat": 6.651000,
        "gps_lng": -1.595000,
        "children_count": 45,
        "funding_gap": 19500.00,
        "days_ago_donation": 75,
        "contact_email": "info@chirapatrehope.org",
        "contact_phone": "+233 24 888 2211",
        "cause_description": (
            "Restoring hope to abandoned youth through formal schooling, music lessons, counseling, "
            "computer labs, and comfortable living quarters for children aged 5 to 18."
        ),
    },
    {
        "name": "Suntreso Child Development Center",
        "district": "North Suntreso",
        "address": "Near Suntreso Government Hospital, Kumasi",
        "gps_lat": 6.698000,
        "gps_lng": -1.641000,
        "children_count": 58,
        "funding_gap": 24000.00,
        "days_ago_donation": 52,
        "contact_email": "suntresochildren@devcenter.org",
        "contact_phone": "+233 20 999 5544",
        "cause_description": (
            "Specialized healthcare, clinical psychology support, emergency foster placement, "
            "and primary school tuition for orphaned children recovering from trauma."
        ),
    },
    {
        "name": "Sofoline Street Children Rescue",
        "district": "Sofoline",
        "address": "Sofoline Interchange Road, Kumasi",
        "gps_lat": 6.692000,
        "gps_lng": -1.652000,
        "children_count": 75,
        "funding_gap": 34000.00,
        "days_ago_donation": 180,
        "contact_email": "rescue@sofolinestreetkids.org",
        "contact_phone": "+233 26 111 4433",
        "cause_description": (
            "Daily mobile kitchen feeding street kids, vocational apprenticeship placements, "
            "substance rehabilitation counseling, and safe night shelter for Kumasi street youth."
        ),
    },
    {
        "name": "Kronum New Life Orphanage",
        "district": "Kronum",
        "address": "Kronum Kwaprah Road, Kumasi",
        "gps_lat": 6.745000,
        "gps_lng": -1.638000,
        "children_count": 88,
        "funding_gap": 41000.00,
        "days_ago_donation": 210,
        "contact_email": "kronumorphanage@newlife.org",
        "contact_phone": "+233 24 555 0099",
        "cause_description": (
            "Rural-fringe orphanage supporting 88 kids with farmland food cultivation, basic school fees, "
            "solar borehole water system, and secondary school bursaries."
        ),
    }
]

DUMMY_DONOR_QUERIES = [
    "I want to donate to orphanages in Kumasi that support infant care, baby milk formula, and newborn pediatric healthcare.",
    "Looking to fund primary education, computer literacy, IT equipment, and school fees for street children in Ayigya or Oforikrom.",
    "I care deeply about special needs orphans, disabled children, wheelchairs, and physical therapy facilities in Kumasi.",
    "Seeking urgent orphanages near Suame or Bantama that offer technical vocational skill training, auto mechanics, and youth empowerment.",
    "Want to support clean drinking water, solar borehole wells, sanitation, and nutritional meals for large children homes."
]


class Command(BaseCommand):
    help = "Seed the database with 15+ realistic Kumasi Metropolitan orphanages and dummy donor data."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting dummy data generation for Kumasi orphanages..."))

        # Create system admin if not exists
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@donationplatform.org", "is_staff": True, "is_superuser": True}
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            UserProfile.objects.create(user=admin_user, role="system_admin")
            self.stdout.write(self.style.SUCCESS("Created Superuser: admin / admin123"))

        # Create dummy donors
        donor_names = [
            ("Kwame", "Mensah", "kwame.mensah@gmail.com", 6.6750, -1.6200),
            ("Akosua", "Osei", "akosua.osei@yahoo.com", 6.6890, -1.5800),
            ("Dr. Emmanuel", "Appiah", "e.appiah@knust.edu.gh", 6.6790, -1.5680),
        ]

        donors_list = []
        for fname, lname, email, lat, lng in donor_names:
            username = email.split("@")[0]
            d_user, _ = User.objects.get_or_create(
                username=username,
                defaults={"first_name": fname, "last_name": lname, "email": email}
            )
            d_user.set_password("donor123")
            d_user.save()
            
            UserProfile.objects.get_or_create(user=d_user, defaults={"role": "donor"})
            donor_profile, _ = Donor.objects.get_or_create(
                user=d_user,
                defaults={"location_lat": lat, "location_lng": lng}
            )
            donors_list.append(donor_profile)

        # Create orphanages
        inst_count = 0
        for data in KUMASI_ORPHANAGES:
            last_don_date = date.today() - timedelta(days=data["days_ago_donation"])
            inst, created = Institution.objects.get_or_create(
                name=data["name"],
                defaults={
                    "district": data["district"],
                    "address": data["address"],
                    "cause_description": data["cause_description"],
                    "gps_lat": data["gps_lat"],
                    "gps_lng": data["gps_lng"],
                    "children_count": data["children_count"],
                    "funding_gap": data["funding_gap"],
                    "funding_last_updated": last_don_date,
                    "contact_email": data["contact_email"],
                    "contact_phone": data["contact_phone"],
                }
            )
            if created:
                inst_count += 1

        # Create initial sample interest statements
        if donors_list:
            for idx, text in enumerate(DUMMY_DONOR_QUERIES[:3]):
                donor = donors_list[idx % len(donors_list)]
                InterestStatement.objects.get_or_create(
                    donor=donor,
                    text=text
                )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded database! Total Institutions: {Institution.objects.count()} (Added {inst_count} new)."
        ))
