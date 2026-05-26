from app import app
from models import db, User

with app.app_context():
    user = User.query.filter_by(
        email='ya-matveynazarov2013@ya.ru'
    ).first()

    if user:
        user.is_admin = True
        db.session.commit()
        print('Администратор назначен')
    else:
        print('Пользователь не найден')