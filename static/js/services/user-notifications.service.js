export async function getNotifications() {
  const response = await fetch('/api/notifications');
  return await response.json();
}

export async function markNotificationRead(notificationId) {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST'
  });

  return await response.json();
}