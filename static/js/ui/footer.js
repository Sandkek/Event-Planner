export async function loadFooter() {
  try {
    const response = await fetch('/static/components/footer.html');
    const html = await response.text();

    document.body.insertAdjacentHTML('beforeend', html);
  } catch (error) {
    console.error('Ошибка загрузки footer', error);
  }
}