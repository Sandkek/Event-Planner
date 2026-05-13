// js/services/notifications.service.js

import { getItem } from '../core/storage.js';

const TOAST_CONTAINER_ID = 'appToastContainer';
const CONFIRM_MODAL_ID = 'appConfirmModal';
const SETTINGS_KEY = 'userSettings';
const CURRENT_USER_KEY = 'currentUser';

function getCurrentUser() {
  return getItem(CURRENT_USER_KEY, null);
}

function getUserSettings(email) {
  const allSettings = getItem(SETTINGS_KEY, {});
  return {
    toastNotificationsEnabled: true,
    ...(allSettings[email] || {})
  };
}

// function areToastNotificationsEnabled() {
//   const user = getCurrentUser();

//   // Для неавторизованных пользователей toast можно не отключать
//   if (!user) return true;

//   return getUserSettings(user.email).toastNotificationsEnabled;
// }

function areToastNotificationsEnabled() {
  return true;
}

function ensureToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
  }

  return container;
}

function createToast(message, type = 'info', delay = 3000, force = false) {
  if (!force && !areToastNotificationsEnabled()) return;

  const container = ensureToastContainer();

  const colorMap = {
    info: 'text-bg-primary',
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning'
  };

  const titleMap = {
    info: 'Уведомление',
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Внимание'
  };

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center border-0 ${colorMap[type] || colorMap.info}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <div class="fw-semibold mb-1">${titleMap[type] || titleMap.info}</div>
        <div>${message}</div>
      </div>
      <button
        type="button"
        class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast"
        aria-label="Закрыть"
      ></button>
    </div>
  `;

  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, {
    delay,
    autohide: true
  });

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });

  toast.show();
}

function ensureConfirmModal() {
  let modalEl = document.getElementById(CONFIRM_MODAL_ID);

  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = CONFIRM_MODAL_ID;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${CONFIRM_MODAL_ID}Title">Подтверждение</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body" id="${CONFIRM_MODAL_ID}Body"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-role="cancel">Отмена</button>
            <button type="button" class="btn btn-danger" data-role="confirm">Подтвердить</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
  }

  return modalEl;
}

export function notify(message, delay = 3000, options = {}) {
  createToast(message, 'info', delay, options.force === true);
}

export function notifySuccess(message, delay = 3000, options = {}) {
  createToast(message, 'success', delay, options.force === true);
}

export function notifyError(message = 'Произошла ошибка.', delay = 4000, options = {}) {
  createToast(message, 'error', delay, options.force === true);
}

export function notifyWarning(message, delay = 3500, options = {}) {
  createToast(message, 'warning', delay, options.force === true);
}

export function confirmAction(
  message,
  {
    title = 'Подтверждение',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    confirmButtonClass = 'btn-danger'
  } = {}
) {
  return new Promise(resolve => {
    const modalEl = ensureConfirmModal();
    const titleEl = modalEl.querySelector(`#${CONFIRM_MODAL_ID}Title`);
    const bodyEl = modalEl.querySelector(`#${CONFIRM_MODAL_ID}Body`);
    const cancelBtn = modalEl.querySelector('[data-role="cancel"]');
    const confirmBtn = modalEl.querySelector('[data-role="confirm"]');

    titleEl.textContent = title;
    bodyEl.textContent = message;
    cancelBtn.textContent = cancelText;
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn ${confirmButtonClass}`;

    let settled = false;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: 'static',
      keyboard: true
    });

    const cleanup = () => {
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modalEl.removeEventListener('hidden.bs.modal', onHidden);
    };

    const finish = result => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const onConfirm = () => {
      finish(true);
      modal.hide();
    };

    const onCancel = () => {
      finish(false);
      modal.hide();
    };

    const onHidden = () => {
      finish(false);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modalEl.addEventListener('hidden.bs.modal', onHidden);

    modal.show();
  });
}