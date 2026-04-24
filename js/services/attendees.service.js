import { STORAGE_KEYS } from '../core/constants.js';
import { getItem, setItem } from '../core/storage.js';

export function getAllAttendees() {
  return getItem(STORAGE_KEYS.EVENT_ATTENDEES, {});
}

export function saveAllAttendees(data) {
  setItem(STORAGE_KEYS.EVENT_ATTENDEES, data);
}

export function getEventAttendees(eventId) {
  const all = getAllAttendees();
  return all[eventId] || {};
}

export function setAttendeeStatus(eventId, email, status) {
  const all = getAllAttendees();

  if (!all[eventId]) {
    all[eventId] = {};
  }

  all[eventId][email] = status;
  saveAllAttendees(all);
}

export function removeAttendeeStatus(eventId, email) {
  const all = getAllAttendees();

  if (all[eventId]) {
    delete all[eventId][email];

    if (Object.keys(all[eventId]).length === 0) {
      delete all[eventId];
    }
  }

  saveAllAttendees(all);
}

export function getUserEventStatus(eventId, email) {
  const attendees = getEventAttendees(eventId);
  return attendees[email] || null;
}

export function getGoingCount(eventId) {
  return Object.values(getEventAttendees(eventId)).filter(
    status => status === 'going'
  ).length;
}

export function deleteEventAttendees(eventId) {
  const all = getAllAttendees();
  delete all[eventId];
  saveAllAttendees(all);
}