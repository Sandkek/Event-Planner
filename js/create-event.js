// create-event.js

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function generateEventId() {
  const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
  if (events.length === 0) return 100;
  const maxId = Math.max(...events.map(e => e.id));
  return maxId + 1;
}

function saveEvent(eventData) {
  const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
  events.push(eventData);
  localStorage.setItem('userEvents', JSON.stringify(events));
}

document.addEventListener('DOMContentLoaded', function() {
  // Обновляем навбар
  if (typeof updateNavbarUI === 'function') {
    updateNavbarUI();
  }
  
  const user = checkAuth();
  if (!user) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('date').min = `${year}-${month}-${day}T${hours}:${minutes}`;

  const fileInput = document.getElementById('imageUpload');
  const preview = document.getElementById('imagePreview');

  if (fileInput && preview) {
    fileInput.addEventListener('change', function() {
      preview.innerHTML = '';
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр" class="img-thumbnail" style="max-height: 200px;">`;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  document.getElementById('createEventForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!this.checkValidity()) {
      this.classList.add('was-validated');
      return;
    }

    let imageBase64 = '';
    const fileInput = document.getElementById('imageUpload');
    if (fileInput.files[0]) {
      try {
        imageBase64 = await imageToBase64(fileInput.files[0]);
      } catch (err) {
        alert('Ошибка при загрузке изображения');
        return;
      }
    }

    const eventData = {
      id: generateEventId(),
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      date: document.getElementById('date').value,
      location: document.getElementById('location').value.trim(),
      category: document.getElementById('category').value,
      organizer: user.fullName,
      organizerEmail: user.email,
      image: imageBase64
    };

    saveEvent(eventData);
    alert('Мероприятие успешно создано!');
    window.location.href = 'index.html';
  });
});