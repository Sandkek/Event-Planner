from flask import Blueprint, request, session, jsonify
from models import db, Event, EventAttendee, Poll, PollOption, PollVote

polls_bp = Blueprint('polls', __name__)


@polls_bp.route('/api/events/<int:event_id>/polls')
def api_get_event_polls(event_id):
    polls = Poll.query.filter_by(event_id=event_id).all()
    result = []

    for poll in polls:
        votes_map = {}

        for vote in poll.votes:
            votes_map[vote.user.email] = vote.option_id

        result.append({
            'id': poll.id,
            'title': poll.title,
            'type': poll.type,
            'options': [
                {
                    'id': option.id,
                    'text': option.text
                }
                for option in poll.options
            ],
            'votes': votes_map
        })

    return jsonify(result)


@polls_bp.route('/api/events/<int:event_id>/polls', methods=['POST'])
def api_create_poll(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({
            'success': False,
            'message': 'Создавать опрос может только организатор.'
        }), 403

    data = request.get_json()

    title = data.get('title', '').strip()
    poll_type = data.get('type', 'custom')
    options = data.get('options', [])

    if not title:
        return jsonify({'success': False, 'message': 'Укажите название опроса.'}), 400

    if len(options) < 2:
        return jsonify({'success': False, 'message': 'Добавьте минимум два варианта ответа.'}), 400

    poll = Poll(
        event_id=event_id,
        title=title,
        type=poll_type
    )

    db.session.add(poll)
    db.session.flush()

    for option_text in options:
        option_text = str(option_text).strip()

        if option_text:
            db.session.add(PollOption(
                poll_id=poll.id,
                text=option_text
            ))

    db.session.commit()

    return jsonify({'success': True, 'id': poll.id})


@polls_bp.route('/api/events/<int:event_id>/polls/<int:poll_id>', methods=['DELETE'])
def api_delete_poll(event_id, poll_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({'success': False, 'message': 'Нет прав.'}), 403

    poll = Poll.query.filter_by(id=poll_id, event_id=event_id).first_or_404()

    PollVote.query.filter_by(poll_id=poll.id).delete()
    PollOption.query.filter_by(poll_id=poll.id).delete()
    db.session.delete(poll)
    db.session.commit()

    return jsonify({'success': True})


@polls_bp.route('/api/events/<int:event_id>/polls/<int:poll_id>/vote', methods=['POST'])
def api_vote_poll(event_id, poll_id):
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
            'message': 'Голосовать могут только участники мероприятия.'
        }), 403

    data = request.get_json()
    option_id = data.get('optionId')

    option = PollOption.query.filter_by(
        id=option_id,
        poll_id=poll_id
    ).first()

    if not option:
        return jsonify({'success': False, 'message': 'Вариант ответа не найден.'}), 404

    vote = PollVote.query.filter_by(
        poll_id=poll_id,
        user_id=user_id
    ).first()

    if vote:
        vote.option_id = option.id
    else:
        vote = PollVote(
            poll_id=poll_id,
            option_id=option.id,
            user_id=user_id
        )
        db.session.add(vote)

    db.session.commit()

    return jsonify({'success': True})


@polls_bp.route('/api/events/<int:event_id>/polls', methods=['DELETE'])
def api_delete_event_polls(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({'success': False}), 403

    polls = Poll.query.filter_by(event_id=event_id).all()

    for poll in polls:
        PollVote.query.filter_by(poll_id=poll.id).delete()
        PollOption.query.filter_by(poll_id=poll.id).delete()
        db.session.delete(poll)

    db.session.commit()

    return jsonify({'success': True})