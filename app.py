import smtplib
import os
from datetime import date
import json

# Load cases
with open("cases.json", "r") as f:
    cases = json.load(f)

sender = os.environ.get("EMAIL_ID")
receiver = os.environ.get("EMAIL_ID")
password = os.environ.get("EMAIL_PASSWORD")

def send_email(subject, message):
    full_message = f"Subject: {subject}\n\n{message}"

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(sender, password)
    server.sendmail(sender, receiver, full_message)
    server.quit()

def check_cases():
    today = str(date.today())

    for c in cases:
        if c["ndoh"] == today:
            msg = f"""
Case: {c['title']}
Today is hearing
Compliance: {c['compliance']}
"""
            send_email(f"🚨 Hearing Today: {c['title']}", msg)

check_cases()
