// js/services/invite.service.js

import { setAttendeeStatus, getUserEventStatus } from './attendees.service.js';

export function generateInviteCode(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export function buildInviteLink(event) {
  const url = new URL(window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/event.html'));
  url.searchParams.set('id', event.id);
  url.searchParams.set('invite', event.inviteCode);
  return url.toString();
}

export function getInviteCodeFromUrl() {
  return new URLSearchParams(window.location.search).get('invite');
}

export function validateInvite(event, inviteCode) {
  if (!event || !inviteCode) return false;
  return event.inviteCode === inviteCode;
}

export function acceptInvite(eventId, userEmail) {
  const currentStatus = getUserEventStatus(eventId, userEmail);

  if (currentStatus !== 'going') {
    setAttendeeStatus(eventId, userEmail, 'going');
  }
}