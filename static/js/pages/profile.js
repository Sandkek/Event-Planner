// static/js/pages/profile.js

import { requireAuth } from '../core/auth.js';
import { formatShortDate, getEventPlaceholderSvg } from '../core/utils.js';
import { getAllEvents } from '../services/events.service.js';
import { getJoinedEvents } from '../services/attendees.service.js';
import { canManageEvent } from '../services/event-permissions.js';
import { loadNavbar } from '../ui/navbar.js';
import { getGroupedReminders } from '../services/reminders.service.js';
import { renderRemindersBlock } from '../ui/reminders.js';

function renderEventCard(event, user) {
  let description = event.description || '';

  if (description.length > 120) {
    description = `${description.slice(0, 120)}...`;
  }

  const imageUrl = event.image || getEventPlaceholderSvg(320, 180, '🖼️');
  const canManage = canManageEvent(event, user);

  return `
    <div class="event-card">
      <a href="/event/${event.id}" class="text-decoration-none text-dark">
        <div class="event-image-container" style="height: 180px; overflow: hidden;">
          <img src="${imageUrl}" alt="${event.title}" class="event-image w-100 h-100" style="object-fit: cover;">
        </div>

        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-meta">${formatShortDate(event.date)} · ${event.location}</p>
          <p class="event-description">${description}</p>
        </div>
      </a>

      ${
        canManage
          ? `
            <div class="px-3 pb-3">
              <a href="/edit-event/${event.id}" class="btn btn-outline-primary btn-sm w-100">
                Редактировать
              </a>
            </div>
          `
          : ''
      }
    </div>
  `;
}

function renderEvents(containerId, events, user) {
  const container = document.getElementById(containerId);

  if (!container) return;

  if (!events.length) {
    container.innerHTML = '<p class="no-events">Нет мероприятий</p>';
    return;
  }

  container.innerHTML = events
    .map(event => renderEventCard(event, user))
    .join('');
}

async function renderProfileReminders(user) {
  const container = document.getElementById('profileRemindersContainer');

  if (!container) return;

  const grouped = await getGroupedReminders(user);
  renderRemindersBlock(container, grouped);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  const user = await requireAuth();
  if (!user) return;

  document.getElementById('profileName').textContent = user.fullName;

  const allEvents = await getAllEvents();
  const joinedEvents = await getJoinedEvents();

  const myEvents = allEvents.filter(event => {
    return event.organizerEmail === user.email;
  });

  await renderProfileReminders(user);

  renderEvents('myEventsContainer', myEvents, user);
  renderEvents('joinedEventsContainer', joinedEvents, user);
});