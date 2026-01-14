// main.js

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function getEventAttendees(eventId) {
  const allAttendees = JSON.parse(localStorage.getItem('eventAttendees') || '{}');
  return allAttendees[eventId] || {};
}

function saveEventAttendee(eventId, email, status) {
  const allAttendees = JSON.parse(localStorage.getItem('eventAttendees') || '{}');
  if (!allAttendees[eventId]) allAttendees[eventId] = {};
  allAttendees[eventId][email] = status;
  localStorage.setItem('eventAttendees', JSON.stringify(allAttendees));
}

function removeEventAttendee(eventId, email) {
  const allAttendees = JSON.parse(localStorage.getItem('eventAttendees') || '{}');
  if (allAttendees[eventId]) {
    delete allAttendees[eventId][email];
    if (Object.keys(allAttendees[eventId]).length === 0) {
      delete allAttendees[eventId];
    }
  }
  localStorage.setItem('eventAttendees', JSON.stringify(allAttendees));
}

function getGoingCount(eventId) {
  const attendees = getEventAttendees(eventId);
  return Object.values(attendees).filter(status => status === 'going').length;
}

function getUserRSVP(eventId) {
  const user = getCurrentUser();
  if (!user) return null;
  const attendees = getEventAttendees(eventId);
  return attendees[user.email] || null;
}

function getAllEvents() {
  const demoEvents = [
    // {
    //   id: 1,
    //   title: "Вечер JavaScript в Москве",
    //   description: "Обсуждаем новые фичи ECMAScript, делимся опытом и нетворкинг.",
    //   date: "2026-01-15T19:00:00",
    //   location: "Loft №7, Центр города",
    //   category: "tech",
    //   organizer: "JS Community"
    // },
    // {
    //   id: 2,
    //   title: "Йога на свежем воздухе",
    //   description: "Утренняя йога в парке Горького. Все уровни приветствуются!",
    //   date: "2026-01-12T08:00:00",
    //   location: "Парк Горького, у фонтана",
    //   category: "health",
    //   organizer: "Yoga Life"
    // },
    // {
    //   id: 3,
    //   title: "Книжный клуб: '1984' Дж. Оруэлл",
    //   description: "Обсуждение классики антиутопии. Принесите свою копию книги!",
    //   date: "2026-01-20T18:30:00",
    //   location: "Кофейня 'Читай-Город'",
    //   category: "culture",
    //   organizer: "BookLovers"
    // },
    // {
    //   id: 4,
    //   title: "Хакатон по AI",
    //   description: "48 часов кодинга, менторство от экспертов и призы!",
    //   date: "2026-01-25T10:00:00",
    //   location: "Технопарк 'Сколково'",
    //   category: "tech",
    //   organizer: "AI Hackers"
    // }
  ];

  const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
  return [...demoEvents, ...userEvents];
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('ru', { month: 'short' });
  const time = date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month} · ${time}`;
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
      <div class="px-3 pb-3">
        <button class="btn-rsvp" data-id="${event.id}">
          ${getCurrentUser() && getUserRSVP(event.id) === 'going' ? '✅ Записан(а)' : 'Пойду'} (${getGoingCount(event.id)})
        </button>
      </div>
    </div>
  `;
}

function renderEvents(events) {
  const container = document.getElementById('eventsContainer');
  if (events.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">Мероприятия не найдены.</p>';
    return;
  }

  container.innerHTML = events.map(renderEventCard).join('');
}

function filterEvents() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const dateFilter = document.getElementById('dateFilter').value;

  let filtered = getAllEvents().filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query);

    const matchesCategory = category === '' || event.category === category;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      matchesDate = new Date(event.date).toDateString() === today;
    } else if (dateFilter === 'week') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(event.date) >= now && new Date(event.date) <= weekFromNow;
    } else if (dateFilter === 'month') {
      const now = new Date();
      const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      matchesDate = new Date(event.date) >= now && new Date(event.date) <= monthFromNow;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  renderEvents(filtered);
}

function setupRsvpHandler() {
  document.getElementById('eventsContainer').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-rsvp')) {
      const user = getCurrentUser();
      if (!user) {
        alert('Пожалуйста, войдите или зарегистрируйтесь, чтобы записаться.');
        window.location.href = 'login.html';
        return;
      }

      const eventId = e.target.dataset.id;
      const currentStatus = getUserRSVP(eventId);

      if (currentStatus === 'going') {
        removeEventAttendee(eventId, user.email);
        alert('Вы отменили участие.');
      } else {
        saveEventAttendee(eventId, user.email, 'going');
        alert('Вы записались на мероприятие!');
      }

      filterEvents();
    }
  });
}

function updateCreateButton() {
  const container = document.getElementById('createEventContainer');
  if (!container) return;

  const user = getCurrentUser();
  
  if (user) {
    container.innerHTML = `
      <a href="create-event.html" class="btn btn-light" id="createEventBtn">
        + Создать мероприятие
      </a>
    `;
  } else {
    container.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Обновляем навбар (если он уже загружен)
  if (typeof updateNavbarUI === 'function') {
    updateNavbarUI();
  }

  updateCreateButton();

  document.getElementById('searchInput').addEventListener('input', filterEvents);
  document.getElementById('categoryFilter').addEventListener('change', filterEvents);
  document.getElementById('dateFilter').addEventListener('change', filterEvents);

  renderEvents(getAllEvents());
  setupRsvpHandler();
});