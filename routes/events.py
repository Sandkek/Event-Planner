from flask import Blueprint, request, session, jsonify
from datetime import datetime
from models import db, Event

events_bp = Blueprint('events', __name__)


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
        'inviteCode': event.invite_code,
        'organizer': event.organizer.full_name,
        'organizerEmail': event.organizer.email
    }


@events_bp.route('/api/events')
def api_get_events():
    events = Event.query.order_by(Event.date).all()
    return jsonify([serialize_event(event) for event in events])


@events_bp.route('/api/events/<int:event_id>')
def api_get_event(event_id):
    event = Event.query.get_or_404(event_id)
    return jsonify(serialize_event(event))


@events_bp.route('/api/events', methods=['POST'])
def api_create_event():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    data = request.get_json()

    event = Event(
        title=data.get('title'),
        description=data.get('description'),
        date=datetime.fromisoformat(data.get('date')),
        location=data.get('location'),
        category=data.get('category'),
        image=data.get('image', ''),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        invite_code=data.get('inviteCode', ''),
        organizer_id=user_id
    )

    db.session.add(event)
    db.session.commit()

    return jsonify({'success': True, 'id': event.id})


@events_bp.route('/api/events/<int:event_id>', methods=['PUT'])
def api_update_event(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({'success': False, 'message': 'Нет прав на редактирование'}), 403

    data = request.get_json()

    event.title = data.get('title')
    event.description = data.get('description')
    event.date = datetime.fromisoformat(data.get('date'))
    event.location = data.get('location')
    event.category = data.get('category')
    event.image = data.get('image', '')
    event.latitude = data.get('latitude')
    event.longitude = data.get('longitude')
    event.invite_code = data.get('inviteCode', '')

    db.session.commit()

    return jsonify({'success': True})


@events_bp.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event_api(event_id):
    event = Event.query.get_or_404(event_id)

    db.session.delete(event)
    db.session.commit()

    return jsonify({'success': True})