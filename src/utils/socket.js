// src/utils/socket.js - Клиентский сокет для подключения к Party Games Server
import { io } from 'socket.io-client';

// Получаем или генерируем устойчивый ID игрока
function getOrCreatePlayerId() {
  let id = localStorage.getItem('party_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('party_player_id', id);
  }
  return id;
}

export const playerId = getOrCreatePlayerId();

// Получаем сохраненное имя игрока
export function getSavedPlayerName() {
  return localStorage.getItem('party_player_name') || '';
}

export function savePlayerName(name) {
  if (name) {
    localStorage.setItem('party_player_name', name.trim());
  }
}

// Определение адреса сервера: из переменной окружения VITE_BACKEND_URL или локально
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? window.location.origin
    : 'https://compgame-server.onrender.com'
);

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 25,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});
