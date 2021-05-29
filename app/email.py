import smtplib

def send_email(subject, to_addr, from_addr, body_text):
    BODY = "\r\n".join((
        "From: %s" % from_addr,
        "To: %s" % to_addr,
        "Subject: %s" % subject ,
        "",
        body_text
    ))
 
    server = smtplib.SMTP('localhost')
    server.sendmail(from_addr, [to_addr], BODY)
    server.quit()