// static/js/pages/settings.js

import { requireAuth } from '../core/auth.js';
import { notifyError, notifySuccess } from '../services/notifications.service.js';
import { loadNavbar } from '../ui/navbar.js';
import {
  updateProfile,
  updatePassword
} from '../services/profile.service.js';

const DEFAULT_SETTINGS = {
  toastNotificationsEnabled: true,
  eventRemindersEnabled: true
};

function fillProfileForm(user) {
  document.getElementById('fullName').value = user.fullName || '';
  document.getElementById('email').value = user.email || '';
}

function fillNotificationForm(settings) {
  document.getElementById('toastNotificationsEnabled').checked =
    settings.toastNotificationsEnabled;

  document.getElementById('eventRemindersEnabled').checked =
    settings.eventRemindersEnabled;
}

function setupPasswordValidation() {
  const newPassword = document.getElementById('newPassword');
  const confirmNewPassword = document.getElementById('confirmNewPassword');

  function validate() {
    if (newPassword.value !== confirmNewPassword.value) {
      confirmNewPassword.setCustomValidity('Пароли не совпадают.');
    } else {
      confirmNewPassword.setCustomValidity('');
    }
  }

  newPassword.addEventListener('input', validate);
  confirmNewPassword.addEventListener('input', validate);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();

  let currentUser = await requireAuth();
  if (!currentUser) return;

  fillProfileForm(currentUser);
  fillNotificationForm(DEFAULT_SETTINGS);
  setupPasswordValidation();

  const profileForm = document.getElementById('profileSettingsForm');
  const passwordForm = document.getElementById('passwordSettingsForm');
  const notificationForm = document.getElementById('notificationSettingsForm');
  const emailExistsError = document.getElementById('emailExistsError');

  profileForm.addEventListener('submit', async event => {
    event.preventDefault();

    emailExistsError?.classList.add('d-none');
    document.getElementById('email').classList.remove('is-invalid');

    if (!profileForm.checkValidity()) {
      profileForm.classList.add('was-validated');
      return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();

    const result = await updateProfile({
      fullName,
      email
    });

    if (!result.success) {
      document.getElementById('email').classList.add('is-invalid');

      if (emailExistsError) {
        emailExistsError.textContent =
          result.message || 'Не удалось обновить профиль.';
        emailExistsError.classList.remove('d-none');
      }

      notifyError(result.message || 'Не удалось обновить профиль.');
      return;
    }

    currentUser = result.user;
    notifySuccess('Профиль успешно обновлён.');
  });

  passwordForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!passwordForm.checkValidity()) {
      passwordForm.classList.add('was-validated');
      return;
    }

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    const result = await updatePassword({
      currentPassword,
      newPassword
    });

    if (!result.success) {
      notifyError(result.message || 'Не удалось обновить пароль.');
      return;
    }

    passwordForm.reset();
    passwordForm.classList.remove('was-validated');
    notifySuccess('Пароль успешно обновлён.');
  });

  notificationForm.addEventListener('submit', event => {
    event.preventDefault();

    // Пока настройки уведомлений оставляем локально на странице.
    // Основные данные профиля и пароль уже работают через сервер.
    notifySuccess('Настройки уведомлений сохранены.');
  });
});