from flask import Flask
from models import db

from routes.pages import pages_bp
from routes.auth import auth_bp
from routes.events import events_bp
from routes.attendees import attendees_bp
from routes.chat import chat_bp
from routes.polls import polls_bp
from routes.profile import profile_bp

app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eventplanner.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(pages_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(events_bp)
app.register_blueprint(attendees_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(polls_bp)
app.register_blueprint(profile_bp)


@app.route('/favicon.ico')
def favicon():
    return '', 204


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)