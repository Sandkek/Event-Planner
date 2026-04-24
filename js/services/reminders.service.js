// js/services/reminders.service.js

import { getAllEvents } from './events.service.js';
import { getUserEventStatus } from './attendees.service.js';
import { getItem, setItem } from '../core/storage.js';

const REMINDER_STORAGE_KEY = 'shownReminders';
const SETTINGS_KEY = 'userSettings';

function toDate(value) {
  return new Date(value);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function getHoursDiff(from, to) {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getUserSettings(email) {
  const allSettings = getItem(SETTINGS_KEY, {});
  return {
    toastNotificationsEnabled: true,
    eventRemindersEnabled: true,
    ...(allSettings[email] || {})
  };
}

export function areEventRemindersEnabled(user) {
  if (!user) return false;
  return getUserSettings(user.email).eventRemindersEnabled;
}

export function isReminderToastEnabled(user) {
  if (!user) return false;
  const settings = getUserSettings(user.email);
  return settings.eventRemindersEnabled && settings.reminderToastEnabled;
}

export function getJoinedUpcomingEvents(user) {
  if (!user || !areEventRemindersEnabled(user)) return [];

  const now = new Date();

  return getAllEvents()
    .filter(event => getUserEventStatus(event.id, user.email) === 'going')
    .map(event => ({
      ...event,
      dateObject: toDate(event.date)
    }))
    .filter(event => isValidDate(event.dateObject))
    .filter(event => event.dateObject >= now)
    .sort((a, b) => a.dateObject - b.dateObject);
}

export function getReminderBucket(eventDate, now = new Date()) {
  const diffHours = getHoursDiff(now, eventDate);

  if (diffHours < 0) return null;
  if (isSameDay(now, eventDate)) return 'today';
  if (diffHours <= 24) return '24h';
  if (diffHours <= 24 * 7) return '7d';

  return null;
}

export function getUpcomingReminders(user) {
  const now = new Date();

  return getJoinedUpcomingEvents(user)
    .map(event => {
      const bucket = getReminderBucket(event.dateObject, now);
      return bucket ? { ...event, reminderBucket: bucket } : null;
    })
    .filter(Boolean);
}

export function getNearestReminder(user) {
  const reminders = getUpcomingReminders(user);
  return reminders.length ? reminders[0] : null;
}

export function formatReminderText(event) {
  const dateText = event.dateObject.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (event.reminderBucket === 'today') {
    return `Сегодня в ${event.dateObject.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })} состоится мероприятие «${event.title}».`;
  }

  if (event.reminderBucket === '24h') {
    return `В ближайшие 24 часа состоится мероприятие «${event.title}» (${dateText}).`;
  }

  return `На этой неделе у вас запланировано мероприятие «${event.title}» (${dateText}).`;
}

function getShownReminders() {
  return getItem(REMINDER_STORAGE_KEY, {});
}

function saveShownReminders(data) {
  setItem(REMINDER_STORAGE_KEY, data);
}

function buildReminderKey(user, event) {
  return `${user.email}::${event.id}::${event.reminderBucket}`;
}

export function wasReminderShown(user, event) {
  const shown = getShownReminders();
  return Boolean(shown[buildReminderKey(user, event)]);
}

export function markReminderShown(user, event) {
  const shown = getShownReminders();
  shown[buildReminderKey(user, event)] = true;
  saveShownReminders(shown);
}

export function getGroupedReminders(user) {
  const reminders = getUpcomingReminders(user);

  return {
    today: reminders.filter(item => item.reminderBucket === 'today'),
    next24h: reminders.filter(item => item.reminderBucket === '24h'),
    next7d: reminders.filter(item => item.reminderBucket === '7d')
  };
}