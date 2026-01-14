// navbar.js

function getUserInitials(fullName) {
  if (!fullName) return '?';
  return fullName.split(' ')
    .map(part => part[0]?.toUpperCase())
    .join('')
    .substring(0, 2);
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

// Загрузка шаблона навбара
async function loadNavbar() {
  try {
    const response = await fetch('components/navbar.html');
    const html = await response.text();
    document.body.insertAdjacentHTML('afterbegin', html);
    updateNavbarUI();
  } catch (error) {
    console.error('Не удалось загрузить навбар:', error);
    // Резервный вариант (на случай CORS или локального запуска)
    document.body.insertAdjacentHTML('afterbegin', `
      <nav class="navbar navbar-expand-lg app-navbar">
        <div class="container">
          <a class="navbar-brand" href="index.html">EventPlanner</a>
          <div class="d-flex align-items-center" id="authNav"></div>
        </div>
      </nav>
    `);
    updateNavbarUI();
  }
}

// Обновление содержимого навбара
function updateNavbarUI() {
  const authNav = document.getElementById('authNav');
  if (!authNav) return;

  const user = getCurrentUser();
  
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
          <li><a class="dropdown-item" href="profile.html">Профиль</a></li>
          <li><a class="dropdown-item" href="settings.html">Настройки</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Выйти</a></li>
        </ul>
      </div>
    `;

    // Назначаем обработчик выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        location.reload();
      });
    }
  } else {
    // На главной — кнопка "Войти", на других — редирект
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (isIndexPage) {
      authNav.innerHTML = `
        <a href="login.html" class="btn btn-outline-primary btn-sm">Войти</a>
      `;
    } else {
      // Для защищённых страниц — редирект уже обрабатывается в основном JS
      authNav.innerHTML = '';
    }
  }
}

// Экспортируем функции
window.loadNavbar = loadNavbar;
window.updateNavbarUI = updateNavbarUI;