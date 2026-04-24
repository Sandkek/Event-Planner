import { setCurrentUser } from '../core/auth.js';
import { findUser } from '../services/users.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const authError = document.getElementById('authError');

  form.addEventListener('submit', event => {
    event.preventDefault();
    authError.style.display = 'none';

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const user = findUser(email, password);

    if (!user) {
      authError.style.display = 'block';
      return;
    }

    setCurrentUser(user);
    window.location.href = 'index.html';
  });
});