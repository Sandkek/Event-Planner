import { STORAGE_KEYS } from '../core/constants.js';
import { getItem, setItem } from '../core/storage.js';

export function getUsers() {
  return getItem(STORAGE_KEYS.USERS, []);
}

export function isEmailRegistered(email) {
  return getUsers().some(user => user.email === email);
}

export function findUser(email, password) {
  return getUsers().find(
    user => user.email === email && user.password === password
  );
}

export function saveUser(fullName, email, password) {
  const users = getUsers();
  const user = { fullName, email, password };
  users.push(user);
  setItem(STORAGE_KEYS.USERS, users);
  return user;
}