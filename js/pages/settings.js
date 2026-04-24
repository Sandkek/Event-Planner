// js/pages/settings.js

import { requireUser } from '../core/guards.js';
import { getItem, setItem } from '../core/storage.js';
import { notifyError, notifySuccess } from '../services/notifications.service.js';
import { loadNavbar } from '../ui/navbar.js';

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const SETTINGS_KEY = 'userSettings';

const DEFAULT_SETTINGS = {
  toastNotificationsEnabled: true,
  eventRemindersEnabled: true
};

function getUsers() {
  return getItem(USERS_KEY, []);
}

function saveUsers(users) {
  setItem(USERS_KEY, users);
}

function getCurrentUser() {
  return getItem(CURRENT_USER_KEY, null);
}

function saveCurrentUser(user) {
  setItem(CURRENT_USER_KEY, user);
}

function getAllUserSettings() {
  return getItem(SETTINGS_KEY, {});
}

function saveAllUserSettings(settings) {
  setItem(SETTINGS_KEY, settings);
}

function getUserSettings(email) {
  const allSettings = getAllUserSettings();
  return {
    ...DEFAULT_SETTINGS,
    ...(allSettings[email] || {})
  };
}

function saveUserSettings(email, settings) {
  const allSettings = getAllUserSettings();
  allSettings[email] = {
    ...DEFAULT_SETTINGS,
    ...settings
  };
  saveAllUserSettings(allSettings);
}

function fillProfileForm(user) {
  document.getElementById('fullName').value = user.fullName || '';
  document.getElementById('email').value = user.email || '';
}

function fillNotificationForm(settings) {
  document.getElementById('toastNotificationsEnabled').checked = settings.toastNotificationsEnabled;
  document.getElementById('eventRemindersEnabled').checked = settings.eventRemindersEnabled;
}

function emailExistsForAnotherUser(email, currentEmail) {
  return getUsers().some(user => user.email === email && user.email !== currentEmail);
}

function updateUserProfile(currentUser, newFullName, newEmail) {
  const users = getUsers().map(user => {
    if (user.email !== currentUser.email) return user;

    return {
      ...user,
      fullName: newFullName,
      email: newEmail
    };
  });

  saveUsers(users);

  const updatedCurrentUser = {
    ...currentUser,
    fullName: newFullName,
    email: newEmail
  };

  saveCurrentUser(updatedCurrentUser);

  const allSettings = getAllUserSettings();
  if (allSettings[currentUser.email]) {
    allSettings[newEmail] = allSettings[currentUser.email];
    delete allSettings[currentUser.email];
    saveAllUserSettings(allSettings);
  }

  return updatedCurrentUser;
}

function updateUserPassword(currentUser, currentPassword, newPassword) {
  const users = getUsers();
  const targetUser = users.find(user => user.email === currentUser.email);

  if (!targetUser) {
    throw new Error('Пользователь не найден.');
  }

  if (targetUser.password !== currentPassword) {
    throw new Error('Текущий пароль введён неверно.');
  }

  const updatedUsers = users.map(user => {
    if (user.email !== currentUser.email) return user;

    return {
      ...user,
      password: newPassword
    };
  });

  saveUsers(updatedUsers);
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

  let currentUser = requireUser();
  if (!currentUser) return;

  fillProfileForm(currentUser);
  fillNotificationForm(getUserSettings(currentUser.email));
  setupPasswordValidation();

  const profileForm = document.getElementById('profileSettingsForm');
  const passwordForm = document.getElementById('passwordSettingsForm');
  const notificationForm = document.getElementById('notificationSettingsForm');
  const emailExistsError = document.getElementById('emailExistsError');

  profileForm.addEventListener('submit', event => {
    event.preventDefault();

    emailExistsError.classList.add('d-none');
    document.getElementById('email').classList.remove('is-invalid');

    if (!profileForm.checkValidity()) {
      profileForm.classList.add('was-validated');
      return;
    }

    const newFullName = document.getElementById('fullName').value.trim();
    const newEmail = document.getElementById('email').value.trim();

    if (emailExistsForAnotherUser(newEmail, currentUser.email)) {
      document.getElementById('email').classList.add('is-invalid');
      emailExistsError.classList.remove('d-none');
      return;
    }

    currentUser = updateUserProfile(currentUser, newFullName, newEmail);
    notifySuccess('Профиль успешно обновлён.');
  });

  passwordForm.addEventListener('submit', event => {
    event.preventDefault();

    if (!passwordForm.checkValidity()) {
      passwordForm.classList.add('was-validated');
      return;
    }

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
      updateUserPassword(currentUser, currentPassword, newPassword);
      passwordForm.reset();
      passwordForm.classList.remove('was-validated');
      notifySuccess('Пароль успешно обновлён.');
    } catch (error) {
      notifyError(error.message || 'Не удалось обновить пароль.');
    }
  });

  notificationForm.addEventListener('submit', event => {
    event.preventDefault();

    saveUserSettings(currentUser.email, {
      toastNotificationsEnabled: document.getElementById('toastNotificationsEnabled').checked,
      eventRemindersEnabled: document.getElementById('eventRemindersEnabled').checked,
    });

    notifySuccess('Настройки уведомлений сохранены.');
  });
});