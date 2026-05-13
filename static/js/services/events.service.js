export async function getAllEvents() {
  const response = await fetch('/api/events');
  return await response.json();
}

export async function getEventById(eventId) {
  const response = await fetch(`/api/events/${eventId}`);

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export async function createEvent(eventData) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });

  return await response.json();
}

export async function deleteEvent(eventId) {
  const response = await fetch(`/api/events/${eventId}`, {
    method: 'DELETE'
  });

  return response.json();
}

export async function updateEvent(eventData) {
  const response = await fetch(`/api/events/${eventData.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });

  return await response.json();
}

export async function filterEvents({ query = '', category = '', dateFilter = '' }) {
  const events = await getAllEvents();
  const search = query.trim().toLowerCase();

  return events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search) ||
      event.location.toLowerCase().includes(search);

    const matchesCategory = !category || event.category === category;

    return matchesSearch && matchesCategory;
  });
}