export function isEventOwner(event, user) {
  if (!event || !user) return false;
  return event.organizerEmail === user.email;
}

export function canEditEvent(event, user) {
  return isEventOwner(event, user);
}

export function canDeleteEvent(event, user) {
  return isEventOwner(event, user);
}

export function canManageEvent(event, user) {
  return isEventOwner(event, user);
}

export function canRespondToEvent(event, user) {
  return Boolean(event && user);
}

export function canViewChat(event, user, userStatus) {
  if (!event || !user) return false;
  return userStatus === 'going';
}

export function canSendMessage(event, user, userStatus) {
  return canViewChat(event, user, userStatus);
}

export function getEventPermissions(event, user, userStatus = null) {
  const owner = isEventOwner(event, user);

  return {
    isOwner: owner,
    canEdit: canEditEvent(event, user),
    canDelete: canDeleteEvent(event, user),
    canManage: canManageEvent(event, user),
    canRespond: canRespondToEvent(event, user),
    canViewChat: canViewChat(event, user, userStatus),
    canSendMessage: canSendMessage(event, user, userStatus)
  };
}