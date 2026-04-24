// js/pages/calendar.js

import { loadNavbar } from '../ui/navbar.js';
import { getAllEvents } from '../services/events.service.js';
import { requireUser } from '../core/guards.js';
import { getUserEventStatus } from '../services/attendees.service.js';

function filterEvents(events, user, filters) {
  return events.filter(event => {
    const matchesOwnership =
      filters.ownership === 'all' ||
      (filters.ownership === 'my' && event.organizerEmail === user.email) ||
      (filters.ownership === 'joined' && getUserEventStatus(event.id, user.email) === 'going');

    const matchesCategory =
      !filters.category || event.category === filters.category;

    return matchesOwnership && matchesCategory;
  });
}

function getCategoryColor(category) {
  const categoryColors = {
    tech: '#4361ee',
    health: '#2a9d8f',
    culture: '#9b5de5',
    business: '#f4a261',
    hobby: '#e76f51'
  };

  return categoryColors[category] || '#6c757d';
}

function mapEventsToCalendar(events) {
  return events.map(event => ({
    id: String(event.id),
    title: event.title,
    start: event.date,
    url: `event.html?id=${event.id}`,
    backgroundColor: getCategoryColor(event.category),
    borderColor: getCategoryColor(event.category),
    extendedProps: {
      location: event.location,
      organizer: event.organizer,
      category: event.category
    }
  }));
}

function createCalendar(calendarEl) {
  return new FullCalendar.Calendar(calendarEl, {
    locale: 'ru',
    initialView: 'dayGridMonth',
    height: 'auto',
    firstDay: 1,
    navLinks: true,
    nowIndicator: true,

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth'
    },

    buttonText: {
      today: 'Сегодня',
      month: 'Месяц',
      week: 'Неделя',
      list: 'Список'
    },

    noEventsContent: 'Нет мероприятий',

    events: [],

    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },

    eventClick(info) {
      info.jsEvent.preventDefault();
      window.location.href = info.event.url;
    },

    eventDidMount(info) {
      const { location, organizer } = info.event.extendedProps;

      const tooltipParts = [
        info.event.title,
        location ? `Место: ${location}` : '',
        organizer ? `Организатор: ${organizer}` : ''
      ].filter(Boolean);

      info.el.title = tooltipParts.join('\n');
    }
  });
}

function getFiltersFromDom() {
  return {
    ownership: document.getElementById('ownershipFilter')?.value || 'all',
    category: document.getElementById('categoryFilter')?.value || ''
  };
}

function renderCalendarEvents(calendar, allEvents, user) {
  const filters = getFiltersFromDom();
  const filteredEvents = filterEvents(allEvents, user, filters);
  const calendarEvents = mapEventsToCalendar(filteredEvents);

  calendar.removeAllEvents();
  calendar.addEventSource(calendarEvents);
}

function setupFilters(calendar, allEvents, user) {
  const ownershipFilter = document.getElementById('ownershipFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const resetBtn = document.getElementById('resetCalendarFiltersBtn');

  ownershipFilter?.addEventListener('change', () => {
    renderCalendarEvents(calendar, allEvents, user);
  });

  categoryFilter?.addEventListener('change', () => {
    renderCalendarEvents(calendar, allEvents, user);
  });

  resetBtn?.addEventListener('click', () => {
    if (ownershipFilter) ownershipFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = '';

    renderCalendarEvents(calendar, allEvents, user);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  const user = requireUser();
  if (!user) return;

  const calendarEl = document.getElementById('calendar');
  const allEvents = getAllEvents();

  const calendar = createCalendar(calendarEl);
  calendar.render();

  renderCalendarEvents(calendar, allEvents, user);
  setupFilters(calendar, allEvents, user);
});