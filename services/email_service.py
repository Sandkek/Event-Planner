from flask_mail import Message
from extensions import mail


def send_event_update_email(to_email, event_title, message_text):
    msg = Message(
        subject=f'Соберёмся: изменено мероприятие «{event_title}»',
        recipients=[to_email],
        body=f'''Здравствуйте!

{message_text}

Откройте Соберёмся, чтобы посмотреть актуальную информацию о мероприятии.

С уважением,
Соберёмся
'''
    )

    mail.send(msg)