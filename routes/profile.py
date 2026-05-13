from flask import Blueprint, request, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/api/profile', methods=['PUT'])
def api_update_profile():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    full_name = data.get('fullName', '').strip()
    email = data.get('email', '').strip().lower()

    if not full_name or not email:
        return jsonify({'success': False, 'message': 'Заполните все поля.'}), 400

    existing_user = User.query.filter(
        User.email == email,
        User.id != user.id
    ).first()

    if existing_user:
        return jsonify({
            'success': False,
            'message': 'Пользователь с таким email уже существует.'
        }), 409

    user.full_name = full_name
    user.email = email

    db.session.commit()

    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'fullName': user.full_name,
            'email': user.email
        }
    })


@profile_bp.route('/api/profile/password', methods=['PUT'])
def api_update_password():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    current_password = data.get('currentPassword', '')
    new_password = data.get('newPassword', '')

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({
            'success': False,
            'message': 'Текущий пароль введён неверно.'
        }), 400

    if len(new_password) < 6:
        return jsonify({
            'success': False,
            'message': 'Новый пароль должен содержать минимум 6 символов.'
        }), 400

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'success': True})