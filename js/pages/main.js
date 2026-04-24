// js/pages/main.js

import { getCurrentUser } from '../core/auth.js';
import { filterEvents, getAllEvents } from '../services/events.service.js';
import {
  getUserEventStatus,
  removeAttendeeStatus,
  setAttendeeStatus
} from '../services/attendees.service.js';
import { renderEventCard } from '../ui/event-card.js';
import { loadNavbar } from '../ui/navbar.js';
import {
  notify,
  notifySuccess
} from '../services/notifications.service.js';
import {
  getGroupedReminders
} from '../services/reminders.service.js';
import { renderRemindersBlock } from '../ui/reminders.js';

function renderEvents(events) {
  const container = document.getElementById('eventsContainer');

  if (!events.length) {
    container.innerHTML =
      '<p class="text-center text-muted">Мероприятия не найдены.</p>';
    return;
  }

  container.innerHTML = events.map(renderEventCard).join('');
}

function updateCreateButton() {
  const container = document.getElementById('createEventContainer');
  if (!container) return;

  const user = getCurrentUser();

  container.innerHTML = user
    ? `
      <a href="create-event.html" class="btn btn-light" id="createEventBtn">
        + Создать мероприятие
      </a>
    `
    : '';
}

function applyFilters() {
  const query = document.getElementById('searchInput').value;
  const category = document.getElementById('categoryFilter').value;
  const dateFilter = document.getElementById('dateFilter').value;

  const events = filterEvents({ query, category, dateFilter });
  renderEvents(events);
}

function renderMainReminders() {
  const user = getCurrentUser();
  const container = document.getElementById('remindersContainer');

  if (!container) return;

  if (!user) {
    container.innerHTML = '';
    return;
  }

  const grouped = getGroupedReminders(user);
  renderRemindersBlock(container, grouped);
}

function setupRsvpHandler() {
  document.getElementById('eventsContainer').addEventListener('click', event => {
    const button = event.target.closest('.btn-rsvp');
    if (!button) return;

    const user = getCurrentUser();

    if (!user) {
      notify('Пожалуйста, войдите или зарегистрируйтесь, чтобы записаться.');
      window.location.href = 'login.html';
      return;
    }

    const eventId = Number(button.dataset.id);
    const currentStatus = getUserEventStatus(eventId, user.email);

    if (currentStatus === 'going') {
      removeAttendeeStatus(eventId, user.email);
      notify('Вы отменили участие.');
    } else {
      setAttendeeStatus(eventId, user.email, 'going');
      notifySuccess('Вы записались на мероприятие!');
    }

    applyFilters();
    renderMainReminders();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  updateCreateButton();

  document
    .getElementById('searchInput')
    .addEventListener('input', applyFilters);

  document
    .getElementById('categoryFilter')
    .addEventListener('change', applyFilters);

  document
    .getElementById('dateFilter')
    .addEventListener('change', applyFilters);

  renderMainReminders();
  renderEvents(getAllEvents());
  setupRsvpHandler();
});