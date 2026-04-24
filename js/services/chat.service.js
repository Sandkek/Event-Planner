import { STORAGE_KEYS } from '../core/constants.js';
import { getItem, setItem } from '../core/storage.js';

export function getAllChats() {
  return getItem(STORAGE_KEYS.EVENT_CHATS, {});
}

export function getChatMessages(eventId) {
  return getAllChats()[eventId] || [];
}

export function saveChatMessage(eventId, messageData) {
  const chats = getAllChats();

  if (!chats[eventId]) {
    chats[eventId] = [];
  }

  chats[eventId].push(messageData);
  setItem(STORAGE_KEYS.EVENT_CHATS, chats);
}

export function deleteEventChat(eventId) {
  const chats = getAllChats();
  delete chats[eventId];
  setItem(STORAGE_KEYS.EVENT_CHATS, chats);
}