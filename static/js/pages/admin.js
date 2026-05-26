let currentAdmin = null;

async function loadCurrentUser() {
  const response = await fetch('/api/current-user');
  const data = await response.json();

  currentAdmin = data.user;
}

async function loadStats() {
  const response = await fetch('/api/admin/stats');
  const stats = await response.json();

  const container = document.getElementById('statsContainer');

  container.innerHTML = `
    <div class="col-md-2">
      <div class="card">
        <div class="card-body">
          <h6>Пользователи</h6>
          <div class="fs-3 fw-bold">${stats.usersCount}</div>
        </div>
      </div>
    </div>

    <div class="col-md-2">
      <div class="card">
        <div class="card-body">
          <h6>Мероприятия</h6>
          <div class="fs-3 fw-bold">${stats.eventsCount}</div>
        </div>
      </div>
    </div>

    <div class="col-md-2">
      <div class="card">
        <div class="card-body">
          <h6>Заблокировано</h6>
          <div class="fs-3 fw-bold">${stats.blockedEventsCount}</div>
        </div>
      </div>
    </div>

    <div class="col-md-2">
      <div class="card">
        <div class="card-body">
          <h6>Участия</h6>
          <div class="fs-3 fw-bold">${stats.attendeesCount}</div>
        </div>
      </div>
    </div>

    <div class="col-md-2">
      <div class="card">
        <div class="card-body">
          <h6>Сообщения</h6>
          <div class="fs-3 fw-bold">${stats.messagesCount}</div>
        </div>
      </div>
    </div>
  `;
}

async function loadUsers() {
  const response = await fetch('/api/admin/users');
  const users = await response.json();

  const tbody = document.getElementById('usersTableBody');

  tbody.innerHTML = users.map(user => {

    const isCurrentAdmin =
        currentAdmin &&
        user.id === currentAdmin.id;

    return `
        <tr>
        <td>${user.id}</td>

        <td>${user.fullName}</td>

        <td>${user.email}</td>

        <td>
            <span class="badge ${
            user.isAdmin
                ? 'bg-primary'
                : 'bg-secondary'
            }">
            ${
                user.isAdmin
                ? 'Администратор'
                : 'Пользователь'
            }
            </span>
        </td>

        <td>

            ${
            isCurrentAdmin
                ? `
                <span class="text-muted">
                    Это вы
                </span>
                `
                : `
                <button
                    class="btn btn-outline-primary btn-sm toggle-admin-btn"
                    data-id="${user.id}"
                    data-admin="${user.isAdmin}"
                >
                    ${
                    user.isAdmin
                        ? 'Снять админа'
                        : 'Сделать админом'
                    }
                </button>

                <button
                    class="btn btn-outline-danger btn-sm delete-user-btn"
                    data-id="${user.id}"
                >
                    Удалить
                </button>
                `
            }

        </td>
        </tr>
      `;
  }).join('');

  document.querySelectorAll('.toggle-admin-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const userId = button.dataset.id;
      const currentIsAdmin = button.dataset.admin === 'true';

      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isAdmin: !currentIsAdmin
        })
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || 'Не удалось изменить роль.');
        return;
      }

      await loadUsers();
    });
  });

  document.querySelectorAll('.delete-user-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const userId = button.dataset.id;

      if (!confirm('Удалить пользователя и все его мероприятия?')) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || 'Не удалось удалить пользователя.');
        return;
      }

      await loadStats();
      await loadUsers();
      await loadEvents();
    });
  });
}

async function loadEvents() {
  const response = await fetch('/api/admin/events');
  const events = await response.json();

  const tbody = document.getElementById('eventsTableBody');

  tbody.innerHTML = events.map(event => `
    <tr class="${event.isBlocked ? 'table-warning' : ''}">
      <td>${event.id}</td>
      <td>
        <a href="/event/${event.id}">
          ${event.title}
        </a>
      </td>
      <td>${event.date}</td>
      <td>
        ${event.organizer}<br>
        <small class="text-muted">${event.organizerEmail}</small>
      </td>
      <td>${event.attendeesCount}</td>
      <td>
        <span class="badge ${event.isBlocked ? 'bg-warning text-dark' : 'bg-success'}">
          ${event.isBlocked ? 'Заблокировано' : 'Активно'}
        </span>
      </td>
      <td>
        <button
          class="btn btn-outline-warning btn-sm toggle-block-btn"
          data-id="${event.id}"
          data-blocked="${event.isBlocked}"
        >
          ${event.isBlocked ? 'Разблокировать' : 'Заблокировать'}
        </button>

        <button
          class="btn btn-outline-danger btn-sm delete-event-btn"
          data-id="${event.id}"
        >
          Удалить
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.toggle-block-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const eventId = button.dataset.id;
      const currentBlocked = button.dataset.blocked === 'true';

      const response = await fetch(`/api/admin/events/${eventId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isBlocked: !currentBlocked
        })
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || 'Не удалось изменить статус мероприятия.');
        return;
      }

      await loadStats();
      await loadEvents();
    });
  });

  document.querySelectorAll('.delete-event-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const eventId = button.dataset.id;

      if (!confirm('Удалить мероприятие?')) return;

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadStats();
        await loadEvents();
      } else {
        alert(result.message || 'Не удалось удалить мероприятие.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUser();

  await loadStats();
  await loadEvents();
  await loadUsers();
});