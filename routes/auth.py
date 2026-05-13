from flask import Blueprint, request, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()

    full_name = data.get('fullName', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not full_name or not email or not password:
        return jsonify({'success': False, 'message': 'Заполните все поля.'}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            'success': False,
            'message': 'Пользователь с таким email уже существует.'
        }), 409

    user = User(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    session['user_id'] = user.id

    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'fullName': user.full_name,
            'email': user.email
        }
    })


@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            'success': False,
            'message': 'Неверный email или пароль.'
        }), 401

    session['user_id'] = user.id

    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'fullName': user.full_name,
            'email': user.email
        }
    })


@auth_bp.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})


@auth_bp.route('/api/current-user')
def api_current_user():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'user': None})

    user = User.query.get(user_id)

    if not user:
        session.clear()
        return jsonify({'user': None})

    return jsonify({
        'user': {
            'id': user.id,
            'fullName': user.full_name,
            'email': user.email
        }
    })