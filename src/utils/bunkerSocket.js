// src/utils/bunkerSocket.js - Realtime Firebase Adapter для игры «Бункер»
import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import {
  generateCharacter,
  generateUniqueCharacters,
  getRandomCatastrophe,
  getRandomBunkerRooms,
  getRandomThreats
} from '../data/bunkerData';

const BUNKER_AVATARS = ['🦺', '👨‍🔬', '👩‍🚀', '🥽', '🛠️', '🧬', '🔬', '🔦', '📻', '🛡️', '📦', '⚠️'];

function getRandomAvatar() {
  return BUNKER_AVATARS[Math.floor(Math.random() * BUNKER_AVATARS.length)];
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOrCreateBunkerPlayerId() {
  let id = localStorage.getItem('bunker_player_id');
  if (!id) {
    id = 'bp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('bunker_player_id', id);
  }
  return id;
}

export const bunkerPlayerId = getOrCreateBunkerPlayerId();

export function getSavedBunkerName() {
  return localStorage.getItem('bunker_player_name') || '';
}

export function saveBunkerName(name) {
  if (name) {
    localStorage.setItem('bunker_player_name', name.trim());
  }
}

class BunkerSocketAdapter {
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
          console.error(`Error in bunker listener for ${event}:`, e);
        }
      });
    }
  }

  _startListening(code) {
    if (this.currentRoomCode === code && this.unsubscribeRoom) return;
    this._stopListening();

    this.currentRoomCode = code;
    this.roomRef = ref(database, `bunker_rooms/${code}`);

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
    const pId = bunkerPlayerId;
    this._stopListening();

    if (code) {
      if (isHost) {
        // Хост закрывает и удаляет комнату для всех
        remove(ref(database, `bunker_rooms/${code}`)).catch(err => {
          console.error('Error removing bunker room:', err);
        });
      } else {
        // Обычный игрок покидает состав комнаты
        remove(ref(database, `bunker_rooms/${code}/players/${pId}`)).catch(err => {
          console.error('Error removing player from bunker room:', err);
        });
      }
    }
  }

  _handleRoomUpdate(roomRaw) {
    const playersObj = roomRaw.players || {};
    const playersList = Object.values(playersObj);
    const myPlayer = playersObj[bunkerPlayerId] || {
      id: bunkerPlayerId,
      name: getSavedBunkerName() || 'Выживший',
      isHost: false,
      avatar: '🦺',
      character: null,
      status: 'alive'
    };

    const isHost = roomRaw.hostId === bunkerPlayerId;
    const game = roomRaw.game || { phase: 'LOBBY' };

    const roomData = {
      code: roomRaw.code,
      hostId: roomRaw.hostId,
      isHost,
      myPlayer,
      players: playersList,
      game
    };

    this._trigger('room_update', roomData);
  }

  emit(event, data = {}) {
    this._handleClientAction(event, data).catch(err => {
      console.error(`Bunker action error [${event}]:`, err);
      this._trigger('error_message', { message: err.message || 'Ошибка связи' });
    });
  }

  async _handleClientAction(event, data) {
    switch (event) {
      case 'create_room': {
        const code = generateRoomCode();
        const hostName = data.playerName || 'Хост';
        saveBunkerName(hostName);

        const newRoom = {
          code,
          hostId: bunkerPlayerId,
          createdAt: Date.now(),
          players: {
            [bunkerPlayerId]: {
              id: bunkerPlayerId,
              name: hostName,
              avatar: getRandomAvatar(),
              isHost: true,
              status: 'alive',
              character: null,
              votedFor: null
            }
          },
          game: {
            phase: 'LOBBY',
            round: 1,
            maxRounds: 5,
            disaster: null,
            bunkerRooms: [],
            threats: [],
            speakerSeconds: 45,
            activeSpeakerId: null,
            exiledCount: 0,
            shelterCapacity: 0
          }
        };

        const targetRef = ref(database, `bunker_rooms/${code}`);
        // Мгновенный оптимистичный переход в UI (0 мс задержки)
        this.currentRoomCode = code;
        this.roomRef = targetRef;
        this._handleRoomUpdate(newRoom);
        this._startListening(code);
        this._trigger('room_created', { roomCode: code });
        set(targetRef, newRoom).catch(err => {
          console.error('Firebase room write error:', err);
        });
        break;
      }

      case 'join_room': {
        const code = String(data.roomCode).trim();
        const pName = data.playerName || 'Игрок';
        saveBunkerName(pName);

        const roomRef = ref(database, `bunker_rooms/${code}`);
        const snap = await get(roomRef);

        if (!snap.exists()) {
          throw new Error(`Комната №${code} не найдена. Проверьте код!`);
        }

        const roomVal = snap.val();
        if (roomVal.game?.phase !== 'LOBBY' && !roomVal.players?.[bunkerPlayerId]) {
          throw new Error('Игра в этой комнате уже началась!');
        }

        const existingPlayer = roomVal.players?.[bunkerPlayerId];
        const playerEntry = existingPlayer || {
          id: bunkerPlayerId,
          name: pName,
          avatar: getRandomAvatar(),
          isHost: false,
          status: 'alive',
          character: null,
          votedFor: null
        };

        if (!roomVal.players) roomVal.players = {};
        roomVal.players[bunkerPlayerId] = playerEntry;

        // Мгновенный переход в комнату для игрока
        this._handleRoomUpdate(roomVal);
        this._startListening(code);
        this._trigger('room_joined', { roomCode: code });

        // Сохраняем игрока в Firebase в фоне
        update(ref(database, `bunker_rooms/${code}/players/${bunkerPlayerId}`), playerEntry).catch(err => {
          console.error('Firebase join error:', err);
        });
        break;
      }

      case 'reconnect_player': {
        const code = String(data.roomCode).trim();
        const snap = await get(ref(database, `bunker_rooms/${code}`));
        if (snap.exists()) {
          this._startListening(code);
        } else {
          this._trigger('reconnect_failed', { message: 'Сессия истекла' });
        }
        break;
      }

      case 'start_game': {
        if (!this.currentRoomCode) return;
        const snap = await get(this.roomRef);
        if (!snap.exists()) return;
        const room = snap.val();
        const players = Object.values(room.players || {});
        if (players.length < 3) {
          throw new Error('Для игры в Бункер нужно минимум 3 игрока!');
        }

        // Вместимость бункера = половина игроков (округление вверх или вниз в зависимости от настроек)
        const shelterCapacity = Math.max(1, Math.floor(players.length / 2));
        const disaster = getRandomCatastrophe();
        const bunkerRooms = getRandomBunkerRooms(5);
        const threats = getRandomThreats(2);

        // Каждому игроку генерируем уникальные карточки персонажа (без повторов в комнате!)
        const updatedPlayers = {};
        const uniqueChars = generateUniqueCharacters(players.length);
        players.forEach((p, idx) => {
          updatedPlayers[p.id] = {
            ...p,
            status: 'alive',
            votedFor: null,
            character: uniqueChars[idx]
          };
        });

        const initialGame = {
          phase: 'CATASTROPHE',
          round: 1,
          maxRounds: 5,
          disaster,
          bunkerRooms,
          threats,
          shelterCapacity,
          speakerSeconds: data.speakerSeconds || 45,
          activeSpeakerId: players[0].id,
          exiledCount: 0,
          votesRevealed: false
        };

        await update(this.roomRef, {
          players: updatedPlayers,
          game: initialGame
        });
        break;
      }

      case 'proceed_to_investigation': {
        // Переход от экрана катастрофы к первому раунду раскрытия карт
        if (!this.roomRef) return;
        await update(ref(database, `bunker_rooms/${this.currentRoomCode}/game`), {
          phase: 'ROUND_DISCUSS'
        });
        break;
      }

      case 'reveal_card': {
        // Игрок вскрывает свою карту перед всеми: { cardKey: 'profession' | 'biology' | 'health' | 'hobby' | 'baggage' | 'fact' }
        const cardKey = data.cardKey;
        if (!cardKey || !this.currentRoomCode) return;

        const path = `bunker_rooms/${this.currentRoomCode}/players/${bunkerPlayerId}/character/${cardKey}/revealed`;
        await set(ref(database, path), true);
        break;
      }

      case 'set_active_speaker': {
        if (!this.roomRef) return;
        await update(ref(database, `bunker_rooms/${this.currentRoomCode}/game`), {
          activeSpeakerId: data.speakerId
        });
        break;
      }

      case 'start_voting': {
        // Ведущий открывает голосование
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        const room = snap.val();
        const players = Object.values(room.players || {});

        // Очищаем предыдущие голоса
        const updates = {};
        players.forEach(p => {
          updates[`players/${p.id}/votedFor`] = null;
        });
        updates['game/phase'] = 'VOTING';
        updates['game/votesRevealed'] = false;

        await update(this.roomRef, updates);
        break;
      }

      case 'cast_vote': {
        // Игрок отправляет свой голос за кандидата: { candidateId }
        if (!this.roomRef) return;
        await update(ref(database, `bunker_rooms/${this.currentRoomCode}/players/${bunkerPlayerId}`), {
          votedFor: data.candidateId
        });
        break;
      }

      case 'finish_voting': {
        // Подсчет голосов и изгнание
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        const room = snap.val();
        const players = Object.values(room.players || {});

        // Считаем голоса
        const counts = {};
        players.forEach(p => {
          if (p.votedFor) {
            counts[p.votedFor] = (counts[p.votedFor] || 0) + 1;
          }
        });

        // Ищем игрока с максимумом голосов
        let maxVotes = -1;
        let exiledId = null;
        Object.entries(counts).forEach(([cId, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            exiledId = cId;
          }
        });

        const updates = {
          'game/phase': 'VOTE_RESULT',
          'game/votesRevealed': true,
          'game/lastVoteCounts': counts,
          'game/lastExiledId': exiledId
        };

        if (exiledId && room.players[exiledId]) {
          updates[`players/${exiledId}/status`] = 'exiled';
          updates['game/exiledCount'] = (room.game?.exiledCount || 0) + 1;
        }

        await update(this.roomRef, updates);
        break;
      }

      case 'next_round': {
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        const room = snap.val();
        const currentRound = room.game?.round || 1;
        const players = Object.values(room.players || {});
        const alivePlayers = players.filter(p => p.status === 'alive');
        const capacity = room.game?.shelterCapacity || 3;

        // Если число оставшихся живых достигло лимита бункера -> ФИНАЛ!
        if (alivePlayers.length <= capacity || currentRound >= 5) {
          // Помечаем всех выживших как in_bunker
          const finalUpdates = {
            'game/phase': 'FINALE'
          };
          alivePlayers.forEach(p => {
            finalUpdates[`players/${p.id}/status`] = 'in_bunker';
          });
          await update(this.roomRef, finalUpdates);
        } else {
          // Иначе следующий раунд обсуждения
          await update(this.roomRef, {
            'game/phase': 'ROUND_DISCUSS',
            'game/round': currentRound + 1,
            'game/votesRevealed': false,
            'game/lastExiledId': null
          });
        }
        break;
      }

      case 'reset_to_lobby': {
        if (!this.roomRef) return;
        const snap = await get(this.roomRef);
        const room = snap.val();
        const players = Object.values(room.players || {});

        const resetPlayers = {};
        players.forEach(p => {
          resetPlayers[p.id] = {
            ...p,
            status: 'alive',
            character: null,
            votedFor: null
          };
        });

        await update(this.roomRef, {
          players: resetPlayers,
          game: {
            phase: 'LOBBY',
            round: 1,
            maxRounds: 5,
            disaster: null,
            bunkerRooms: [],
            threats: [],
            shelterCapacity: 0,
            exiledCount: 0
          }
        });
        break;
      }

      case 'leave_room': {
        this.leaveRoom(false);
        break;
      }

      case 'close_room': {
        this.leaveRoom(true);
        break;
      }

      default:
        console.warn(`Unknown bunker event: ${event}`);
    }
  }
}

export const bunkerSocket = new BunkerSocketAdapter();
