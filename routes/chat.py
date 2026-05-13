from flask import Blueprint, request, session, jsonify
from models import db, Event, EventAttendee, ChatMessage

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/api/events/<int:event_id>/chat')
def api_get_chat_messages(event_id):
    messages = ChatMessage.query.filter_by(event_id=event_id) \
        .order_by(ChatMessage.created_at.asc()) \
        .all()

    return jsonify([
        {
            'id': message.id,
            'text': message.text,
            'userName': message.user.full_name,
            'userEmail': message.user.email,
            'timestamp': message.created_at.isoformat()
        }
        for message in messages
    ])


@chat_bp.route('/api/events/<int:event_id>/chat', methods=['POST'])
def api_send_chat_message(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        user_id=user_id,
        status='going'
    ).first()

    if not attendee:
        return jsonify({
            'success': False,
            'message': 'Чат доступен только участникам мероприятия.'
        }), 403

    data = request.get_json()
    text = data.get('text', '').strip()

    if not text:
        return jsonify({'success': False, 'message': 'Сообщение пустое.'}), 400

    message = ChatMessage(
        event_id=event_id,
        user_id=user_id,
        text=text
    )

    db.session.add(message)
    db.session.commit()

    return jsonify({'success': True})


@chat_bp.route('/api/events/<int:event_id>/chat', methods=['DELETE'])
def api_delete_event_chat(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({'success': False, 'message': 'Нет прав'}), 403

    ChatMessage.query.filter_by(event_id=event_id).delete()
    db.session.commit()

    return jsonify({'success': True})