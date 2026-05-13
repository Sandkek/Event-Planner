from flask import Blueprint, request, session, jsonify
from models import db, EventAttendee

attendees_bp = Blueprint('attendees', __name__)


def serialize_event(event):
    return {
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'date': event.date.strftime('%Y-%m-%dT%H:%M'),
        'location': event.location,
        'category': event.category,
        'image': event.image,
        'latitude': event.latitude,
        'longitude': event.longitude,
        'organizer': event.organizer.full_name,
        'organizerEmail': event.organizer.email
    }


@attendees_bp.route('/api/events/<int:event_id>/status', methods=['GET'])
def api_get_event_status(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'status': None})

    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        user_id=user_id
    ).first()

    return jsonify({'status': attendee.status if attendee else None})


@attendees_bp.route('/api/events/<int:event_id>/status', methods=['POST'])
def api_set_event_status(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    data = request.get_json()
    status = data.get('status')

    if status not in ['going', 'interested', 'not-going']:
        return jsonify({'success': False, 'message': 'Некорректный статус'}), 400

    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        user_id=user_id
    ).first()

    if attendee:
        attendee.status = status
    else:
        attendee = EventAttendee(
            event_id=event_id,
            user_id=user_id,
            status=status
        )
        db.session.add(attendee)

    db.session.commit()

    return jsonify({'success': True})


@attendees_bp.route('/api/events/<int:event_id>/status', methods=['DELETE'])
def api_delete_event_status(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        user_id=user_id
    ).first()

    if attendee:
        db.session.delete(attendee)
        db.session.commit()

    return jsonify({'success': True})


@attendees_bp.route('/api/my/joined-events')
def api_my_joined_events():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify([])

    attendees = EventAttendee.query.filter_by(
        user_id=user_id,
        status='going'
    ).all()

    events = [item.event for item in attendees]

    return jsonify([serialize_event(event) for event in events])


@attendees_bp.route('/api/events/<int:event_id>/going-count')
def api_get_going_count(event_id):
    count = EventAttendee.query.filter_by(
        event_id=event_id,
        status='going'
    ).count()

    return jsonify({'count': count})