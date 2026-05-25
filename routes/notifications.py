from flask import Blueprint, session, jsonify
from models import db, Notification

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/api/notifications')
def api_get_notifications():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify([])

    notifications = Notification.query.filter_by(user_id=user_id) \
        .order_by(Notification.created_at.desc()) \
        .all()

    return jsonify([
        {
            'id': item.id,
            'eventId': item.event_id,
            'title': item.title,
            'message': item.message,
            'isRead': item.is_read,
            'createdAt': item.created_at.isoformat()
        }
        for item in notifications
    ])


@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def api_mark_notification_read(notification_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False}), 401

    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first_or_404()

    notification.is_read = True
    db.session.commit()

    return jsonify({'success': True})