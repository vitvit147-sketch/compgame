// src/utils/danetkiSocket.js - Realtime Firebase Adapter для игры «Данетки»
import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import { ALL_DANETKI, getRandomDanetka } from '../data/danetkiData';

const DANETKI_AVATARS = ['🕵️‍♂️', '🕵️‍♀️', '🧐', '💡', '🔍', '🧠', '🦉', '🗝️', '❓', '🎩'];

function getRandomAvatar() {
  return DANETKI_AVATARS[Math.floor(Math.random() * DANETKI_AVATARS.length)];
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOrCreateDanetkiPlayerId() {
  let id = localStorage.getItem('danetki_player_id');
  if (!id) {
    id = 'dp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('danetki_player_id', id);
  }
  return id;
}

export const danetkiPlayerId = getOrCreateDanetkiPlayerId();

export function getSavedDanetkiName() {
  return localStorage.getItem('danetki_player_name') || '';
}

export function saveDanetkiName(name) {
  if (name) {
    localStorage.setItem('danetki_player_name', name.trim());
  }
}

class DanetkiSocketAdapter {
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
          console.error(`Error in danetki listener for ${event}:`, e);
        }
      });
    }
  }

  _startListening(code) {
    if (this.currentRoomCode === code && this.unsubscribeRoom) return;
    this._stopListening();

    this.currentRoomCode = code;
    this.roomRef = ref(database, `danetki_rooms/${code}`);

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
    this.currentRoomCode = null;
    this.roomRef = null;
  }

  leaveRoom(isHost = false) {
    const code = this.currentRoomCode;
    const pId = danetkiPlayerId;
    this._stopListening();

    if (code) {
      if (isHost) {
        remove(ref(database, `danetki_rooms/${code}`)).catch(err => {
          console.error('Error removing danetki room:', err);
        });
      } else {
        remove(ref(database, `danetki_rooms/${code}/players/${pId}`)).catch(err => {
          console.error('Error removing player from danetki room:', err);
        });
      }
    }
    this.currentRoomCode = null;
    sessionStorage.removeItem('current_danetki_room_code');
  }

  _handleRoomUpdate(roomRaw) {
    if (!roomRaw) return;
    const playersList = roomRaw.players ? Object.values(roomRaw.players) : [];
    const myPlayer = roomRaw.players?.[danetkiPlayerId] || null;
    const isHost = myPlayer?.isHost || roomRaw.hostId === danetkiPlayerId;

    const game = roomRaw.game || {};
    let sanitizedDanetka = game.currentDanetka;

    // Скрываем ответ от обычных игроков, пока загадка не разгадана
    if (!isHost && game.status !== 'SOLVED' && sanitizedDanetka) {
      sanitizedDanetka = {
        id: sanitizedDanetka.id,
        title: sanitizedDanetka.title,
        question: sanitizedDanetka.question,
        category: sanitizedDanetka.category,
        difficulty: sanitizedDanetka.difficulty
      };
    }

    const roomData = {
      code: roomRaw.code,
      hostId: roomRaw.hostId,
      players: playersList,
      myPlayer,
      isHost,
      game: {
        ...game,
        currentDanetka: sanitizedDanetka
      }
    };

    this._trigger('room_update', roomData);
  }

  async emit(event, data = {}) {
    switch (event) {
      case 'create_room': {
        const code = generateRoomCode();
        const pName = data.playerName || 'Ведущий';
        saveDanetkiName(pName);

        const initialDanetka = getRandomDanetka('all', []);

        const newRoom = {
          code,
          hostId: danetkiPlayerId,
          createdAt: Date.now(),
          players: {
            [danetkiPlayerId]: {
              id: danetkiPlayerId,
              name: pName,
              avatar: getRandomAvatar(),
              isHost: true,
              handRaised: false
            }
          },
          game: {
            phase: 'PLAYING',
            status: 'IN_PROGRESS',
            currentDanetka: initialDanetka,
            category: 'all',
            questionsCount: 0,
            answersLog: [],
            solvedHistory: [initialDanetka.id],
            lastPing: null
          }
        };

        const targetRef = ref(database, `danetki_rooms/${code}`);
        this.currentRoomCode = code;
        this.roomRef = targetRef;
        this._handleRoomUpdate(newRoom);
        this._startListening(code);
        this._trigger('room_created', { roomCode: code });

        set(targetRef, newRoom).catch(err => {
          console.error('Firebase danetki room write error:', err);
        });
        break;
      }

      case 'join_room': {
        const code = String(data.roomCode).trim();
        const pName = data.playerName || 'Детектив';
        saveDanetkiName(pName);

        const roomRef = ref(database, `danetki_rooms/${code}`);
        const snap = await get(roomRef);

        if (!snap.exists()) {
          throw new Error(`Комната №${code} не найдена. Проверьте код!`);
        }

        const roomVal = snap.val();
        const existingPlayer = roomVal.players?.[danetkiPlayerId];
        const playerEntry = existingPlayer || {
          id: danetkiPlayerId,
          name: pName,
          avatar: getRandomAvatar(),
          isHost: false,
          handRaised: false
        };

        if (!roomVal.players) roomVal.players = {};
        roomVal.players[danetkiPlayerId] = playerEntry;

        this._handleRoomUpdate(roomVal);
        this._startListening(code);
        this._trigger('room_joined', { roomCode: code });

        update(ref(database, `danetki_rooms/${code}/players/${danetkiPlayerId}`), playerEntry).catch(err => {
          console.error('Firebase join danetki error:', err);
        });
        break;
      }

      case 'answer_question': {
        // Ведущий нажимает ДА / НЕТ / НЕ ИМЕЕТ ЗНАЧЕНИЯ
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        if (!snap.exists()) return;
        const room = snap.val();
        if (room.hostId !== danetkiPlayerId) return;

        const answerType = data.type; // 'yes' | 'no' | 'irrelevant'
        const answerLabel = answerType === 'yes' ? 'ДА' : answerType === 'no' ? 'НЕТ' : 'НЕ ИМЕЕТ ЗНАЧЕНИЯ';

        const currentLog = room.game?.answersLog || [];
        const nextCount = (room.game?.questionsCount || 0) + 1;

        const newLogEntry = {
          id: 'ans_' + Date.now(),
          number: nextCount,
          type: answerType,
          label: answerLabel,
          timestamp: Date.now()
        };

        const updatedLog = [newLogEntry, ...currentLog].slice(0, 50);

        await update(ref(database, `danetki_rooms/${this.currentRoomCode}/game`), {
          questionsCount: nextCount,
          answersLog: updatedLog
        });
        break;
      }

      case 'raise_hand': {
        // Игрок поднимает руку или жмет «Есть версия!»
        if (!this.roomRef) return;
        const pId = danetkiPlayerId;
        const snap = await get(ref(database, `danetki_rooms/${this.currentRoomCode}/players/${pId}`));
        if (!snap.exists()) return;
        const player = snap.val();
        const newRaised = !player.handRaised;

        await update(ref(database, `danetki_rooms/${this.currentRoomCode}/players/${pId}`), {
          handRaised: newRaised
        });

        if (newRaised) {
          await update(ref(database, `danetki_rooms/${this.currentRoomCode}/game`), {
            lastPing: {
              playerId: pId,
              playerName: player.name,
              type: data.pingType || 'question', // 'question' | 'version'
              timestamp: Date.now()
            }
          });
        }
        break;
      }

      case 'solve_danetka': {
        // Ведущий подтверждает, что загадка разгадана!
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        if (!snap.exists()) return;
        const room = snap.val();
        if (room.hostId !== danetkiPlayerId) return;

        await update(ref(database, `danetki_rooms/${this.currentRoomCode}/game`), {
          status: 'SOLVED'
        });
        break;
      }

      case 'next_danetka': {
        // Ведущий выбирает следующую загадку
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        if (!snap.exists()) return;
        const room = snap.val();
        if (room.hostId !== danetkiPlayerId) return;

        const history = room.game?.solvedHistory || [];
        const category = data.category || room.game?.category || 'all';
        const nextDanetka = getRandomDanetka(category, history);

        // Сбрасываем поднятые руки игроков
        const resetPlayers = {};
        Object.entries(room.players || {}).forEach(([id, p]) => {
          resetPlayers[id] = { ...p, handRaised: false };
        });

        await update(ref(database, `danetki_rooms/${this.currentRoomCode}`), {
          players: resetPlayers,
          'game/status': 'IN_PROGRESS',
          'game/currentDanetka': nextDanetka,
          'game/category': category,
          'game/questionsCount': 0,
          'game/answersLog': [],
          'game/solvedHistory': [...history, nextDanetka.id],
          'game/lastPing': null
        });
        break;
      }

      case 'pass_host': {
        // Передача роли ведущего другому игроку
        const targetId = data.targetPlayerId;
        if (!targetId || !this.roomRef) return;
        const snap = await get(this.roomRef);
        if (!snap.exists()) return;
        const room = snap.val();
        if (room.hostId !== danetkiPlayerId) return;

        const updatedPlayers = {};
        Object.entries(room.players || {}).forEach(([id, p]) => {
          updatedPlayers[id] = {
            ...p,
            isHost: id === targetId,
            handRaised: false
          };
        });

        await update(ref(database, `danetki_rooms/${this.currentRoomCode}`), {
          hostId: targetId,
          players: updatedPlayers
        });
        break;
      }

      default:
        console.warn(`Unknown danetki socket event: ${event}`);
    }
  }
}

export const danetkiSocket = new DanetkiSocketAdapter();
