// js/ui/event-form.js

import { imageToBase64 } from '../core/utils.js';

export function setMinDateTime(inputId = 'date') {
  const input = document.getElementById(inputId);
  if (!input) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  input.min = `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function setupImagePreview({
  fileInputId = 'imageUpload',
  previewContainerId = 'imagePreview',
  alt = 'Предпросмотр'
} = {}) {
  const fileInput = document.getElementById(fileInputId);
  const preview = document.getElementById(previewContainerId);

  if (!fileInput || !preview) return;

  fileInput.addEventListener('change', function () {
    preview.innerHTML = '';

    const file = this.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `
        <img
          src="${e.target.result}"
          alt="${alt}"
          class="img-thumbnail"
          style="max-height: 200px;"
        >
      `;
    };
    reader.readAsDataURL(file);
  });
}

export function renderCurrentImage(image, previewContainerId = 'imagePreview') {
  const preview = document.getElementById(previewContainerId);
  if (!preview || !image) return;

  preview.innerHTML = `
    <img
      src="${image}"
      alt="Текущее изображение"
      class="img-thumbnail"
      style="max-height: 200px;"
    >
  `;
}

export function validateImageFile(file, maxSizeMb = 2) {
  if (!file) {
    return { valid: true };
  }

  const maxSize = maxSizeMb * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Файл слишком большой. Максимальный размер — ${maxSizeMb} МБ.`
    };
  }

  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      message: 'Можно загружать только изображения.'
    };
  }

  return { valid: true };
}

export function fillEventForm(event) {
  const eventIdInput = document.getElementById('eventId');
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const dateInput = document.getElementById('date');
  const locationInput = document.getElementById('location');
  const categoryInput = document.getElementById('category');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');

  if (eventIdInput) eventIdInput.value = event.id ?? '';
  if (titleInput) titleInput.value = event.title ?? '';
  if (descriptionInput) descriptionInput.value = event.description ?? '';
  if (dateInput) dateInput.value = event.date ?? '';
  if (locationInput) locationInput.value = event.location ?? '';
  if (categoryInput) categoryInput.value = event.category ?? '';
  if (latitudeInput) latitudeInput.value = event.latitude ?? '';
  if (longitudeInput) longitudeInput.value = event.longitude ?? '';

  if (event.image) {
    renderCurrentImage(event.image);
  }
}

export async function resolveEventImage({
  fileInputId = 'imageUpload',
  fallbackImage = ''
} = {}) {
  const file = document.getElementById(fileInputId)?.files?.[0];

  if (!file) {
    return fallbackImage;
  }

  return imageToBase64(file);
}

export function getEventFormData({
  formId,
  currentUser,
  eventId = null,
  image = ''
}) {
  const form = document.getElementById(formId);
  if (!form) {
    throw new Error(`Форма с id="${formId}" не найдена`);
  }

  const title = form.querySelector('#title')?.value.trim() || '';
  const description = form.querySelector('#description')?.value.trim() || '';
  const date = form.querySelector('#date')?.value || '';
  const location = form.querySelector('#location')?.value.trim() || '';
  const category = form.querySelector('#category')?.value || '';

  const latitudeRaw = form.querySelector('#latitude')?.value.trim() || '';
  const longitudeRaw = form.querySelector('#longitude')?.value.trim() || '';

  const latitude = latitudeRaw === '' ? null : Number(latitudeRaw);
  const longitude = longitudeRaw === '' ? null : Number(longitudeRaw);

  return {
    id: eventId,
    title,
    description,
    date,
    location,
    category,
    organizer: currentUser.fullName,
    organizerEmail: currentUser.email,
    image,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null
  };
}