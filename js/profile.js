// profile.js

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('ru', { month: 'short' });
  const time = date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month} · ${time}`;
}

const demoEvents = [
  { id: 1, title: "Вечер JavaScript в Москвы", description: "Обсуждаем новые фичи ECMAScript...", date: "2026-01-15T19:00:00", location: "Loft №7, Центр города", category: "tech", organizer: "JS Community" },
  { id: 2, title: "Йога на свежем воздухе", description: "Утренняя йога в парке Горького...", date: "2026-01-12T08:00:00", location: "Парк Горького, у фонтана", category: "health", organizer: "Yoga Life" },
  { id: 3, title: "Книжный клуб: '1984'", description: "Обсуждение классики антиутопии...", date: "2026-01-20T18:30:00", location: "Кофейня 'Читай-Город'", category: "culture", organizer: "BookLovers" },
  { id: 4, title: "Хакатон по AI", description: "48 часов кодинга, менторство...", date: "2026-01-25T10:00:00", location: "Технопарк 'Сколково'", category: "tech", organizer: "AI Hackers" }
];

function getAllEvents() {
  const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
  return [...demoEvents, ...userEvents];
}

function getUserRSVP(eventId) {
  const user = getCurrentUser();
  if (!user) return null;
  const allAttendees = JSON.parse(localStorage.getItem('eventAttendees') || '{}');
  return allAttendees[eventId]?.[user.email] || null;
}

function renderEventCard(event) {
  let description = event.description || '';
  if (description.length > 120) {
    description = description.substring(0, 120) + '...';
  }

  const imageUrl = event.image || 'image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="100%" height="100%" fill="%23e9ecef"/><text x="50%" y="50%" fill="%23aaa" font-size="18" text-anchor="middle" dy=".3em">🖼️</text></svg>';
  
  return `
    <div class="event-card">
      <a href="event.html?id=${event.id}" class="text-decoration-none text-dark">
        <div class="event-image-container" style="height: 180px; overflow: hidden;">
          <img src="${imageUrl}" alt="${event.title}" class="event-image w-100 h-100" style="object-fit: cover;">
        </div>
        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-meta">${formatDate(event.date)} · ${event.location}</p>
          <p class="event-description">${description}</p>
        </div>
      </a>
    </div>
  `;
}

function renderEvents(containerId, events) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<p class="no-events">Нет мероприятий</p>';
    return;
  }
  container.innerHTML = events.map(renderEventCard).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  // Обновляем навбар
  if (typeof updateNavbarUI === 'function') {
    updateNavbarUI();
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('profileName').textContent = user.fullName;

  const allEvents = getAllEvents();

  const myEvents = allEvents.filter(event => event.organizerEmail === user.email);
  renderEvents('myEventsContainer', myEvents);

  const joinedEvents = allEvents.filter(event => {
    const status = getUserRSVP(event.id);
    return status === 'going';
  });
  renderEvents('joinedEventsContainer', joinedEvents);
});