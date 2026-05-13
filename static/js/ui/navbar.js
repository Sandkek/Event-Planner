import { getCurrentUser, logout } from '../core/auth.js';
import { getUserInitials } from '../core/utils.js';

export async function loadNavbar() {
  try {
    const response = await fetch('/static/components/navbar.html');
    const html = await response.text();

    document.body.insertAdjacentHTML('afterbegin', html);
    await updateNavbarUI();
  } catch (error) {
    console.error('Не удалось загрузить navbar:', error);

    document.body.insertAdjacentHTML('afterbegin', `
      <nav class="navbar navbar-expand-lg app-navbar">
        <div class="container">
          <a class="navbar-brand" href="/">EventPlanner</a>
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

    authNav.innerHTML = `
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

    document.getElementById('logoutBtn')?.addEventListener('click', async event => {
      event.preventDefault();
      await logout();
      window.location.href = '/';
    });
  } else {
    authNav.innerHTML = `<a href="/login" class="btn btn-outline-primary btn-sm">Войти</a>`;
  }
}