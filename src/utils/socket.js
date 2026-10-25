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

// Подключаемся к текущему хосту (через Vite-прокси на порту 5173, чтобы требовался только один порт!)
export const socket = io(window.location.origin, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000
});
