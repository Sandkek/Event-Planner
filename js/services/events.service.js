import { STORAGE_KEYS } from '../core/constants.js';
import { getItem, setItem } from '../core/storage.js';

const demoEvents = [
  {
    id: 1,
    title: 'Вечер JavaScript в Москве',
    description: 'Присоединяйтесь к нам, чтобы обсудить последние тенденции в JavaScript, поделиться опытом и найти единомышленников.',
    date: '2026-01-15T19:00:00',
    location: 'Loft №7, ул. Тверская, 7, Москва',
    category: 'tech',
    organizer: 'JS Community',
    organizerEmail: 'demo-js@example.com',
    image: ''
  },
  {
    id: 2,
    title: 'Йога на свежем воздухе',
    description: 'Утренняя йога в парке Горького. Подходит для всех уровней подготовки.',
    date: '2026-01-12T08:00:00',
    location: 'Парк Горького, площадка у фонтана',
    category: 'health',
    organizer: 'Yoga Life',
    organizerEmail: 'demo-yoga@example.com',
    image: ''
  }
];

export function getUserEvents() {
  return getItem(STORAGE_KEYS.USER_EVENTS, []);
}

export function saveUserEvents(events) {
  setItem(STORAGE_KEYS.USER_EVENTS, events);
}

export function getAllEvents() {
  return [...demoEvents, ...getUserEvents()];
}

export function getEventById(eventId) {
  return getAllEvents().find(event => Number(event.id) === Number(eventId)) || null;
}

export function generateEventId() {
  const events = getAllEvents();
  if (events.length === 0) return 1;
  return Math.max(...events.map(event => Number(event.id))) + 1;
}

export function createEvent(eventData) {
  const events = getUserEvents();
  events.push(eventData);
  saveUserEvents(events);
}

export function updateEvent(updatedEvent) {
  const events = getUserEvents().map(event =>
    Number(event.id) === Number(updatedEvent.id) ? updatedEvent : event
  );
  saveUserEvents(events);
}

export function deleteEvent(eventId) {
  const events = getUserEvents().filter(event => Number(event.id) !== Number(eventId));
  saveUserEvents(events);
}

export function filterEvents({ query = '', category = '', dateFilter = '' }) {
  const search = query.trim().toLowerCase();

  return getAllEvents().filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search) ||
      event.location.toLowerCase().includes(search);

    const matchesCategory = !category || event.category === category;

    let matchesDate = true;
    const eventDate = new Date(event.date);
    const now = new Date();

    if (dateFilter === 'today') {
      matchesDate = eventDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      matchesDate = eventDate >= now && eventDate <= weekFromNow;
    } else if (dateFilter === 'month') {
      const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      matchesDate = eventDate >= now && eventDate <= monthFromNow;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });
}