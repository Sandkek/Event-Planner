document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const emailInput = document.getElementById('email');
  const emailExistsError = document.getElementById('emailExistsError');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');

  confirmPassword.addEventListener('input', () => {
    confirmPassword.setCustomValidity(
      password.value !== confirmPassword.value ? 'Пароли не совпадают.' : ''
    );
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    emailExistsError?.classList.add('d-none');
    emailInput.classList.remove('is-invalid');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: document.getElementById('fullName').value.trim(),
        email: emailInput.value.trim(),
        password: password.value
      })
    });

    const data = await response.json();

    if (!data.success) {
      emailInput.classList.add('is-invalid');

      if (emailExistsError) {
        emailExistsError.textContent = data.message || 'Ошибка регистрации.';
        emailExistsError.classList.remove('d-none');
      }

      return;
    }

    window.location.href = '/';
  });
});