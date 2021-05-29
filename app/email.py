import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(subject, to_addr, from_addr, body_text, body_html):
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = from_addr
    message["To"] = to_addr

    part1 = MIMEText(body_text, "plain")
    part2 = MIMEText(body_html, "html")

    message.attach(part1)
    message.attach(part2)

    server = smtplib.SMTP('localhost')
    server.sendmail(from_addr, [to_addr], message.as_text())
    server.quit()