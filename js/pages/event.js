// js/pages/event.js

import { requireAuth } from '../core/auth.js';
import {
  escapeHtml,
  formatFullDate,
  getEventPlaceholderSvg,
  getUrlParamNumber,
  getUserInitials
} from '../core/utils.js';
import { getEventById, deleteEvent } from '../services/events.service.js';
import {
  deleteEventAttendees,
  getGoingCount,
  getUserEventStatus,
  removeAttendeeStatus,
  setAttendeeStatus
} from '../services/attendees.service.js';
import {
  deleteEventChat,
  getChatMessages,
  saveChatMessage
} from '../services/chat.service.js';
import {
  confirmAction,
  notifyError,
  notifySuccess,
  notifyWarning
} from '../services/notifications.service.js';
import { getEventPermissions } from '../services/event-permissions.js';
import {
  canCreatePoll,
  canDeletePoll,
  canVoteInPoll
} from '../services/poll-permissions.js';
import {
  createPoll,
  createPollFromFormData,
  deletePoll,
  deleteEventPolls,
  getEventPolls,
  voteInPoll
} from '../services/polls.service.js';
import {
  acceptInvite,
  buildInviteLink,
  getInviteCodeFromUrl,
  validateInvite
} from '../services/invite.service.js';
import {
  addPollOptionField,
  getPollFormData,
  renderPollsList,
  resetPollForm,
  setupPollOptionsPreview,
  togglePollDeleteButtons
} from '../ui/polls.js';
import { loadNavbar } from '../ui/navbar.js';

function renderAttendees(eventId, user) {
  const countEl = document.getElementById('attendeesCount');
  const container = document.getElementById('attendeesList');

  if (!countEl || !container) return;

  const count = getGoingCount(eventId);
  countEl.textContent = count;

  const userStatus = user ? getUserEventStatus(eventId, user.email) : null;

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

function renderEventMap(event) {
  const mapPlaceholder = document.getElementById('mapPlaceholder');
  const mapContainer = document.getElementById('eventMap');

  if (!mapPlaceholder || !mapContainer) return;

  const hasCoordinates =
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude);

  if (!hasCoordinates) {
    mapPlaceholder.innerHTML = `
      <div class="alert alert-info">
        📍 <strong>Место проведения:</strong> ${event.location}
        <br><small>Координаты для отображения карты не указаны.</small>
      </div>
    `;
    mapContainer.style.display = 'none';
    return;
  }

  mapPlaceholder.innerHTML = `
    <div class="alert alert-light border">
      📍 <strong>Место проведения:</strong> ${event.location}
    </div>
  `;

  mapContainer.style.display = '';

  const map = new maplibregl.Map({
    container: 'eventMap',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: [event.longitude, event.latitude],
    zoom: 14
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
    <strong>${event.title}</strong><br>
    ${event.location}
  `);

  new maplibregl.Marker()
    .setLngLat([event.longitude, event.latitude])
    .setPopup(popup)
    .addTo(map);

  map.on('load', () => {
    map.resize();
  });
}

function renderChat(event, eventId, user) {
  const container = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');

  if (!container || !chatInput || !sendBtn) return;

  const userStatus = user ? getUserEventStatus(eventId, user.email) : null;
  const permissions = getEventPermissions(event, user, userStatus);

  if (!permissions.canViewChat) {
    container.innerHTML = '<p class="text-center text-muted">Чат доступен только участникам мероприятия.</p>';
    chatInput.disabled = true;
    sendBtn.disabled = true;
    return;
  }

  const messages = getChatMessages(eventId);

  if (!messages.length) {
    container.innerHTML = '<p class="text-center text-muted">Пока нет сообщений. Начните обсуждение!</p>';
  } else {
    container.innerHTML = messages.map(msg => {
      const initials = getUserInitials(msg.userName);
      const isCurrentUser = msg.userEmail === user.email;
      const avatarBg = isCurrentUser ? '#3a0ca3' : '#4361ee';

      return `
        <div class="chat-message">
          <div class="chat-header">
            <div class="chat-avatar" style="background-color: ${avatarBg};">${initials}</div>
            <div>
              <div class="chat-user-name">${msg.userName}</div>
              <div class="text-muted small">${new Date(msg.timestamp).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>
          <div class="chat-text">${escapeHtml(msg.text)}</div>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  chatInput.disabled = !permissions.canSendMessage;
  sendBtn.disabled = !permissions.canSendMessage;
}

function updateRsvpButtons(event, eventId, user) {
  const userStatus = getUserEventStatus(eventId, user.email);
  const permissions = getEventPermissions(event, user, userStatus);

  document.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === userStatus);
    btn.disabled = !permissions.canRespond;
  });
}

function renderPolls(event, eventId, user) {
  const pollsContainer = document.getElementById('pollsContainer');
  if (!pollsContainer) return;

  const polls = getEventPolls(eventId);
  const canDelete = canDeletePoll(event, user);
  const canVote = canVoteInPoll(event, user, eventId);

  renderPollsList(pollsContainer, polls, user, {
    canVote,
    canDelete
  });
}

function setupPollControls(event, eventId, user) {
  const showPollFormBtn = document.getElementById('showPollFormBtn');
  const pollFormContainer = document.getElementById('pollFormContainer');
  const addPollOptionBtn = document.getElementById('addPollOptionBtn');
  const createPollBtn = document.getElementById('createPollBtn');
  const cancelPollBtn = document.getElementById('cancelPollBtn');
  const pollsContainer = document.getElementById('pollsContainer');

  if (!showPollFormBtn || !pollFormContainer || !pollsContainer) return;

  setupPollOptionsPreview();

  const canCreate = canCreatePoll(event, user);
  showPollFormBtn.style.display = canCreate ? '' : 'none';

  showPollFormBtn.addEventListener('click', () => {
    pollFormContainer.style.display = '';
  });

  cancelPollBtn?.addEventListener('click', () => {
    pollFormContainer.style.display = 'none';
    resetPollForm();
  });

  addPollOptionBtn?.addEventListener('click', () => {
    addPollOptionField();
  });

  createPollBtn?.addEventListener('click', () => {
    if (!canCreatePoll(event, user)) return;

    const formData = getPollFormData();

    if (!formData.title) {
      notifyError('Укажите название опроса.');
      return;
    }

    if (formData.options.length < 2) {
      notifyError('Добавьте минимум два варианта ответа.');
      return;
    }

    const poll = createPollFromFormData(eventId, user, formData);
    createPoll(eventId, poll);

    notifySuccess('Опрос создан.');
    pollFormContainer.style.display = 'none';
    resetPollForm();
    renderPolls(event, eventId, user);
  });

  pollsContainer.addEventListener('change', e => {
    const input = e.target.closest('.poll-option-input');
    if (!input) return;

    if (!canVoteInPoll(event, user, eventId)) {
      notifyWarning('Голосовать могут только участники мероприятия (статус "Пойду").');
      renderPolls(event, eventId, user); // 👈 ВАЖНО
      return;
    }

    const pollId = Number(input.dataset.pollId);
    const optionId = Number(input.value);

    voteInPoll(eventId, pollId, user.email, optionId);
    renderPolls(event, eventId, user);
  });

  pollsContainer.addEventListener('click', async e => {
    const deleteBtn = e.target.closest('.poll-delete-btn');
    if (!deleteBtn) return;

    if (!canDeletePoll(event, user)) return;

    const pollId = Number(deleteBtn.dataset.pollId);
    const confirmed = await confirmAction('Удалить этот опрос?', {
      title: 'Удаление опроса',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      confirmButtonClass: 'btn-danger'
    });

    if (!confirmed) return;

    deletePoll(eventId, pollId);
    notifySuccess('Опрос удалён.');
    renderPolls(event, eventId, user);
  });
}

function renderInviteSection(event, eventId, user) {
  const inviteSection = document.getElementById('inviteSection');
  const inviteNotice = document.getElementById('inviteNotice');

  if (!inviteSection || !inviteNotice) return;

  inviteSection.innerHTML = '';
  inviteNotice.innerHTML = '';

  const inviteCodeFromUrl = getInviteCodeFromUrl();
  const isInviteValid = validateInvite(event, inviteCodeFromUrl);
  const isOwner = event.organizerEmail === user.email;

  if (isOwner) {
    inviteSection.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-2">Приглашение участников</h5>
          <p class="text-muted mb-3">Скопируйте ссылку и отправьте её участникам.</p>
          <div class="input-group">
            <input
              type="text"
              class="form-control"
              id="inviteLinkInput"
              readonly
              value="${buildInviteLink(event)}"
            >
            <button class="btn btn-outline-primary" type="button" id="copyInviteLinkBtn">
              Копировать
            </button>
          </div>
        </div>
      </div>
    `;

    const copyBtn = document.getElementById('copyInviteLinkBtn');
    copyBtn?.addEventListener('click', async () => {
      const input = document.getElementById('inviteLinkInput');
      const value = input?.value || '';

      try {
        await navigator.clipboard.writeText(value);
        notifySuccess('Ссылка приглашения скопирована.');
      } catch {
        if (input) {
          input.select();
          document.execCommand('copy');
          notifySuccess('Ссылка приглашения скопирована.');
        }
      }
    });
  }

  if (!isOwner && inviteCodeFromUrl) {
    if (isInviteValid) {
      const currentStatus = getUserEventStatus(eventId, user.email);

      if (currentStatus !== 'going') {
        inviteNotice.innerHTML = `
          <div class="alert alert-info d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              Вы перешли по ссылке-приглашению. Нажмите кнопку, чтобы принять приглашение.
            </div>
            <button class="btn btn-primary btn-sm" id="acceptInviteBtn" type="button">
              Принять приглашение
            </button>
          </div>
        `;

        document.getElementById('acceptInviteBtn')?.addEventListener('click', () => {
          acceptInvite(eventId, user.email);
          notifySuccess('Приглашение принято. Вы записаны на мероприятие.');

          renderAttendees(eventId, user);
          renderChat(event, eventId, user);
          updateRsvpButtons(event, eventId, user);
          renderPolls(event, eventId, user);
          renderInviteSection(event, eventId, user);
        });
      } else {
        inviteNotice.innerHTML = `
          <div class="alert alert-success">
            Вы уже приняли приглашение и записаны на мероприятие.
          </div>
        `;
      }
    } else {
      inviteNotice.innerHTML = `
        <div class="alert alert-danger">
          Ссылка приглашения недействительна.
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  const user = requireAuth();
  if (!user) return;

  const eventId = getUrlParamNumber('id');
  if (!eventId) {
    document.getElementById('eventContent').innerHTML =
      '<p class="text-center">Неверный ID мероприятия.</p>';
    return;
  }

  const event = getEventById(eventId);
  if (!event) {
    document.getElementById('eventContent').innerHTML =
      '<p class="text-center">Мероприятие не найдено.</p>';
    return;
  }

  document.getElementById('pageTitle').textContent = `${event.title} — EventPlanner`;
  document.getElementById('eventTitle').textContent = event.title;
  document.getElementById('eventDate').textContent = formatFullDate(event.date);
  document.getElementById('eventLocation').textContent = event.location;
  document.getElementById('eventDescription').textContent = event.description;
  document.getElementById('eventOrganizer').textContent = event.organizer;

  const imageUrl =
    event.image || getEventPlaceholderSvg(700, 300, '🖼️ Фото мероприятия');

  document.querySelector('.event-image-container').innerHTML = `
    <img src="${imageUrl}" alt="${event.title}" class="w-100 h-100" style="object-fit: cover;">
  `;

  renderEventMap(event);

  renderAttendees(eventId, user);
  renderChat(event, eventId, user);
  updateRsvpButtons(event, eventId, user);
  renderPolls(event, eventId, user);
  setupPollControls(event, eventId, user);
  renderInviteSection(event, eventId, user);

  document.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const userStatus = getUserEventStatus(eventId, user.email);
      const permissions = getEventPermissions(event, user, userStatus);

      if (!permissions.canRespond) return;

      const newStatus = this.dataset.status;
      const currentStatus = getUserEventStatus(eventId, user.email);

      if (currentStatus === newStatus) {
        removeAttendeeStatus(eventId, user.email);
      } else {
        setAttendeeStatus(eventId, user.email, newStatus);
      }

      renderAttendees(eventId, user);
      renderChat(event, eventId, user);
      updateRsvpButtons(event, eventId, user);
      renderPolls(event, eventId, user); // <- добавить
    });
  });

  const actionsContainer = document.getElementById('eventActions');
  const currentStatus = getUserEventStatus(eventId, user.email);
  const permissions = getEventPermissions(event, user, currentStatus);

  if (actionsContainer && permissions.canManage) {
    actionsContainer.innerHTML = `
      <div class="d-flex gap-2 mt-4">
        <a href="edit-event.html?id=${event.id}" class="btn btn-outline-primary">Редактировать</a>
        <button class="btn btn-outline-danger" id="deleteEventBtn">Удалить</button>
      </div>
    `;

    document.getElementById('deleteEventBtn').addEventListener('click', async () => {
      const freshStatus = getUserEventStatus(eventId, user.email);
      const freshPermissions = getEventPermissions(event, user, freshStatus);

      if (!freshPermissions.canDelete) return;

      const confirmed = await confirmAction(
        'Вы уверены, что хотите удалить это мероприятие? Все записи участников, сообщения чата и опросы будут удалены.',
        {
          title: 'Удаление мероприятия',
          confirmText: 'Удалить',
          cancelText: 'Отмена',
          confirmButtonClass: 'btn-danger'
        }
      );

      if (!confirmed) return;

      deleteEvent(event.id);
      deleteEventAttendees(event.id);
      deleteEventChat(event.id);
      deleteEventPolls(event.id);

      notifySuccess('Мероприятие успешно удалено.');
      window.location.href = 'profile.html';
    });
  }

  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const freshStatus = getUserEventStatus(eventId, user.email);
      const freshPermissions = getEventPermissions(event, user, freshStatus);

      if (!freshPermissions.canSendMessage) return;

      const text = chatInput.value.trim();
      if (!text) return;

      saveChatMessage(eventId, {
        text,
        userName: user.fullName,
        userEmail: user.email,
        timestamp: Date.now()
      });

      chatInput.value = '';
      renderChat(event, eventId, user);
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        sendBtn?.click();
      }
    });
  }
});