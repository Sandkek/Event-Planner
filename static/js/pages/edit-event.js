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
import { loadFooter } from '../ui/footer.js';
import {
  fillEventForm,
  getEventFormData,
  resolveEventImage,
  setMinDateTime,
  setupImagePreview,
  validateImageFile
} from '../ui/event-form.js';


async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `/api/reverse-geocode?lat=${lat}&lon=${lng}`
    );

    const data = await response.json();

    return data.address || '';
  } catch (error) {
    console.error(error);
    return '';
  }
}

function setupLocationMap(eventData) {
  const mapContainer = document.getElementById('editEventMap');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const locationInput = document.getElementById('location');
  const addressElement = document.getElementById('selectedAddress');

  if (!mapContainer || !latitudeInput || !longitudeInput) return;

  const hasCoordinates =
    Number.isFinite(Number(eventData.latitude)) &&
    Number.isFinite(Number(eventData.longitude));

  const defaultCenter = hasCoordinates
    ? [Number(eventData.longitude), Number(eventData.latitude)]
    : [37.6176, 55.7558];

  if (hasCoordinates) {
    latitudeInput.value = Number(eventData.latitude).toFixed(6);
    longitudeInput.value = Number(eventData.longitude).toFixed(6);

    if (addressElement) {
      addressElement.textContent = eventData.location || 'Адрес выбран';
    }
  }

  const map = new maplibregl.Map({
    container: 'editEventMap',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: defaultCenter,
    zoom: hasCoordinates ? 14 : 10
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  let marker = null;

  if (hasCoordinates) {
    marker = new maplibregl.Marker()
      .setLngLat(defaultCenter)
      .addTo(map);
  }

  map.on('click', async event => {
    const { lng, lat } = event.lngLat;

    latitudeInput.value = lat.toFixed(6);
    longitudeInput.value = lng.toFixed(6);

    if (addressElement) {
      addressElement.textContent = 'Определение адреса...';
    }

    const address = await reverseGeocode(lat, lng);

    const resultAddress =
      address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (locationInput) {
      locationInput.value = resultAddress;
    }

    if (addressElement) {
      addressElement.textContent = resultAddress;
    }

    if (!marker) {
      marker = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      marker.setLngLat([lng, lat]);
    }
  });

  setTimeout(() => {
    map.resize();
  }, 300);
}


document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  await loadFooter();

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

  let currentImage = event.image || '';

  setMinDateTime();
  fillEventForm(event);
  setupImagePreview({ alt: 'Новое изображение' });
  setupLocationMap(event);

  const removeImageBtn = document.getElementById('removeImageBtn');

  if (removeImageBtn && !currentImage) {
    removeImageBtn.style.display = 'none';
  }

  removeImageBtn?.addEventListener('click', () => {
    currentImage = '';

    const preview = document.getElementById('imagePreview');

    if (preview) {
      preview.innerHTML = `
        <div class="text-muted">
          Изображение будет удалено после сохранения.
        </div>
      `;
    }

    const fileInput = document.getElementById('imageUpload');

    if (fileInput) {
      fileInput.value = '';
    }

    notifySuccess('Изображение помечено для удаления.');
  });

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

    let image = currentImage;

    try {
      image = await resolveEventImage({
        fallbackImage: currentImage
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