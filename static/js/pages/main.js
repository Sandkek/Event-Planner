// static/js/pages/main.js

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
import { getGroupedReminders } from '../services/reminders.service.js';
import { renderRemindersBlock } from '../ui/reminders.js';

function renderEvents(events) {
  const container = document.getElementById('eventsContainer');
  if (!container) return;

  if (!events.length) {
    container.innerHTML =
      '<p class="text-center text-muted">Мероприятия не найдены.</p>';
    return;
  }

  container.innerHTML = events.map(renderEventCard).join('');
}

async function updateCreateButton() {
  const container = document.getElementById('createEventContainer');
  if (!container) return;

  const user = await getCurrentUser();

  container.innerHTML = user
    ? `
      <a href="/create-event" class="btn btn-light" id="createEventBtn">
        + Создать мероприятие
      </a>
    `
    : '';
}

async function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const dateFilter = document.getElementById('dateFilter');

  const query = searchInput ? searchInput.value : '';
  const category = categoryFilter ? categoryFilter.value : '';
  const selectedDateFilter = dateFilter ? dateFilter.value : '';

  const events = await filterEvents({
    query,
    category,
    dateFilter: selectedDateFilter
  });

  renderEvents(events);
}

async function renderMainReminders() {
  const user = await getCurrentUser();
  const container = document.getElementById('remindersContainer');

  if (!container) return;

  if (!user) {
    container.innerHTML = '';
    return;
  }

  const grouped = await getGroupedReminders(user);
  renderRemindersBlock(container, grouped);
}

function setupRsvpHandler() {
  const eventsContainer = document.getElementById('eventsContainer');
  if (!eventsContainer) return;

  eventsContainer.addEventListener('click', async event => {
    const button = event.target.closest('.btn-rsvp');
    if (!button) return;

    const user = await getCurrentUser();

    if (!user) {
      notify('Пожалуйста, войдите или зарегистрируйтесь, чтобы записаться.');
      window.location.href = '/login';
      return;
    }

    const eventId = Number(button.dataset.id);
    const currentStatus = await getUserEventStatus(eventId);

    if (currentStatus === 'going') {
      await removeAttendeeStatus(eventId);
      notify('Вы отменили участие.');
    } else {
      await setAttendeeStatus(eventId, null, 'going');
      notifySuccess('Вы записались на мероприятие!');
    }

    await applyFilters();
    await renderMainReminders();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  await updateCreateButton();

  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
  document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);
  document.getElementById('dateFilter')?.addEventListener('change', applyFilters);

  await renderMainReminders();

  const events = await getAllEvents();
  renderEvents(events);

  setupRsvpHandler();
});