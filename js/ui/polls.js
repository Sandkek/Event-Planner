// js/ui/polls.js

import { getPollResults, getUserPollVote } from '../services/polls.service.js';

function getPollTypeLabel(type) {
  const labels = {
    time: 'Выбор времени',
    location: 'Выбор места',
    custom: 'Опрос'
  };

  return labels[type] || 'Опрос';
}

export function renderPollsList(container, polls, currentUser, permissions = {}) {
  const { canVote = false, canDelete = false } = permissions;

  if (!container) return;

  if (!polls.length) {
    container.innerHTML = '<p class="text-muted">Пока нет опросов.</p>';
    return;
  }

  container.innerHTML = polls.map(poll => {
    const results = getPollResults(poll);
    const currentVote = currentUser
      ? getUserPollVote(poll, currentUser.email)
      : null;

    const maxVotes = Math.max(...results.map(r => r.voteCount || 0), 0);

    return `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h5 class="mb-1">${poll.title}</h5>
              <div class="text-muted small">${getPollTypeLabel(poll.type)}</div>
            </div>

            ${
              canDelete
                ? `
                  <button
                    class="btn btn-outline-danger btn-sm poll-delete-btn"
                    data-poll-id="${poll.id}"
                  >
                    Удалить
                  </button>
                `
                : ''
            }
          </div>

          <div class="mt-3">
            ${(poll.options || []).map(option => {
              const result = results.find(item => item.optionId === option.id);

              const voteCount = result?.voteCount || 0;
              const percent = result?.percent || 0;

              const isChecked = Number(currentVote) === Number(option.id);
              const isLeader = voteCount === maxVotes && maxVotes > 0;

              return `
                <div class="border rounded p-2 mb-2
                  ${isLeader ? 'border-primary bg-light' : ''}
                  ${isChecked ? 'border-success' : ''}">
                  
                  <label class="d-flex align-items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="poll-${poll.id}"
                      value="${option.id}"
                      class="poll-option-input"
                      data-poll-id="${poll.id}"
                      ${isChecked ? 'checked' : ''}
                      ${canVote ? '' : 'disabled'}
                    >
                    <span>${option.text}</span>
                  </label>

                  ${isChecked ? '<div class="text-success small">✔ Ваш выбор</div>' : ''}
                  ${isLeader ? '<div class="text-primary small">🏆 Лидер голосования</div>' : ''}

                  <div class="progress mt-2" style="height: 10px;">
                    <div
                      class="progress-bar"
                      role="progressbar"
                      style="width: ${percent}%"
                      aria-valuenow="${percent}"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>

                  <div class="small text-muted mt-1">
                    ${voteCount} голос(ов) · ${percent}%
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${
            !canVote
              ? '<div class="small text-muted mt-2">Голосовать могут только участники мероприятия со статусом «Пойду».</div>'
              : ''
          }
        </div>
      </div>
    `;
  }).join('')
}

export function togglePollDeleteButtons(container, visible) {
  if (!container) return;

  container.querySelectorAll('.poll-delete-btn').forEach(button => {
    button.style.display = visible ? '' : 'none';
  });
}

export function setupPollOptionsPreview(containerId = 'pollOptionsPreview') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="mb-2">
      <input type="text" class="form-control poll-option-field" placeholder="Вариант 1">
    </div>
    <div class="mb-2">
      <input type="text" class="form-control poll-option-field" placeholder="Вариант 2">
    </div>
  `;
}

export function addPollOptionField(containerId = 'pollOptionsPreview') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const count = container.querySelectorAll('.poll-option-field').length + 1;

  const wrapper = document.createElement('div');
  wrapper.className = 'mb-2';
  wrapper.innerHTML = `
    <input type="text" class="form-control poll-option-field" placeholder="Вариант ${count}">
  `;

  container.appendChild(wrapper);
}

export function getPollFormData() {
  const title = document.getElementById('pollTitle')?.value.trim() || '';
  const type = document.getElementById('pollType')?.value || 'custom';

  const options = Array.from(document.querySelectorAll('.poll-option-field'))
    .map(input => input.value.trim())
    .filter(Boolean);

  return { title, type, options };
}

export function resetPollForm() {
  const titleInput = document.getElementById('pollTitle');
  const typeSelect = document.getElementById('pollType');

  if (titleInput) titleInput.value = '';
  if (typeSelect) typeSelect.value = 'custom';

  setupPollOptionsPreview();
}