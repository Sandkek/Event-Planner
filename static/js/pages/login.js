document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const authError = document.getElementById('authError');

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (authError) {
      authError.style.display = 'none';
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await response.json();

    if (!data.success) {
      if (authError) {
        authError.textContent = data.message || 'Неверный email или пароль.';
        authError.style.display = 'block';
      }
      return;
    }

    window.location.href = '/';
  });
});