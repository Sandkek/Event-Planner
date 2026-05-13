export async function getUserEventStatus(eventId) {
  const response = await fetch(`/api/events/${eventId}/status`);
  const data = await response.json();

  return data.status;
}

export async function setAttendeeStatus(eventId, email, status) {
  const response = await fetch(`/api/events/${eventId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  return await response.json();
}

export async function removeAttendeeStatus(eventId) {
  const response = await fetch(`/api/events/${eventId}/status`, {
    method: 'DELETE'
  });

  return await response.json();
}

export async function getGoingCount(eventId) {
  const response = await fetch(`/api/events/${eventId}/going-count`);
  const data = await response.json();

  return data.count;
}

export async function getJoinedEvents() {
  const response = await fetch('/api/my/joined-events');
  return await response.json();
}

export async function deleteEventAttendees(eventId) {
  return { success: true };
}