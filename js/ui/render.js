export function renderEmpty(container, text) {
  container.innerHTML = `<p class="text-center text-muted">${text}</p>`;
}

export function renderHtml(container, html) {
  container.innerHTML = html;
}