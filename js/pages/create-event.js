import { generateEventId, createEvent } from '../services/events.service.js';
import { notifyError, notifySuccess } from '../services/notifications.service.js';
import { requireUser } from '../core/guards.js';
import {
  getEventFormData,
  resolveEventImage,
  setMinDateTime,
  setupImagePreview,
  validateImageFile
} from '../ui/event-form.js';
import { generateInviteCode } from '../services/invite.service.js';
import { loadNavbar } from '../ui/navbar.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  const user = requireUser();
  if (!user) return;

  setMinDateTime();
  setupImagePreview({ alt: 'Предпросмотр изображения' });

  const form = document.getElementById('createEventForm');

  form.addEventListener('submit', async event => {
    event.preventDefault();

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

    let image = '';
    try {
      image = await resolveEventImage({ fallbackImage: '' });
    } catch {
      notifyError('Ошибка при загрузке изображения');
      return;
    }

    const eventData = getEventFormData({
      formId: 'createEventForm',
      currentUser: user,
      eventId: generateEventId(),
      image
    });

    eventData.inviteCode = generateInviteCode();

    createEvent(eventData);
    notifySuccess('Мероприятие успешно создано!');
    window.location.href = 'index.html';
  });
});