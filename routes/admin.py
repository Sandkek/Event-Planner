from flask import Blueprint, render_template, session, redirect, jsonify, request
from models import db, User, Event, EventAttendee, ChatMessage, Poll, PollOption, PollVote

admin_bp = Blueprint('admin', __name__)


def get_current_admin():
    user_id = session.get('user_id')

    if not user_id:
        return None

    user = User.query.get(user_id)

    if not user or not user.is_admin:
        return None

    return user


def delete_event_with_related_data(event):
    event_id = event.id

    polls = Poll.query.filter_by(event_id=event_id).all()

    for poll in polls:
        PollVote.query.filter_by(poll_id=poll.id).delete()
        PollOption.query.filter_by(poll_id=poll.id).delete()
        db.session.delete(poll)

    ChatMessage.query.filter_by(event_id=event_id).delete()
    EventAttendee.query.filter_by(event_id=event_id).delete()

    db.session.delete(event)


@admin_bp.route('/admin')
def admin_page():
    admin = get_current_admin()

    if not admin:
        return redirect('/')

    return render_template('admin.html')


@admin_bp.route('/api/admin/stats')
def api_admin_stats():
    admin = get_current_admin()

    if not admin:
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403

    return jsonify({
        'usersCount': User.query.count(),
        'eventsCount': Event.query.count(),
        'blockedEventsCount': Event.query.filter_by(is_blocked=True).count(),
        'attendeesCount': EventAttendee.query.count(),
        'messagesCount': ChatMessage.query.count(),
        'pollsCount': Poll.query.count()
    })


@admin_bp.route('/api/admin/users')
def api_admin_users():
    admin = get_current_admin()

    if not admin:
        return jsonify([]), 403

    users = User.query.order_by(User.id.desc()).all()

    return jsonify([
        {
            'id': user.id,
            'fullName': user.full_name,
            'email': user.email,
            'isAdmin': user.is_admin
        }
        for user in users
    ])


@admin_bp.route('/api/admin/users/<int:user_id>/admin', methods=['PUT'])
def api_admin_toggle_user_role(user_id):
    admin = get_current_admin()

    if not admin:
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403

    data = request.get_json()
    is_admin = bool(data.get('isAdmin'))

    user = User.query.get_or_404(user_id)

    if user.id == admin.id and not is_admin:
        return jsonify({
            'success': False,
            'message': 'Нельзя снять права администратора с самого себя.'
        }), 400

    user.is_admin = is_admin
    db.session.commit()

    return jsonify({'success': True})


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def api_admin_delete_user(user_id):
    admin = get_current_admin()

    if not admin:
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403

    user = User.query.get_or_404(user_id)

    if user.id == admin.id:
        return jsonify({
            'success': False,
            'message': 'Нельзя удалить самого себя.'
        }), 400

    user_events = Event.query.filter_by(organizer_id=user.id).all()

    for event in user_events:
        delete_event_with_related_data(event)

    EventAttendee.query.filter_by(user_id=user.id).delete()
    ChatMessage.query.filter_by(user_id=user.id).delete()
    PollVote.query.filter_by(user_id=user.id).delete()

    db.session.delete(user)
    db.session.commit()

    return jsonify({'success': True})


@admin_bp.route('/api/admin/events')
def api_admin_events():
    admin = get_current_admin()

    if not admin:
        return jsonify([]), 403

    events = Event.query.order_by(Event.date.desc()).all()

    return jsonify([
        {
            'id': event.id,
            'title': event.title,
            'date': event.date.strftime('%Y-%m-%d %H:%M'),
            'location': event.location,
            'organizer': event.organizer.full_name,
            'organizerEmail': event.organizer.email,
            'attendeesCount': EventAttendee.query.filter_by(
                event_id=event.id,
                status='going'
            ).count(),
            'isBlocked': event.is_blocked
        }
        for event in events
    ])


@admin_bp.route('/api/admin/events/<int:event_id>/block', methods=['PUT'])
def api_admin_toggle_event_block(event_id):
    admin = get_current_admin()

    if not admin:
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403

    data = request.get_json()
    is_blocked = bool(data.get('isBlocked'))

    event = Event.query.get_or_404(event_id)
    event.is_blocked = is_blocked

    db.session.commit()

    return jsonify({'success': True})


@admin_bp.route('/api/admin/events/<int:event_id>', methods=['DELETE'])
def api_admin_delete_event(event_id):
    admin = get_current_admin()

    if not admin:
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403

    event = Event.query.get_or_404(event_id)

    delete_event_with_related_data(event)
    db.session.commit()

    return jsonify({'success': True})