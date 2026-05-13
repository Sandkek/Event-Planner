// js/ui/reminders.js

import { formatShortDate } from '../core/utils.js';

function renderReminderList(title, items, badgeClass = 'bg-primary') {
  if (!items.length) return '';

  return `
    <div class="card reminder-card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 class="mb-0">${title}</h5>
          <span class="badge ${badgeClass}">${items.length}</span>
        </div>

        <div class="list-group list-group-flush">
          ${items.map(event => `
            <a
              href="/event/${event.id}"
              class="list-group-item list-group-item-action px-0"
            >
              <div class="fw-semibold">${event.title}</div>
              <div class="small text-muted">${formatShortDate(event.date)} · ${event.location}</div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderRemindersBlock(container, groupedReminders) {
  if (!container) return;

  const total =
    groupedReminders.today.length +
    groupedReminders.next24h.length +
    groupedReminders.next7d.length;

  if (!total) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <section class="reminders-section mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h3 class="mb-1">Напоминания</h3>
          <p class="text-muted mb-0">Ваши ближайшие мероприятия</p>
        </div>
      </div>

      ${renderReminderList('Сегодня', groupedReminders.today, 'bg-danger')}
      ${renderReminderList('В ближайшие 24 часа', groupedReminders.next24h, 'bg-warning text-dark')}
      ${renderReminderList('На этой неделе', groupedReminders.next7d, 'bg-primary')}
    </section>
  `;
}