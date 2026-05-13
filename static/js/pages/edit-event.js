import {
  deleteEvent,
  getEventById,
  updateEvent
} from '../services/events.service.js';
import { deleteEventAttendees } from '../services/attendees.service.js';
import { deleteEventChat } from '../services/chat.service.js';
import {
  confirmAction,
  notifyError,
  notifySuccess
} from '../services/notifications.service.js';
import { canDeleteEvent, canEditEvent } from '../services/event-permissions.js';
import { requireAuth } from '../core/auth.js';
import { requireEntity } from '../core/guards.js';
import { loadNavbar } from '../ui/navbar.js';
import {
  fillEventForm,
  getEventFormData,
  resolveEventImage,
  setMinDateTime,
  setupImagePreview,
  validateImageFile
} from '../ui/event-form.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  const user = await requireAuth();
  if (!user) return;

  const pathParts = window.location.pathname.split('/');
  const eventId = Number(pathParts[pathParts.length - 1]);

  if (!eventId || Number.isNaN(eventId)) {
    notifyError('Не указан ID мероприятия');
    window.history.back();
    return;
  }

  const event = await getEventById(eventId);

  if (!requireEntity(event, 'Мероприятие не найдено.')) return;

  if (!canEditEvent(event, user)) {
    notifyError('Вы не можете редактировать это мероприятие.');
    window.location.href = '/';
    return;
  }

  setMinDateTime();
  fillEventForm(event);
  setupImagePreview({ alt: 'Новое изображение' });

  const form = document.getElementById('editEventForm');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const file = document.getElementById('imageUpload')?.files?.[0];
    const imageValidation = validateImageFile(file);

    if (!imageValidation.valid) {
      notifyError(imageValidation.message);
      return;
    }

    let image = event.image || '';

    try {
      image = await resolveEventImage({
        fallbackImage: event.image || ''
      });
    } catch {
      notifyError('Ошибка при загрузке изображения');
      return;
    }

    const updatedEvent = getEventFormData({
      formId: 'editEventForm',
      currentUser: user,
      eventId,
      image
    });

    updatedEvent.inviteCode = event.inviteCode || '';

    await updateEvent(updatedEvent);
    notifySuccess('Мероприятие успешно обновлено!');
    window.location.href = `/event/${eventId}`;
  });

  document.getElementById('deleteEventBtn').addEventListener('click', async () => {
    if (!canDeleteEvent(event, user)) {
      notifyError('Вы не можете удалить это мероприятие.');
      return;
    }

    const confirmed = await confirmAction(
      'Вы уверены, что хотите удалить это мероприятие? Все записи участников и сообщения чата будут удалены.',
      {
        title: 'Удаление мероприятия',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        confirmButtonClass: 'btn-danger'
      }
    );

    if (!confirmed) return;

    await deleteEvent(eventId);
    await deleteEventAttendees(eventId);
    await deleteEventChat(eventId);

    notifySuccess('Мероприятие удалено.');
    window.location.href = '/profile';
  });
});