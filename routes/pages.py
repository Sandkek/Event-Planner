from flask import Blueprint, render_template, session, redirect

pages_bp = Blueprint('pages', __name__)


@pages_bp.route('/')
def index():
    return render_template('index.html')


@pages_bp.route('/login')
def login():
    return render_template('login.html')


@pages_bp.route('/register')
def register():
    return render_template('register.html')


@pages_bp.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('profile.html')


@pages_bp.route('/create-event')
def create_event():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('create-event.html')


@pages_bp.route('/event/<int:event_id>')
def event_detail(event_id):
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('event.html')


@pages_bp.route('/edit-event/<int:event_id>')
def edit_event(event_id):
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('edit-event.html')


@pages_bp.route('/settings')
def settings():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('settings.html')


@pages_bp.route('/calendar')
def calendar():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('calendar.html')