import { getUserEventStatus } from './attendees.service.js';

export function canCreatePoll(event, user) {
  return Boolean(event && user && event.organizerEmail === user.email);
}

export function canDeletePoll(event, user) {
  return canCreatePoll(event, user);
}

export async function canVoteInPoll(event, user, eventId) {
  if (!event || !user) return false;

  const status = await getUserEventStatus(eventId);
  return status === 'going';
}