from flask import Flask, render_template, request, session, jsonify, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import db, User, Event, EventAttendee, ChatMessage, Poll, PollOption, PollVote

app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eventplanner.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/register')
def register():
    return render_template('register.html')


@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('profile.html')


@app.route('/create-event')
def create_event():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('create-event.html')


@app.route('/event/<int:event_id>')
def event_detail(event_id):
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('event.html')


@app.route('/edit-event/<int:event_id>')
def edit_event(event_id):
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('edit-event.html')


@app.route('/settings')
def settings():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('settings.html')


@app.route('/calendar')
def calendar():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('calendar.html')


@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()

    full_name = data.get('fullName', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not full_name or not email or not password:
        return jsonify({
            'success': False,
            'message': 'Заполните все поля.'
        }), 400

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


@app.route('/api/login', methods=['POST'])
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


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/api/current-user')
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


@app.route('/favicon.ico')
def favicon():
    return '', 204


@app.route('/api/events')
def api_get_events():
    events = Event.query.order_by(Event.date).all()

    return jsonify([
        {
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
        for event in events
    ])


@app.route('/api/events/<int:event_id>')
def api_get_event(event_id):
    event = Event.query.get_or_404(event_id)

    return jsonify({
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
    })


@app.route('/api/events', methods=['POST'])
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


@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event_api(event_id):
    event = Event.query.get_or_404(event_id)

    db.session.delete(event)
    db.session.commit()

    return jsonify({'success': True})


@app.route('/api/events/<int:event_id>', methods=['PUT'])
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


@app.route('/api/events/<int:event_id>/status', methods=['GET'])
def api_get_event_status(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'status': None})

    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        user_id=user_id
    ).first()

    return jsonify({
        'status': attendee.status if attendee else None
    })


@app.route('/api/events/<int:event_id>/status', methods=['POST'])
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


@app.route('/api/events/<int:event_id>/status', methods=['DELETE'])
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


@app.route('/api/my/joined-events')
def api_my_joined_events():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify([])

    attendees = EventAttendee.query.filter_by(
        user_id=user_id,
        status='going'
    ).all()

    events = [item.event for item in attendees]

    return jsonify([
        {
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
        for event in events
    ])


@app.route('/api/events/<int:event_id>/going-count')
def api_get_going_count(event_id):
    count = EventAttendee.query.filter_by(
        event_id=event_id,
        status='going'
    ).count()

    return jsonify({'count': count})


@app.route('/api/events/<int:event_id>/chat')
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


@app.route('/api/events/<int:event_id>/chat', methods=['POST'])
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


@app.route('/api/events/<int:event_id>/chat', methods=['DELETE'])
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


@app.route('/api/events/<int:event_id>/polls')
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


@app.route('/api/events/<int:event_id>/polls', methods=['POST'])
def api_create_poll(event_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Необходима авторизация'}), 401

    event = Event.query.get_or_404(event_id)

    if event.organizer_id != user_id:
        return jsonify({'success': False, 'message': 'Создавать опрос может только организатор.'}), 403

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


@app.route('/api/events/<int:event_id>/polls/<int:poll_id>', methods=['DELETE'])
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


@app.route('/api/events/<int:event_id>/polls/<int:poll_id>/vote', methods=['POST'])
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


@app.route('/api/events/<int:event_id>/polls', methods=['DELETE'])
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


@app.route('/api/profile', methods=['PUT'])
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


@app.route('/api/profile/password', methods=['PUT'])
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


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)