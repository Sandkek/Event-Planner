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
import { loadFooter } from '../ui/footer.js';


function setupLocationMap() {
  const mapContainer = document.getElementById('createEventMap');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');

  if (!mapContainer || !latitudeInput || !longitudeInput) return;

  const defaultCenter = [37.6176, 55.7558];

  const map = new maplibregl.Map({
    container: 'createEventMap',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: defaultCenter,
    zoom: 10
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  let marker = null;

  map.on('click', async event => {
    const { lng, lat } = event.lngLat;

    latitudeInput.value = lat.toFixed(6);
    longitudeInput.value = lng.toFixed(6);

    const addressElement =
      document.getElementById('selectedAddress');

    if (addressElement) {
      addressElement.textContent =
        'Определение адреса...';
    }

    const address = await reverseGeocode(lat, lng);

    if (address) {
      const locationInput = document.getElementById('location');

      locationInput.value = address;

      if (addressElement) {
        addressElement.textContent = address;
      }
    } else {
      const coordsText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      document.getElementById('location').value = coordsText;

      if (addressElement) {
        addressElement.textContent = coordsText;
      }
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


document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  await loadFooter();

  const user = await requireUser();
  if (!user) return;

  setMinDateTime();
  setupImagePreview({ alt: 'Предпросмотр изображения' });
  setupLocationMap();

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