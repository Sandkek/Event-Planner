// js/services/poll-permissions.js
import { getUserEventStatus } from './attendees.service.js';

export function canCreatePoll(event, user) {
  return Boolean(event && user && event.organizerEmail === user.email);
}

export function canDeletePoll(event, user) {
  return canCreatePoll(event, user);
}

export function canVoteInPoll(event, user, eventId) {
  if (!event || !user) return false;

  const status = getUserEventStatus(eventId, user.email);
  return status === 'going';
}