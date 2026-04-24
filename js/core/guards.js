import { getCurrentUser } from './auth.js';
import { notifyError } from '../services/notifications.service.js';

export function requireUser(redirectTo = 'login.html') {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = redirectTo;
    return null;
  }

  return user;
}

export function requireEntity(
  entity,
  notFoundMessage = 'Объект не найден.',
  redirectTo = 'index.html'
) {
  if (!entity) {
    notifyError(notFoundMessage);
    window.location.href = redirectTo;
    return false;
  }

  return true;
}

export function requireOwnership(
  entity,
  user,
  options = {}
) {
  const {
    ownerField = 'organizerEmail',
    message = 'У вас нет доступа к этому объекту.',
    redirectTo = 'index.html'
  } = options;

  if (!entity || !user || entity[ownerField] !== user.email) {
    notifyError(message);
    window.location.href = redirectTo;
    return false;
  }

  return true;
}