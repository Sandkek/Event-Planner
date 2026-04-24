import { setCurrentUser } from '../core/auth.js';
import { isEmailRegistered, saveUser } from '../services/users.service.js';

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

  form.addEventListener('submit', event => {
    event.preventDefault();

    emailExistsError.classList.add('d-none');
    emailInput.classList.remove('is-invalid');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = emailInput.value.trim();

    if (isEmailRegistered(email)) {
      emailInput.classList.add('is-invalid');
      emailExistsError.classList.remove('d-none');
      return;
    }

    const user = saveUser(fullName, email, password.value);
    setCurrentUser(user);

    window.location.href = 'index.html';
  });
});