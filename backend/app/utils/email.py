import os
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_email(to_email: str, subject: str, body: str, sender_name: Optional[str] = "PreOrderFood") -> None:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        # In development, fail silently to avoid crashing if SMTP is not configured.
        # You can log this in real deployments.
        print("[email] SMTP credentials not configured; email not sent.")
        return

    msg = MIMEText(body, "plain", "utf-8")
    msg["From"] = formataddr((sender_name or "PreOrderFood", SMTP_EMAIL))
    msg["To"] = to_email
    msg["Subject"] = subject

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)


def send_otp_email(to_email: str, code: str, purpose: str) -> None:
    if purpose == "verify_email":
        subject = "Verify your PreOrderFood account"
        body = (
            f"Your PreOrderFood email verification code is {code}.\n\n"
            "This code will expire in 10 minutes. If you did not request this, you can ignore this email."
        )
    elif purpose == "reset_password":
        subject = "Reset your PreOrderFood password"
        body = (
            f"Your PreOrderFood password reset code is {code}.\n\n"
            "This code will expire in 10 minutes. If you did not request this, you can ignore this email."
        )
    else:
        subject = "Your PreOrderFood code"
        body = f"Your PreOrderFood one-time code is {code}. It will expire in 10 minutes."

    send_email(to_email, subject, body)
