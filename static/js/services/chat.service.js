export async function getChatMessages(eventId) {
  const response = await fetch(`/api/events/${eventId}/chat`);
  return await response.json();
}

export async function saveChatMessage(eventId, messageData) {
  const response = await fetch(`/api/events/${eventId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: messageData.text
    })
  });

  return await response.json();
}

export async function deleteEventChat(eventId) {
  const response = await fetch(`/api/events/${eventId}/chat`, {
    method: 'DELETE'
  });

  return await response.json();
}