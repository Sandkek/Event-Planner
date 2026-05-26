import requests
from flask import Blueprint, request, session, jsonify
from datetime import datetime
from models import db, Event, EventAttendee, ChatMessage, Poll, PollOption, PollVote, Notification
from services.email_service import send_event_update_email

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
    events = Event.query.filter_by(is_blocked=False).order_by(Event.date).all()
    return jsonify([serialize_event(event) for event in events])


@events_bp.route('/api/events/<int:event_id>')
def api_get_event(event_id):
    event = Event.query.get_or_404(event_id)

    if event.is_blocked:
        return jsonify({
            'success': False,
            'message': 'Мероприятие заблокировано администратором.'
        }), 403

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

    attendees = EventAttendee.query.filter_by(
        event_id=event.id,
        status='going'
    ).all()

    for attendee in attendees:
        if attendee.user_id == user_id:
            continue

        message_text = (
            f'Организатор изменил мероприятие «{event.title}». '
            f'Проверьте актуальную дату, место и описание.'
        )

        notification = Notification(
            user_id=attendee.user_id,
            event_id=event.id,
            title='Изменение мероприятия',
            message=message_text
        )

        db.session.add(notification)

        if (
            attendee.user.email_notifications_enabled
            and attendee.user.email
        ):
            try:
                send_event_update_email(
                    to_email=attendee.user.email,
                    event_title=event.title,
                    message_text=message_text
                )
            except Exception as error:
                print(
                    f'Ошибка отправки email пользователю {attendee.user.email}:',
                    error
                )
    
    
    db.session.commit()

    return jsonify({'success': True})


@events_bp.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event_api(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({'success': False, 'message': 'Нет прав на удаление'}), 403

    polls = Poll.query.filter_by(event_id=event_id).all()

    for poll in polls:
        PollVote.query.filter_by(poll_id=poll.id).delete()
        PollOption.query.filter_by(poll_id=poll.id).delete()
        db.session.delete(poll)

    ChatMessage.query.filter_by(event_id=event_id).delete()
    EventAttendee.query.filter_by(event_id=event_id).delete()

    db.session.delete(event)
    db.session.commit()

    return jsonify({'success': True})


@events_bp.route('/api/reverse-geocode')
def api_reverse_geocode():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({'address': ''}), 400

    response = requests.get(
        'https://nominatim.openstreetmap.org/reverse',
        params={
            'format': 'jsonv2',
            'lat': lat,
            'lon': lon
        },
        headers={
            'User-Agent': 'EventPlanner/1.0'
        },
        timeout=5
    )

    if response.status_code != 200:
        return jsonify({'address': ''}), 502

    data = response.json()

    return jsonify({
        'address': data.get('display_name', '')
    })