export function getItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (error) {
    console.error(`Ошибка чтения localStorage по ключу "${key}"`, error);
    return defaultValue;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Ошибка записи localStorage по ключу "${key}"`, error);
  }
}

export function removeItem(key) {
  localStorage.removeItem(key);
}