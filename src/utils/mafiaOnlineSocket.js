// src/utils/mafiaOnlineSocket.js - Realtime Firebase Adapter для «Мафия Онлайн»
import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import { ROLES } from '../data/rolesData';

const MAFIA_AVATARS = ['🎩', '🕵️‍♂️', '🕵️‍♀️', '⭐️', '💊', '💋', '🪓', '⚖️', '🕊', '🕶️', '👤', '🍷'];

function getRandomAvatar() {
  return MAFIA_AVATARS[Math.floor(Math.random() * MAFIA_AVATARS.length)];
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOrCreateMafiaPlayerId() {
  let id = localStorage.getItem('mafia_online_player_id');
  if (!id) {
    id = 'mp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('mafia_online_player_id', id);
  }
  return id;
}

export const mafiaOnlinePlayerId = getOrCreateMafiaPlayerId();

export function getSavedMafiaPlayerName() {
  return localStorage.getItem('mafia_online_player_name') || '';
}

export function saveMafiaPlayerName(name) {
  if (name) {
    localStorage.setItem('mafia_online_player_name', name.trim());
  }
}

class MafiaOnlineSocketAdapter {
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
          console.error(`Error in mafia listener for ${event}:`, e);
        }
      });
    }
  }

  _startListening(code) {
    if (this.currentRoomCode === code && this.unsubscribeRoom) return;
    this._stopListening();

    this.currentRoomCode = code;
    this.roomRef = ref(database, `mafia_online_rooms/${code}`);

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

  leaveRoom(isHost = false) {
    const code = this.currentRoomCode;
    this._stopListening();

    if (code) {
      if (isHost) {
        remove(ref(database, `mafia_online_rooms/${code}`)).catch(e => {
          console.error('Error removing mafia room from Firebase:', e);
        });
      } else {
        remove(ref(database, `mafia_online_rooms/${code}/players/${mafiaOnlinePlayerId}`)).catch(e => {
          console.error('Error removing mafia player from Firebase:', e);
        });
      }
    }
  }

  _handleRoomUpdate(roomRaw) {
    const playersList = Object.values(roomRaw.players || {});
    const myPlayer = roomRaw.players?.[mafiaOnlinePlayerId] || null;
    const isHost = roomRaw.hostId === mafiaOnlinePlayerId;

    const fullRoomData = {
      code: roomRaw.code,
      hostId: roomRaw.hostId,
      hostName: roomRaw.hostName || 'Ведущий',
      isHost,
      myPlayer,
      players: playersList,
      game: roomRaw.game || {}
    };

    this._trigger('room_update', fullRoomData);
  }

  emit(event, data = {}) {
    this._handleClientAction(event, data).catch(err => {
      console.error(`Mafia online action error [${event}]:`, err);
      this._trigger('error_message', { message: err.message || 'Ошибка связи' });
    });
  }

  async _handleClientAction(event, data) {
    switch (event) {
      case 'create_room': {
        const code = generateRoomCode();
        const hostName = data.playerName || 'Ведущий';
        saveMafiaPlayerName(hostName);

        const newRoom = {
          code,
          hostId: mafiaOnlinePlayerId,
          hostName,
          createdAt: Date.now(),
          players: {
            // Ведущий тоже числится в комнате, но с флагом isHost: true
            [mafiaOnlinePlayerId]: {
              id: mafiaOnlinePlayerId,
              name: hostName,
              avatar: '🎩',
              isHost: true,
              roleId: null,
              roleName: null,
              faction: null,
              isAlive: true,
              fouls: 0
            }
          },
          game: {
            status: 'LOBBY', // 'LOBBY' | 'PLAYING'
            phase: 'setup',
            round: 1,
            settings: {
              noKillFirstNight: true,
              noKillDay1: true
            },
            nightResult: null,
            winner: null
          }
        };

        const targetRef = ref(database, `mafia_online_rooms/${code}`);
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
        saveMafiaPlayerName(pName);

        const roomRef = ref(database, `mafia_online_rooms/${code}`);
        const snap = await get(roomRef);

        if (!snap.exists()) {
          throw new Error(`Комната Мафии №${code} не найдена. Проверьте код!`);
        }

        const roomVal = snap.val();
        if (roomVal.game?.status !== 'LOBBY' && !roomVal.players?.[mafiaOnlinePlayerId]) {
          throw new Error('Игра в этой комнате уже началась!');
        }

        const existingPlayer = roomVal.players?.[mafiaOnlinePlayerId];
        const playerEntry = existingPlayer || {
          id: mafiaOnlinePlayerId,
          name: pName,
          avatar: getRandomAvatar(),
          isHost: false,
          roleId: null,
          roleName: null,
          faction: null,
          isAlive: true,
          fouls: 0
        };

        if (!roomVal.players) roomVal.players = {};
        roomVal.players[mafiaOnlinePlayerId] = playerEntry;

        this._handleRoomUpdate(roomVal);
        this._startListening(code);
        this._trigger('room_joined', { roomCode: code });

        update(ref(database, `mafia_online_rooms/${code}/players/${mafiaOnlinePlayerId}`), playerEntry).catch(err => {
          console.error('Firebase join error:', err);
        });
        break;
      }

      case 'reconnect_player': {
        const code = String(data.roomCode).trim();
        const roomRef = ref(database, `mafia_online_rooms/${code}`);
        const snap = await get(roomRef);

        if (!snap.exists()) {
          this._trigger('reconnect_failed', { message: 'Комната закрыта' });
          return;
        }

        this._startListening(code);
        break;
      }

      case 'start_online_game': {
        const code = this.currentRoomCode;
        if (!code) return;

        const { assignedPlayers, settings } = data; // Массив игроков с ролями
        const roomSnap = await get(ref(database, `mafia_online_rooms/${code}`));
        if (!roomSnap.exists()) return;

        const updatedPlayers = {};
        assignedPlayers.forEach(p => {
          updatedPlayers[p.id] = p;
        });

        // Также сохраняем ведущего
        updatedPlayers[mafiaOnlinePlayerId] = {
          id: mafiaOnlinePlayerId,
          name: roomSnap.val().hostName || 'Ведущий',
          avatar: '🎩',
          isHost: true,
          roleId: null,
          roleName: 'Ведущий',
          faction: null,
          isAlive: true,
          fouls: 0
        };

        await update(ref(database, `mafia_online_rooms/${code}`), {
          players: updatedPlayers,
          game: {
            status: 'PLAYING',
            phase: 'night',
            round: 1,
            settings: settings || {},
            nightResult: null,
            winner: null
          }
        });
        break;
      }

      case 'sync_host_game_state': {
        const code = this.currentRoomCode;
        if (!code) return;

        const { phase, round, nightResult, winner, players: updatedPlayerList } = data;
        const updates = {};

        if (phase !== undefined) updates['game/phase'] = phase;
        if (round !== undefined) updates['game/round'] = round;
        if (nightResult !== undefined) updates['game/nightResult'] = nightResult;
        if (winner !== undefined) updates['game/winner'] = winner;

        if (updatedPlayerList && Array.isArray(updatedPlayerList)) {
          updatedPlayerList.forEach(p => {
            if (p.id) {
              updates[`players/${p.id}/isAlive`] = p.isAlive;
              updates[`players/${p.id}/fouls`] = p.fouls;
            }
          });
        }

        await update(ref(database, `mafia_online_rooms/${code}`), updates);
        break;
      }

      case 'reset_to_lobby': {
        const code = this.currentRoomCode;
        if (!code) return;

        const roomSnap = await get(ref(database, `mafia_online_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        const resetPlayers = {};
        Object.values(room.players || {}).forEach(p => {
          resetPlayers[p.id] = {
            ...p,
            roleId: null,
            roleName: null,
            faction: null,
            isAlive: true,
            fouls: 0
          };
        });

        await update(ref(database, `mafia_online_rooms/${code}`), {
          players: resetPlayers,
          game: {
            status: 'LOBBY',
            phase: 'setup',
            round: 1,
            nightResult: null,
            winner: null
          }
        });
        break;
      }

      default:
        console.warn(`Unknown mafia online action: ${event}`);
    }
  }
}

export const mafiaOnlineSocket = new MafiaOnlineSocketAdapter();
