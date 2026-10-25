// src/utils/stickersSocket.js - Realtime Firebase Adapter для игры «Стикеры» («Кто я?», «Лобстер»)
import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';

const STICKERS_AVATARS = ['🦊', '🐱', '🐻', '🦁', '🐼', '🦄', '🐸', '🐙', '🤖', '👾', '🤠', '🎭', '🥑', '🍕', '🚀', '⭐'];

function getRandomAvatar() {
  return STICKERS_AVATARS[Math.floor(Math.random() * STICKERS_AVATARS.length)];
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOrCreateStickersPlayerId() {
  let id = localStorage.getItem('stickers_player_id');
  if (!id) {
    id = 'sp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('stickers_player_id', id);
  }
  return id;
}

export const stickersPlayerId = getOrCreateStickersPlayerId();

export function getSavedStickersName() {
  return localStorage.getItem('stickers_player_name') || '';
}

export function saveStickersName(name) {
  if (name) {
    localStorage.setItem('stickers_player_name', name.trim());
  }
}

// Перемешивание массива (Фишер-Йетс)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class StickersSocketAdapter {
  constructor() {
    this.listeners = new Map();
    this.currentRoomCode = null;
    this.roomRef = null;
    this.unsubscribeRoom = null;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  _trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in stickers listener for ${event}:`, e);
        }
      });
    }
  }

  _startListening(code) {
    if (this.currentRoomCode === code && this.unsubscribeRoom) return;
    this._stopListening();

    this.currentRoomCode = code;
    this.roomRef = ref(database, `stickers_rooms/${code}`);

    let hadInitialData = false;
    this.unsubscribeRoom = onValue(this.roomRef, (snapshot) => {
      const roomRaw = snapshot.val();
      if (!roomRaw) {
        if (hadInitialData) {
          this._trigger('reconnect_failed', { message: 'Комната закрыта или удалена' });
        }
        return;
      }
      hadInitialData = true;
      this._handleRoomUpdate(roomRaw);
    });
  }

  _stopListening() {
    if (this.unsubscribeRoom) {
      this.unsubscribeRoom();
      this.unsubscribeRoom = null;
    }
    if (this.roomRef) {
      off(this.roomRef);
      this.roomRef = null;
    }
    this.currentRoomCode = null;
  }

  _handleRoomUpdate(roomRaw) {
    const playersList = roomRaw.players ? Object.values(roomRaw.players) : [];
    const myPlayer = playersList.find(p => p.id === stickersPlayerId);
    const isHost = myPlayer ? myPlayer.isHost : (roomRaw.hostId === stickersPlayerId);

    // Массив отгадавших с сохранением порядка
    const guessedPlayerIds = roomRaw.guessedPlayerIds || [];

    const publicData = {
      code: roomRaw.code,
      hostId: roomRaw.hostId,
      hostName: roomRaw.hostName,
      status: roomRaw.status || 'LOBBY', // 'LOBBY' | 'NAMING' | 'PLAYING' | 'FINALE'
      settings: roomRaw.settings || { category: 'all', timerSeconds: 60 },
      players: playersList,
      assignments: roomRaw.assignments || {}, // { [fromPlayerId]: toPlayerId }
      stickers: roomRaw.stickers || {}, // { [targetPlayerId]: { text, authorId, authorName, isReady } }
      activeTurnPlayerId: roomRaw.activeTurnPlayerId || null,
      activeTurnIndex: roomRaw.activeTurnIndex || 0,
      guessedPlayerIds,
      turnStartTime: roomRaw.turnStartTime || null,
      myPlayerId: stickersPlayerId,
      myPlayer,
      isHost
    };

    this._trigger('room_update', publicData);
  }

  emit(event, payload = {}) {
    switch (event) {
      case 'create_room':
        this._createRoom(payload);
        break;
      case 'join_room':
        this._joinRoom(payload);
        break;
      case 'reconnect_player':
        this._reconnectPlayer(payload);
        break;
      case 'update_settings':
        this._updateSettings(payload);
        break;
      case 'start_naming':
        this._startNamingPhase(payload);
        break;
      case 'submit_sticker':
        this._submitSticker(payload);
        break;
      case 'mark_as_guessed':
        this._markAsGuessed(payload);
        break;
      case 'next_turn':
        this._nextTurn(payload);
        break;
      case 'end_game':
        this._endGame(payload);
        break;
      case 'restart_game':
        this._restartGame(payload);
        break;
      case 'reset_to_lobby':
        this._resetToLobby(payload);
        break;
      default:
        console.warn(`[StickersSocket] Unknown event: ${event}`);
    }
  }

  async _createRoom({ hostName, settings = {} }) {
    try {
      const code = generateRoomCode();
      const myAvatar = getRandomAvatar();
      saveStickersName(hostName);

      const defaultSettings = {
        category: settings.category || 'all',
        timerSeconds: settings.timerSeconds !== undefined ? settings.timerSeconds : 60
      };

      const roomData = {
        code,
        hostId: stickersPlayerId,
        hostName: hostName.trim(),
        status: 'LOBBY',
        settings: defaultSettings,
        createdAt: Date.now(),
        players: {
          [stickersPlayerId]: {
            id: stickersPlayerId,
            name: hostName.trim(),
            avatar: myAvatar,
            isHost: true,
            joinedAt: Date.now()
          }
        },
        assignments: {},
        stickers: {},
        guessedPlayerIds: []
      };

      const rRef = ref(database, `stickers_rooms/${code}`);
      await set(rRef, roomData);

      this._startListening(code);
      this._trigger('room_created', { roomCode: code });
    } catch (e) {
      console.error('Error creating stickers room:', e);
      this._trigger('error_message', { message: 'Не удалось создать комнату: ' + e.message });
    }
  }

  async _joinRoom({ roomCode, playerName }) {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      if (!code) {
        this._trigger('error_message', { message: 'Введите код комнаты' });
        return;
      }

      const rRef = ref(database, `stickers_rooms/${code}`);
      const snapshot = await get(rRef);
      if (!snapshot.exists()) {
        this._trigger('error_message', { message: 'Комната не найдена' });
        return;
      }

      const roomRaw = snapshot.val();
      if (roomRaw.status !== 'LOBBY') {
        // Проверяем, не переподключение ли это
        const existingPlayers = roomRaw.players || {};
        if (!existingPlayers[stickersPlayerId]) {
          this._trigger('error_message', { message: 'Игра уже началась, подключиться нельзя' });
          return;
        }
      }

      saveStickersName(playerName);
      const myAvatar = getRandomAvatar();

      const newPlayer = {
        id: stickersPlayerId,
        name: playerName.trim(),
        avatar: myAvatar,
        isHost: false,
        joinedAt: Date.now()
      };

      await update(ref(database, `stickers_rooms/${code}/players/${stickersPlayerId}`), newPlayer);

      this._startListening(code);
      this._trigger('room_joined', { roomCode: code });
    } catch (e) {
      console.error('Error joining stickers room:', e);
      this._trigger('error_message', { message: 'Не удалось войти: ' + e.message });
    }
  }

  async _reconnectPlayer({ roomCode, playerId }) {
    try {
      const code = (roomCode || '').trim();
      if (!code) return;

      const rRef = ref(database, `stickers_rooms/${code}`);
      const snapshot = await get(rRef);
      if (!snapshot.exists()) {
        this._trigger('reconnect_failed', { message: 'Комната больше не существует' });
        return;
      }

      const roomRaw = snapshot.val();
      const existingPlayers = roomRaw.players || {};
      if (!existingPlayers[playerId]) {
        this._trigger('reconnect_failed', { message: 'Вы не были участником этой комнаты' });
        return;
      }

      this._startListening(code);
    } catch (e) {
      console.error('Error reconnecting stickers player:', e);
      this._trigger('reconnect_failed', { message: e.message });
    }
  }

  async _updateSettings(settings) {
    if (!this.currentRoomCode) return;
    try {
      await update(ref(database, `stickers_rooms/${this.currentRoomCode}/settings`), settings);
    } catch (e) {
      console.error('Error updating settings:', e);
    }
  }

  async _startNamingPhase() {
    if (!this.currentRoomCode) return;
    try {
      const rRef = ref(database, `stickers_rooms/${this.currentRoomCode}`);
      const snapshot = await get(rRef);
      if (!snapshot.exists()) return;

      const roomRaw = snapshot.val();
      const playersList = Object.values(roomRaw.players || {});
      if (playersList.length < 2) {
        this._trigger('error_message', { message: 'Для игры нужно минимум 2 игрока!' });
        return;
      }

      // Перемешиваем игроков и строим круговую цепочку (Single Hamiltonian Cycle)
      // P[0] -> P[1] -> P[2] -> ... -> P[n-1] -> P[0]
      const shuffled = shuffleArray(playersList);
      const assignments = {};
      const stickers = {};

      const n = shuffled.length;
      for (let i = 0; i < n; i++) {
        const fromPlayer = shuffled[i];
        const toPlayer = shuffled[(i + 1) % n];
        assignments[fromPlayer.id] = toPlayer.id;
        stickers[toPlayer.id] = {
          text: '',
          authorId: fromPlayer.id,
          authorName: fromPlayer.name,
          isReady: false
        };
      }

      await update(rRef, {
        status: 'NAMING',
        assignments,
        stickers,
        guessedPlayerIds: [],
        activeTurnPlayerId: null,
        activeTurnIndex: 0
      });
    } catch (e) {
      console.error('Error starting naming phase:', e);
    }
  }

  async _submitSticker({ targetPlayerId, stickerText }) {
    if (!this.currentRoomCode) return;
    try {
      const rRef = ref(database, `stickers_rooms/${this.currentRoomCode}`);
      const snapshot = await get(rRef);
      if (!snapshot.exists()) return;

      const roomRaw = snapshot.val();
      const stickers = { ...(roomRaw.stickers || {}) };
      const currentTargetSticker = stickers[targetPlayerId] || {};

      stickers[targetPlayerId] = {
        ...currentTargetSticker,
        text: stickerText.trim(),
        authorId: stickersPlayerId,
        authorName: (roomRaw.players && roomRaw.players[stickersPlayerId]?.name) || 'Игрок',
        isReady: true,
        submittedAt: Date.now()
      };

      const playersList = Object.values(roomRaw.players || {});
      // Проверяем, готовы ли стикеры для ВСЕХ игроков
      const allReady = playersList.every(p => {
        const st = stickers[p.id];
        return st && st.isReady && st.text && st.text.trim().length > 0;
      });

      if (allReady) {
        // Все готовы! Автоматически переходим к игре!
        await update(rRef, {
          stickers,
          status: 'PLAYING',
          activeTurnPlayerId: playersList[0].id,
          activeTurnIndex: 0,
          turnStartTime: Date.now(),
          guessedPlayerIds: []
        });
      } else {
        // Обновляем только стикер
        await update(ref(database, `stickers_rooms/${this.currentRoomCode}/stickers`), stickers);
      }
    } catch (e) {
      console.error('Error submitting sticker:', e);
    }
  }

  async _markAsGuessed({ playerId }) {
    if (!this.currentRoomCode) return;
    try {
      const rRef = ref(database, `stickers_rooms/${this.currentRoomCode}`);
      const snapshot = await get(rRef);
      if (!snapshot.exists()) return;

      const roomRaw = snapshot.val();
      const currentGuessed = roomRaw.guessedPlayerIds || [];
      if (currentGuessed.includes(playerId)) return;

      const updatedGuessed = [...currentGuessed, playerId];
      const playersList = Object.values(roomRaw.players || {});

      // Если все отгадали — переходим в финал
      const isAllGuessed = updatedGuessed.length >= playersList.length;

      await update(rRef, {
        guessedPlayerIds: updatedGuessed,
        status: isAllGuessed ? 'FINALE' : 'PLAYING'
      });
    } catch (e) {
      console.error('Error marking as guessed:', e);
    }
  }

  async _nextTurn() {
    if (!this.currentRoomCode) return;
    try {
      const rRef = ref(database, `stickers_rooms/${this.currentRoomCode}`);
      const snapshot = await get(rRef);
      if (!snapshot.exists()) return;

      const roomRaw = snapshot.val();
      const playersList = Object.values(roomRaw.players || {});
      if (playersList.length === 0) return;

      const currentIndex = roomRaw.activeTurnIndex || 0;
      const nextIndex = (currentIndex + 1) % playersList.length;
      const nextPlayer = playersList[nextIndex];

      await update(rRef, {
        activeTurnIndex: nextIndex,
        activeTurnPlayerId: nextPlayer.id,
        turnStartTime: Date.now()
      });
    } catch (e) {
      console.error('Error advancing turn:', e);
    }
  }

  async _endGame() {
    if (!this.currentRoomCode) return;
    try {
      const rRef = ref(database, `stickers_rooms/${this.currentRoomCode}`);
      await update(rRef, {
        status: 'FINALE'
      });
    } catch (e) {
      console.error('Error ending game:', e);
    }
  }

  async _restartGame() {
    // Начать новый раунд сразу с фазы придумывания новых стикеров
    await this._startNamingPhase();
  }

  async _resetToLobby() {
    if (!this.currentRoomCode) return;
    try {
      const rRef = ref(database, `stickers_rooms/${this.currentRoomCode}`);
      await update(rRef, {
        status: 'LOBBY',
        assignments: {},
        stickers: {},
        guessedPlayerIds: [],
        activeTurnPlayerId: null,
        activeTurnIndex: 0
      });
    } catch (e) {
      console.error('Error resetting to lobby:', e);
    }
  }

  async leaveRoom(isHost = false) {
    const code = this.currentRoomCode;
    this._stopListening();

    if (!code) return;

    try {
      if (isHost) {
        // Если ведущий выходит, удаляем комнату
        await remove(ref(database, `stickers_rooms/${code}`));
      } else {
        // Игрок выходит — удаляем себя из списка
        await remove(ref(database, `stickers_rooms/${code}/players/${stickersPlayerId}`));
      }
    } catch (e) {
      console.error('Error leaving stickers room:', e);
    }
  }
}

export const stickersSocket = new StickersSocketAdapter();
