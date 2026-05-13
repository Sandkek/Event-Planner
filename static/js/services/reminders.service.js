// static/js/services/reminders.service.js

import { getAllEvents } from './events.service.js';
import { getUserEventStatus } from './attendees.service.js';

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

export function areEventRemindersEnabled(user) {
  return Boolean(user);
}

export function isReminderToastEnabled(user) {
  return Boolean(user);
}

export async function getJoinedUpcomingEvents(user) {
  if (!user || !areEventRemindersEnabled(user)) return [];

  const now = new Date();
  const events = await getAllEvents();

  const joinedEvents = [];

  for (const event of events) {
    const status = await getUserEventStatus(event.id);

    if (status === 'going') {
      joinedEvents.push(event);
    }
  }

  return joinedEvents
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

export async function getUpcomingReminders(user) {
  const now = new Date();
  const events = await getJoinedUpcomingEvents(user);

  return events
    .map(event => {
      const bucket = getReminderBucket(event.dateObject, now);
      return bucket ? { ...event, reminderBucket: bucket } : null;
    })
    .filter(Boolean);
}

export async function getNearestReminder(user) {
  const reminders = await getUpcomingReminders(user);
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

export function wasReminderShown(user, event) {
  return false;
}

export function markReminderShown(user, event) {
  return true;
}

export async function getGroupedReminders(user) {
  const reminders = await getUpcomingReminders(user);

  return {
    today: reminders.filter(item => item.reminderBucket === 'today'),
    next24h: reminders.filter(item => item.reminderBucket === '24h'),
    next7d: reminders.filter(item => item.reminderBucket === '7d')
  };
}