from flask import Flask
from models import db

from routes.pages import pages_bp
from routes.auth import auth_bp
from routes.events import events_bp
from routes.attendees import attendees_bp
from routes.chat import chat_bp
from routes.polls import polls_bp
from routes.profile import profile_bp
from routes.notifications import notifications_bp

from dotenv import load_dotenv

load_dotenv()

import os
from flask import Flask
from models import db
from extensions import mail

app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eventplanner.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True

app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

app.config['MAIL_DEFAULT_SENDER'] = (
    os.getenv('MAIL_DEFAULT_SENDER') or os.getenv('MAIL_USERNAME')
)

mail.init_app(app)
db.init_app(app)

# print('MAIL_USERNAME:', app.config['MAIL_USERNAME'])
# print('MAIL_DEFAULT_SENDER:', app.config['MAIL_DEFAULT_SENDER'])


app.register_blueprint(pages_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(events_bp)
app.register_blueprint(attendees_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(polls_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(notifications_bp)


@app.route('/favicon.ico')
def favicon():
    return '', 204


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)