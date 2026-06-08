import { getCurrentUser, logout } from '../core/auth.js';
import { getUserInitials } from '../core/utils.js';
import {
  getNotifications,
  markNotificationRead
} from '../services/user-notifications.service.js';

export async function loadNavbar() {
  try {
    const response = await fetch('/static/components/navbar.html');
    const html = await response.text();

    document.body.insertAdjacentHTML('afterbegin', html);
    await updateNavbarUI();
  } catch (error) {
    console.error('Не удалось загрузить navbar:', error);

    document.body.insertAdjacentHTML('afterbegin', `
      <nav class="navbar navbar-expand-lg app-navbar sticky-top">
        <div class="container">
          <a class="navbar-brand" href="/">Соберёмся</a>
          <div class="d-flex align-items-center" id="authNav"></div>
        </div>
      </nav>
    `);

    await updateNavbarUI();
  }
}

export async function updateNavbarUI() {
  const authNav = document.getElementById('authNav');
  if (!authNav) return;

  const user = await getCurrentUser();

  if (user) {
    const initials = getUserInitials(user.fullName);

    const notifications = await getNotifications();
    const unreadCount = notifications.filter(item => !item.isRead).length;

    authNav.innerHTML = `
      <div class="dropdown me-3">
        <a
          href="#"
          class="notification-bell position-relative"
          data-bs-toggle="dropdown"
        >
          <i class="bi bi-bell-fill"></i>

          ${
            unreadCount > 0
              ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${unreadCount}</span>`
              : ''
          }
        </a>

        <ul class="dropdown-menu dropdown-menu-end" style="min-width: 320px; max-height: 400px; overflow-y: auto;">
          ${
            notifications.length === 0
              ? `<li><span class="dropdown-item text-muted">Уведомлений нет</span></li>`
              : notifications.map(item => `
                  <li>
                    <a
                      href="${item.eventId ? `/event/${item.eventId}` : '#'}"
                      class="dropdown-item notification-item ${item.isRead ? '' : 'fw-bold'}"
                      data-id="${item.id}"
                    >
                      <div>${item.title}</div>
                      <small class="text-muted">${item.message}</small>
                    </a>
                  </li>
                `).join('')
          }
        </ul>
      </div>

      <div class="dropdown">
        <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
          <div class="user-avatar me-2">
            <span>${initials}</span>
          </div>
          <span class="user-info">${user.fullName}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="/profile">Профиль</a></li>
          <li><a class="dropdown-item" href="/calendar">Календарь</a></li>
          <li><a class="dropdown-item" href="/settings">Настройки</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Выйти</a></li>
        </ul>
      </div>
    `;

    document.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.id;
        if (id) {
          await markNotificationRead(id);
        }
      });
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', async event => {
      event.preventDefault();
      await logout();
      window.location.href = '/';
    });
  } else {
    authNav.innerHTML = `<a href="/login" class="btn btn-outline-primary btn-sm">Войти</a>`;
  }
}