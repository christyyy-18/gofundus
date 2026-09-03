"""
email_utils.py
--------------
Central helpers for every transactional email GoFundUs sends.
All functions accept plain Python objects and return True/False so callers
can decide how to surface failures without crashing the API response.
"""
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

PLATFORM_NAME = "GoFundUs"
ADMIN_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gofundus.org')


# ─────────────────────────────────────────────────────────────────────────────
# 1. Support / Contact inquiry (from the Support page or institution contact)
# ─────────────────────────────────────────────────────────────────────────────

def send_support_inquiry_to_admin(
    *,
    from_name: str,
    from_email: str,
    message: str,
    source: str = "Support Page",
    admin_email: str | None = None,
) -> bool:
    """
    Sends a copy of a donor/user support inquiry to the platform admin inbox.
    """
    recipient = admin_email or ADMIN_EMAIL
    subject = f"[{PLATFORM_NAME}] New Support Inquiry from {from_name}"
    body = (
        f"A new support inquiry has been submitted on {PLATFORM_NAME}.\n\n"
        f"From:    {from_name} <{from_email}>\n"
        f"Source:  {source}\n"
        f"------------------------------------------------------------\n"
        f"{message}\n"
        f"------------------------------------------------------------\n\n"
        f"Please reply directly to {from_email} to respond to this inquiry.\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=ADMIN_EMAIL,
            recipient_list=[recipient],
            reply_to=[from_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("send_support_inquiry_to_admin failed: %s", exc)
        return False


def send_support_acknowledgement(
    *,
    to_name: str,
    to_email: str,
) -> bool:
    """
    Sends an auto-acknowledgement email to the user who submitted a support inquiry.
    """
    subject = f"We received your inquiry — {PLATFORM_NAME}"
    body = (
        f"Hi {to_name},\n\n"
        f"Thank you for reaching out to {PLATFORM_NAME}. We have received your inquiry "
        f"and our team will follow up within 24 hours.\n\n"
        f"If your matter is urgent, please email us directly at {ADMIN_EMAIL}.\n\n"
        f"Warm regards,\n"
        f"The {PLATFORM_NAME} Team\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=ADMIN_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("send_support_acknowledgement failed: %s", exc)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# 2. Institution contact (donor messages an orphanage directly)
# ─────────────────────────────────────────────────────────────────────────────

def send_institution_contact(
    *,
    institution_name: str,
    institution_email: str,
    donor_name: str,
    donor_email: str,
    message: str,
) -> bool:
    """
    Forwards a donor's contact message to the institution's registered email.
    """
    subject = f"[{PLATFORM_NAME}] New message from donor {donor_name}"
    body = (
        f"Hello {institution_name},\n\n"
        f"A donor on {PLATFORM_NAME} has sent you the following message:\n\n"
        f"From:  {donor_name} <{donor_email}>\n"
        f"------------------------------------------------------------\n"
        f"{message}\n"
        f"------------------------------------------------------------\n\n"
        f"You can reply directly to this email to respond to the donor.\n\n"
        f"Warm regards,\n"
        f"The {PLATFORM_NAME} Team\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=ADMIN_EMAIL,
            recipient_list=[institution_email],
            reply_to=[donor_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("send_institution_contact failed: %s", exc)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# 3. Admin update prompt (admin notifies an institution to refresh their data)
# ─────────────────────────────────────────────────────────────────────────────

def send_institution_update_prompt(
    *,
    institution_name: str,
    institution_email: str,
    district: str,
) -> bool:
    """
    Emails an institution asking them to log in and update their funding gap
    and headcount so donor-facing data stays fresh.
    """
    subject = f"[{PLATFORM_NAME}] Action Required: Please update your institution data"
    body = (
        f"Hello {institution_name} team,\n\n"
        f"The {PLATFORM_NAME} admin team has noticed that your institution's operational "
        f"data (funding gap and children count) may be out of date.\n\n"
        f"Up-to-date information helps donors in {district} and across Ghana find and "
        f"support your home more effectively.\n\n"
        f"Please log in to your portal and update your current:\n"
        f"  • Number of children in care\n"
        f"  • Current funding gap (GHS)\n"
        f"  • Institution cause description (if changed)\n\n"
        f"It only takes a minute and makes a real difference for your institution's "
        f"visibility on the platform.\n\n"
        f"If you have any questions, reply to this email and we will assist you.\n\n"
        f"Warm regards,\n"
        f"The {PLATFORM_NAME} Admin Team\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=ADMIN_EMAIL,
            recipient_list=[institution_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("send_institution_update_prompt failed: %s", exc)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# 4. Welcome email after registration
# ─────────────────────────────────────────────────────────────────────────────

def send_welcome_email(
    *,
    to_name: str,
    to_email: str,
    role: str = 'donor',
    institution_name: str | None = None,
) -> bool:
    """
    Sends a welcome email immediately after a new user registers.
    """
    if role == 'institution_admin' and institution_name:
        subject = f"Welcome to {PLATFORM_NAME} — {institution_name} portal is active!"
        body = (
            f"Hi {to_name},\n\n"
            f"Welcome to {PLATFORM_NAME}! Your orphanage portal for "
            f"\"{institution_name}\" is now active.\n\n"
            f"You can log in at any time to:\n"
            f"  • Update your funding gap and headcount\n"
            f"  • View messages from donors\n"
            f"  • Keep your institution's cause description current\n\n"
            f"If you need any help getting started, visit the Support page or reply to this email.\n\n"
            f"Warm regards,\n"
            f"The {PLATFORM_NAME} Team\n"
        )
    else:
        subject = f"Welcome to {PLATFORM_NAME}!"
        body = (
            f"Hi {to_name},\n\n"
            f"Welcome to {PLATFORM_NAME}! Your donor account is now active.\n\n"
            f"You can now:\n"
            f"  • Browse registered orphanages across Kumasi\n"
            f"  • Use our AI matching to discover causes aligned to your interests\n"
            f"  • Contact institutions directly through the platform\n\n"
            f"If you have any questions, visit the Support page or reply to this email.\n\n"
            f"Warm regards,\n"
            f"The {PLATFORM_NAME} Team\n"
        )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=ADMIN_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("send_welcome_email failed: %s", exc)
        return False
