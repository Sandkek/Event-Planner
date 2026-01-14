// event.js

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

function getEventById(eventId) {
  const demoEvents = {
    1: {
      id: 1,
      title: "Вечер JavaScript в Москве",
      description: "Присоединяйтесь к нам, чтобы обсудить последние тенденции в JavaScript, поделиться опытом и найти единомышленников. Будут спикеры из крупных IT-компаний!",
      date: "2026-01-15T19:00:00",
      location: "Loft №7, ул. Тверская, 7, Москва",
      category: "tech",
      organizer: "JS Community"
    },
    2: {
      id: 2,
      title: "Йога на свежем воздухе",
      description: "Начните свой день с гармонии! Утренняя йога в живописном парке Горького. Подходит для всех уровней — от новичков до продвинутых.",
      date: "2026-01-12T08:00:00",
      location: "Парк Горького, площадка у фонтана",
      category: "health",
      organizer: "Yoga Life"
    }
  };

  const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
  const userEventMap = {};
  userEvents.forEach(event => {
    userEventMap[event.id] = event;
  });

  const allEvents = { ...demoEvents, ...userEventMap };
  return allEvents[eventId] || null;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('ru-RU', options);
}

function renderAttendees(eventId) {
  const container = document.getElementById('attendeesList');
  const countEl = document.getElementById('attendeesCount');
  if (!countEl || !container) return;

  const count = getGoingCount(eventId);
  countEl.textContent = count;

  const user = getCurrentUser();
  const userStatus = user ? getUserRSVP(eventId) : null;

  if (count === 0) {
    container.innerHTML = '<p>Пока никто не записался.</p>';
    return;
  }

  let html = `<p>Всего записано: ${count} человек`;
  if (userStatus === 'going') {
    html += ' (включая вас)';
  }
  html += '.</p>';

  container.innerHTML = html;
}

function getEventIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = parseInt(urlParams.get('id'));
  return isNaN(id) ? null : id;
}

// === ЧАТ ===
function getChatMessages(eventId) {
  const chats = JSON.parse(localStorage.getItem('eventChats') || '{}');
  return chats[eventId] || [];
}

function saveChatMessage(eventId, messageData) {
  const chats = JSON.parse(localStorage.getItem('eventChats') || '{}');
  if (!chats[eventId]) chats[eventId] = [];
  chats[eventId].push(messageData);
  localStorage.setItem('eventChats', JSON.stringify(chats));
}

function getUserInitials(fullName) {
  if (!fullName) return '?';
  return fullName.split(' ')
    .map(part => part[0]?.toUpperCase())
    .join('')
    .substring(0, 2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderChat(eventId) {
  const messages = getChatMessages(eventId);
  const container = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  
  if (!container) return;

  const user = getCurrentUser();
  const isParticipant = user && getUserRSVP(eventId) === 'going';
  
  if (!isParticipant) {
    container.innerHTML = '<p class="text-center text-muted">Чат доступен только участникам мероприятия.</p>';
    if (chatInput) chatInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    return;
  }

  if (messages.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">Пока нет сообщений. Начните обсуждение!</p>';
  } else {
    container.innerHTML = messages.map(msg => {
      const initials = getUserInitials(msg.userName);
      const isCurrentUser = user && msg.userEmail === user.email;
      const avatarBg = isCurrentUser ? '#3a0ca3' : '#4361ee';
      
      return `
        <div class="chat-message">
          <div class="chat-header">
            <div class="chat-avatar" style="background-color: ${avatarBg};">${initials}</div>
            <div>
              <div class="chat-user-name">${msg.userName}</div>
              <div class="text-muted small">${new Date(msg.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</div>
            </div>
          </div>
          <div class="chat-text">${escapeHtml(msg.text)}</div>
        </div>
      `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
  }

  if (chatInput) chatInput.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
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

  const eventId = getEventIdFromUrl();
  if (!eventId) {
    document.getElementById('eventContent').innerHTML = '<p class="text-center">Неверный ID мероприятия.</p>';
    return;
  }

  const event = getEventById(eventId);
  if (!event) {
    document.getElementById('eventContent').innerHTML = '<p class="text-center">Мероприятие не найдено.</p>';
    return;
  }

  document.getElementById('eventTitle').textContent = event.title;
  document.getElementById('eventDate').textContent = formatDate(event.date);
  document.getElementById('eventLocation').textContent = event.location;
  document.getElementById('eventDescription').textContent = event.description;
  document.getElementById('eventOrganizer').textContent = event.organizer;

  const imageUrl = event.image || 'image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="300" viewBox="0 0 700 300"><rect width="100%" height="100%" fill="%23e9ecef"/><text x="50%" y="50%" fill="%23aaa" font-size="24" text-anchor="middle" dy=".3em">🖼️ Фото мероприятия</text></svg>';
  document.querySelector('.event-image-container').innerHTML = `
    <img src="${imageUrl}" alt="${event.title}" class="w-100 h-100" style="object-fit: cover;">
  `;

  document.getElementById('mapPlaceholder').innerHTML = `
    <div class="alert alert-info">
      📍 <strong>Место проведения:</strong> ${event.location}
      <br><small>(Карта будет здесь в полной версии)</small>
    </div>
  `;

  renderAttendees(eventId.toString());

  document.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const user = getCurrentUser();
      if (!user) return;

      const newStatus = this.dataset.status;
      const currentStatus = getUserRSVP(eventId.toString());

      if (currentStatus === newStatus) {
        removeEventAttendee(eventId, user.email);
        alert(`Вы отменили статус.`);
      } else {
        saveEventAttendee(eventId, user.email, newStatus);
        const labels = { going: 'Пойду', interested: 'Может быть', 'not-going': 'Не пойду' };
        alert(`Ваш статус: ${labels[newStatus]}`);
      }

      renderAttendees(eventId.toString());
      renderChat(eventId.toString()); // Обновляем чат при изменении статуса
    });
  });

  const isOrganizer = event.organizerEmail === user.email;
  const actionsContainer = document.getElementById('eventActions');

  if (actionsContainer && isOrganizer) {
    actionsContainer.innerHTML = `
      <div class="d-flex gap-2 mt-4">
        <a href="edit-event.html?id=${event.id}" class="btn btn-outline-primary">Редактировать</a>
        <button class="btn btn-outline-danger" id="deleteEventBtn">Удалить</button>
      </div>
    `;

    document.getElementById('deleteEventBtn').addEventListener('click', function() {
      if (confirm('Вы уверены, что хотите удалить это мероприятие? Все записи участников будут удалены.')) {
        let userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
        userEvents = userEvents.filter(e => e.id != event.id);
        localStorage.setItem('userEvents', JSON.stringify(userEvents));

        const allAttendees = JSON.parse(localStorage.getItem('eventAttendees') || '{}');
        delete allAttendees[event.id];
        localStorage.setItem('eventAttendees', JSON.stringify(allAttendees));

        // Удаляем чат
        const chats = JSON.parse(localStorage.getItem('eventChats') || '{}');
        delete chats[event.id];
        localStorage.setItem('eventChats', JSON.stringify(chats));

        alert('Мероприятие успешно удалено.');
        window.location.href = 'profile.html';
      }
    });
  }

  // === ИНИЦИАЛИЗАЦИЯ ЧАТА ===
  const eventIdStr = eventId.toString();
  renderChat(eventIdStr);

  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');

  if (sendBtn) {
    sendBtn.addEventListener('click', function() {
      const user = getCurrentUser();
      if (!user) return;

      const text = chatInput.value.trim();
      if (!text) return;

      const messageData = {
        text: text,
        userName: user.fullName,
        userEmail: user.email,
        timestamp: Date.now()
      };

      saveChatMessage(eventIdStr, messageData);
      chatInput.value = '';
      renderChat(eventIdStr);
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  }
});