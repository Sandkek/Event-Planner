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
  eventRemindersEnabled: true,
  emailNotificationsEnabled: true
};

function fillProfileForm(user) {
  document.getElementById('fullName').value = user.fullName || '';
  document.getElementById('email').value = user.email || '';
}

function fillNotificationForm(user) {
  document.getElementById('toastNotificationsEnabled').checked =
    DEFAULT_SETTINGS.toastNotificationsEnabled;

  document.getElementById('eventRemindersEnabled').checked =
    DEFAULT_SETTINGS.eventRemindersEnabled;

  const emailNotificationsInput =
    document.getElementById('emailNotificationsEnabled');

  if (emailNotificationsInput) {
    emailNotificationsInput.checked =
      user.emailNotificationsEnabled ?? true;
  }
}

async function updateNotificationSettings(data) {
  const response = await fetch('/api/profile/notifications', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return await response.json();
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
  fillNotificationForm(currentUser);
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

    currentUser = {
      ...currentUser,
      ...result.user
    };

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

  notificationForm.addEventListener('submit', async event => {
    event.preventDefault();

    const emailNotificationsInput =
      document.getElementById('emailNotificationsEnabled');

    const result = await updateNotificationSettings({
      emailNotificationsEnabled:
        emailNotificationsInput
          ? emailNotificationsInput.checked
          : true
    });

    if (!result.success) {
      notifyError('Не удалось сохранить настройки уведомлений.');
      return;
    }

    currentUser.emailNotificationsEnabled =
      emailNotificationsInput
        ? emailNotificationsInput.checked
        : true;

    notifySuccess('Настройки уведомлений сохранены.');
  });
});