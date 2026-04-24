import { getCurrentUser } from '../core/auth.js';
import { formatShortDate, getEventPlaceholderSvg } from '../core/utils.js';
import { getGoingCount, getUserEventStatus } from '../services/attendees.service.js';

export function renderEventCard(event) {
  const currentUser = getCurrentUser();
  const currentStatus = currentUser
    ? getUserEventStatus(event.id, currentUser.email)
    : null;

  let description = event.description || '';
  if (description.length > 120) {
    description = `${description.slice(0, 120)}...`;
  }

  const imageUrl = event.image || getEventPlaceholderSvg(320, 180, '🖼️');

  return `
    <div class="event-card">
      <a href="event.html?id=${event.id}" class="text-decoration-none text-dark">
        <div class="event-image-container" style="height: 180px; overflow: hidden;">
          <img src="${imageUrl}" alt="${event.title}" class="event-image w-100 h-100" style="object-fit: cover;">
        </div>
        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-meta">${formatShortDate(event.date)} · ${event.location}</p>
          <p class="event-description">${description}</p>
        </div>
      </a>
      <div class="px-3 pb-3">
        <button class="btn-rsvp" data-id="${event.id}">
          ${currentStatus === 'going' ? '✅ Записан(а)' : 'Пойду'} (${getGoingCount(event.id)})
        </button>
      </div>
    </div>
  `;
}