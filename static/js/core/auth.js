export async function getCurrentUser() {
  const response = await fetch('/api/current-user');
  const data = await response.json();

  return data.user;
}

export async function logout() {
  await fetch('/api/logout', {
    method: 'POST'
  });
}

export async function requireAuth(redirectTo = '/login') {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = redirectTo;
    return null;
  }

  return user;
}