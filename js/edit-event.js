// edit-event.js

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

function getEventById(eventId) {
  const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
  const event = userEvents.find(e => e.id == eventId);
  return event || null;
}

function updateEvent(updatedEvent) {
  let userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
  userEvents = userEvents.map(e => e.id == updatedEvent.id ? updatedEvent : e);
  localStorage.setItem('userEvents', JSON.stringify(userEvents));
}

function deleteEvent(eventId) {
  let userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
  userEvents = userEvents.filter(e => e.id != eventId);
  localStorage.setItem('userEvents', JSON.stringify(userEvents));

  const allAttendees = JSON.parse(localStorage.getItem('eventAttendees') || '{}');
  delete allAttendees[eventId];
  localStorage.setItem('eventAttendees', JSON.stringify(allAttendees));
}

function loadEventIntoForm(event) {
  document.getElementById('eventId').value = event.id;
  document.getElementById('title').value = event.title;
  document.getElementById('description').value = event.description;
  document.getElementById('date').value = event.date;
  document.getElementById('location').value = event.location;
  document.getElementById('category').value = event.category;

  if (event.image) {
    document.getElementById('imagePreview').innerHTML = `
      <img src="${event.image}" alt="Текущее изображение" class="img-thumbnail" style="max-height: 200px;">
    `;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Обновляем навбар
  if (typeof updateNavbarUI === 'function') {
    updateNavbarUI();
  }
  
  const user = checkAuth();
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = parseInt(urlParams.get('id'));

  if (!eventId) {
    alert('Не указан ID мероприятия');
    window.history.back();
    return;
  }

  const event = getEventById(eventId);
  if (!event || event.organizerEmail !== user.email) {
    alert('Вы не можете редактировать это мероприятие');
    window.location.href = 'index.html';
    return;
  }

  loadEventIntoForm(event);

  const fileInput = document.getElementById('imageUpload');
  const preview = document.getElementById('imagePreview');

  if (fileInput && preview) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Новое изображение" class="img-thumbnail" style="max-height: 200px;">`;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  document.getElementById('editEventForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!this.checkValidity()) {
      this.classList.add('was-validated');
      return;
    }

    let imageBase64 = event.image || '';
    const fileInput = document.getElementById('imageUpload');
    if (fileInput.files[0]) {
      try {
        imageBase64 = await imageToBase64(fileInput.files[0]);
      } catch (err) {
        alert('Ошибка при загрузке изображения');
        return;
      }
    }

    const updatedEvent = {
      id: eventId,
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      date: document.getElementById('date').value,
      location: document.getElementById('location').value.trim(),
      category: document.getElementById('category').value,
      organizer: user.fullName,
      organizerEmail: user.email,
      image: imageBase64
    };

    updateEvent(updatedEvent);
    alert('Мероприятие успешно обновлено!');
    window.location.href = `event.html?id=${eventId}`;
  });

  document.getElementById('deleteEventBtn').addEventListener('click', function() {
    if (confirm('Вы уверены, что хотите удалить это мероприятие? Все записи участников будут удалены.')) {
      deleteEvent(eventId);
      alert('Мероприятие удалено.');
      window.location.href = 'profile.html';
    }
  });
});