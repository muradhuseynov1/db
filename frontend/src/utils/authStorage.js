// Simulate backend with localStorage

const STORAGE_KEY = 'registered_users';

export function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveUser(newUser) {
  const users = getUsers();
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function findUser(email, username) {
  const users = getUsers();
  return users.find(user => user.email === email && user.username === username);
}

export function userExists(email, username) {
  const users = getUsers();
  return users.some(user => user.email === email || user.username === username);
}
