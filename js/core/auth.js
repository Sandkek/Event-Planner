import { getItem, removeItem, setItem } from './storage.js';

const CURRENT_USER_KEY = 'currentUser';

export function getCurrentUser() {
  return getItem(CURRENT_USER_KEY, null);
}

export function setCurrentUser(user) {
  setItem(CURRENT_USER_KEY, user);
}

export function logout() {
  removeItem(CURRENT_USER_KEY);
}

export function requireAuth(redirectTo = 'login.html') {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = redirectTo;
    return null;
  }

  return user;
}