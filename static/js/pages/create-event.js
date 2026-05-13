import { createEvent } from '../services/events.service.js';
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

  const user = await requireUser();
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
      eventId: null,
      image
    });

    eventData.inviteCode = generateInviteCode();

    const result = await createEvent(eventData);

    if (!result.success) {
      notifyError(result.message || 'Не удалось создать мероприятие.');
      return;
    }

    notifySuccess('Мероприятие успешно создано!');
    window.location.href = `/event/${result.id}`;
  });
});