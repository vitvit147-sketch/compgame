// src/utils/deceptionSocket.js - Realtime Firebase Adapter для игры «Криминалист» (Deception: Murder in Hong Kong)
import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import {
  dealCardsToPlayers,
  selectInitialSceneTiles,
  assignDeceptionRoles
} from '../data/deceptionData';

const DECEPTION_AVATARS = ['🕵️‍♂️', '🕵️‍♀️', '👨‍🔬', '👩‍🔬', '🔍', '💼', '🩸', '⚖️', '🚔', '📜', '🕶️', '🕯️'];

function getRandomAvatar() {
  return DECEPTION_AVATARS[Math.floor(Math.random() * DECEPTION_AVATARS.length)];
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOrCreateDeceptionPlayerId() {
  let id = localStorage.getItem('deception_player_id');
  if (!id) {
    id = 'dp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('deception_player_id', id);
  }
  return id;
}

export const deceptionPlayerId = getOrCreateDeceptionPlayerId();

export function getSavedDeceptionName() {
  return localStorage.getItem('deception_player_name') || '';
}

export function saveDeceptionName(name) {
  if (name) {
    localStorage.setItem('deception_player_name', name.trim());
  }
}

class DeceptionSocketAdapter {
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
          console.error(`Error in deception listener for ${event}:`, e);
        }
      });
    }
  }

  _startListening(code) {
    if (this.currentRoomCode === code && this.unsubscribeRoom) return;
    this._stopListening();

    this.currentRoomCode = code;
    this.roomRef = ref(database, `deception_rooms/${code}`);

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

  // Публичный метод полного выхода из комнаты
  leaveRoom(isHost = false) {
    const code = this.currentRoomCode;
    this._stopListening();

    if (code) {
      if (isHost) {
        // Хост удаляет всю комнату
        remove(ref(database, `deception_rooms/${code}`)).catch(e => {
          console.error('Error removing deception room from Firebase:', e);
        });
      } else {
        // Обычный игрок удаляет свою запись
        remove(ref(database, `deception_rooms/${code}/players/${deceptionPlayerId}`)).catch(e => {
          console.error('Error removing deception player from Firebase:', e);
        });
      }
    }
  }

  _handleRoomUpdate(roomRaw) {
    const playersList = Object.values(roomRaw.players || {});
    const myPlayer = roomRaw.players?.[deceptionPlayerId] || null;
    const isHost = roomRaw.hostId === deceptionPlayerId;

    const fullRoomData = {
      code: roomRaw.code,
      hostId: roomRaw.hostId,
      isHost,
      myPlayer,
      players: playersList,
      game: roomRaw.game || {}
    };

    this._trigger('room_update', fullRoomData);
  }

  emit(event, data = {}) {
    this._handleClientAction(event, data).catch(err => {
      console.error(`Deception action error [${event}]:`, err);
      this._trigger('error_message', { message: err.message || 'Ошибка связи' });
    });
  }

  async _handleClientAction(event, data) {
    switch (event) {
      case 'create_room': {
        const code = generateRoomCode();
        const hostName = data.playerName || 'Детектив';
        saveDeceptionName(hostName);

        const newRoom = {
          code,
          hostId: deceptionPlayerId,
          createdAt: Date.now(),
          options: {
            enableAccomplice: false,
            enableWitness: false
          },
          players: {
            [deceptionPlayerId]: {
              id: deceptionPlayerId,
              name: hostName,
              avatar: getRandomAvatar(),
              isHost: true,
              role: null,
              team: null,
              badgeRemaining: 1,
              meansCards: [],
              clueCards: []
            }
          },
          game: {
            phase: 'LOBBY', // 'LOBBY' | 'NIGHT' | 'SCIENTIST_SETUP' | 'DISCUSSION' | 'WITNESS_GUESS' | 'GAME_OVER'
            round: 1,
            maxRounds: 3,
            solution: null, // { murdererId, meansId, clueId }
            activeTiles: [],
            unusedTiles: [],
            lastAccusation: null, // { accuserName, suspectName, meansTitle, clueTitle, isCorrect, timestamp }
            winner: null, // 'investigators' | 'murderer'
            winReason: ''
          }
        };

        const targetRef = ref(database, `deception_rooms/${code}`);
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
        const pName = data.playerName || 'Детектив';
        saveDeceptionName(pName);

        const roomRef = ref(database, `deception_rooms/${code}`);
        const snap = await get(roomRef);

        if (!snap.exists()) {
          throw new Error(`Комната №${code} не найдена. Проверьте код!`);
        }

        const roomVal = snap.val();
        if (roomVal.game?.phase !== 'LOBBY' && !roomVal.players?.[deceptionPlayerId]) {
          throw new Error('Игра в этой комнате уже началась!');
        }

        const existingPlayer = roomVal.players?.[deceptionPlayerId];
        const playerEntry = existingPlayer || {
          id: deceptionPlayerId,
          name: pName,
          avatar: getRandomAvatar(),
          isHost: false,
          role: null,
          team: null,
          badgeRemaining: 1,
          meansCards: [],
          clueCards: []
        };

        if (!roomVal.players) roomVal.players = {};
        roomVal.players[deceptionPlayerId] = playerEntry;

        this._handleRoomUpdate(roomVal);
        this._startListening(code);
        this._trigger('room_joined', { roomCode: code });

        update(ref(database, `deception_rooms/${code}/players/${deceptionPlayerId}`), playerEntry).catch(err => {
          console.error('Firebase join error:', err);
        });
        break;
      }

      case 'reconnect_player': {
        const code = String(data.roomCode).trim();
        const roomRef = ref(database, `deception_rooms/${code}`);
        const snap = await get(roomRef);

        if (!snap.exists()) {
          this._trigger('reconnect_failed', { message: 'Комната закрыта' });
          return;
        }

        this._startListening(code);
        break;
      }

      case 'toggle_room_option': {
        const code = this.currentRoomCode;
        if (!code) return;
        const { key, value } = data;
        await update(ref(database, `deception_rooms/${code}/options`), { [key]: value });
        break;
      }

      case 'start_game': {
        const code = this.currentRoomCode;
        if (!code) return;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();
        const playersList = Object.values(room.players || {});

        if (playersList.length < 4) {
          throw new Error('Для игры «Криминалист» требуется минимум 4 игрока!');
        }

        const options = room.options || {};
        const { roleMap, scientistId, murdererId } = assignDeceptionRoles(playersList, {
          enableAccomplice: options.enableAccomplice && playersList.length >= 5,
          enableWitness: options.enableWitness && playersList.length >= 5
        });

        // Раздаем карты
        const playerWithRoles = playersList.map(p => ({
          ...p,
          ...roleMap[p.id]
        }));
        const cardMap = dealCardsToPlayers(playerWithRoles);

        const updatedPlayers = {};
        playerWithRoles.forEach(p => {
          updatedPlayers[p.id] = {
            ...p,
            meansCards: cardMap[p.id]?.means || [],
            clueCards: cardMap[p.id]?.clues || []
          };
        });

        // Генерируем планшеты
        const { activeTiles, unusedTiles } = selectInitialSceneTiles();

        const updatedGame = {
          phase: 'NIGHT', // Ночь: убийца тайно выбирает карты
          round: 1,
          maxRounds: 3,
          scientistId,
          murdererId,
          solution: null,
          activeTiles,
          unusedTiles,
          lastAccusation: null,
          winner: null,
          winReason: ''
        };

        await update(ref(database, `deception_rooms/${code}`), {
          players: updatedPlayers,
          game: updatedGame
        });
        break;
      }

      case 'murderer_select_solution': {
        const code = this.currentRoomCode;
        if (!code) return;
        const { meansId, clueId } = data;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        // Проверяем, что выбирает именно убийца
        if (room.game?.murdererId !== deceptionPlayerId) {
          throw new Error('Только Убийца может выбрать орудие и улику!');
        }

        const murdererPlayer = room.players[deceptionPlayerId];
        const selectedMeans = murdererPlayer.meansCards?.find(m => m.id === meansId);
        const selectedClue = murdererPlayer.clueCards?.find(c => c.id === clueId);

        if (!selectedMeans || !selectedClue) {
          throw new Error('Выбранное орудие или улика не найдены в вашей руке!');
        }

        const solution = {
          murdererId: deceptionPlayerId,
          murdererName: murdererPlayer.name,
          meansId,
          meansTitle: selectedMeans.title,
          clueId,
          clueTitle: selectedClue.title
        };

        // Переходим к фазе расстановки меток криминалистом
        await update(ref(database, `deception_rooms/${code}/game`), {
          solution,
          phase: 'SCIENTIST_SETUP'
        });
        break;
      }

      case 'scientist_set_markers': {
        const code = this.currentRoomCode;
        if (!code) return;
        const { markers } = data; // { [tileId]: selectedOptionId }

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        if (room.game?.scientistId !== deceptionPlayerId) {
          throw new Error('Только Криминалист может выставить маркеры!');
        }

        const currentActiveTiles = room.game?.activeTiles || [];
        const updatedTiles = currentActiveTiles.map(tile => ({
          ...tile,
          selectedOptionId: markers[tile.id] !== undefined ? markers[tile.id] : (tile.selectedOptionId || null)
        }));

        await update(ref(database, `deception_rooms/${code}/game`), {
          activeTiles: updatedTiles,
          phase: 'DISCUSSION' // Открытое расследование начинается!
        });
        break;
      }

      case 'scientist_replace_tile': {
        const code = this.currentRoomCode;
        if (!code) return;
        const { oldTileId, newTileOptionId } = data;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        if (room.game?.scientistId !== deceptionPlayerId) {
          throw new Error('Только Криминалист может заменить планшет!');
        }

        const currentActiveTiles = [...(room.game?.activeTiles || [])];
        const currentUnusedTiles = [...(room.game?.unusedTiles || [])];

        if (currentUnusedTiles.length === 0) {
          throw new Error('В колоде больше нет доступных планшетов!');
        }

        // Находим старый планшет
        const tileIndex = currentActiveTiles.findIndex(t => t.id === oldTileId);
        if (tileIndex === -1 || currentActiveTiles[tileIndex].isFixed) {
          throw new Error('Нельзя заменить базовые планшеты!');
        }

        // Берем новый планшет из колоды
        const newTile = currentUnusedTiles.shift();
        newTile.selectedOptionId = newTileOptionId;

        currentActiveTiles[tileIndex] = newTile;

        await update(ref(database, `deception_rooms/${code}/game`), {
          activeTiles: currentActiveTiles,
          unusedTiles: currentUnusedTiles
        });
        break;
      }

      case 'make_accusation': {
        const code = this.currentRoomCode;
        if (!code) return;
        const { suspectId, meansId, clueId } = data;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        const accuser = room.players?.[deceptionPlayerId];
        if (!accuser || accuser.badgeRemaining < 1) {
          throw new Error('У вас больше нет жетона следователя для обвинения!');
        }

        const solution = room.game?.solution;
        if (!solution) throw new Error('Данные преступления не найдены!');

        const suspect = room.players?.[suspectId];
        const meansCard = suspect?.meansCards?.find(m => m.id === meansId);
        const clueCard = suspect?.clueCards?.find(c => c.id === clueId);

        const isCorrect = (
          suspectId === solution.murdererId &&
          meansId === solution.meansId &&
          clueId === solution.clueId
        );

        // Сжигаем жетон обвиняющего
        await update(ref(database, `deception_rooms/${code}/players/${deceptionPlayerId}`), {
          badgeRemaining: 0
        });

        const lastAccusation = {
          accuserName: accuser.name,
          suspectName: suspect?.name || 'Неизвестный',
          meansTitle: meansCard?.title || 'Орудие',
          clueTitle: clueCard?.title || 'Улика',
          isCorrect,
          timestamp: Date.now()
        };

        if (isCorrect) {
          // Проверяем, есть ли в игре свидетель
          const witnessPlayer = Object.values(room.players || {}).find(p => p.role === 'witness');
          if (witnessPlayer) {
            // Преступникам дается шанс угадать свидетеля!
            await update(ref(database, `deception_rooms/${code}/game`), {
              lastAccusation,
              phase: 'WITNESS_GUESS'
            });
          } else {
            // Мгновенная победа следователей
            await update(ref(database, `deception_rooms/${code}/game`), {
              lastAccusation,
              phase: 'GAME_OVER',
              winner: 'investigators',
              winReason: `Детектив ${accuser.name} раскрыл дело! Преступник: ${solution.murdererName}. Орудие: «${solution.meansTitle}», улика: «${solution.clueTitle}».`
            });
          }
        } else {
          // Неверное обвинение: проверяем, остались ли еще жетоны у честных следователей
          const allPlayers = Object.values(room.players || {});
          // Обновляем виртуально для проверки
          accuser.badgeRemaining = 0;
          const remainingBadges = allPlayers
            .filter(p => p.role !== 'scientist' && p.id !== deceptionPlayerId)
            .reduce((sum, p) => sum + (p.badgeRemaining || 0), 0);

          if (remainingBadges === 0) {
            // Жетоны кончились у всех — победа убийцы!
            await update(ref(database, `deception_rooms/${code}/game`), {
              lastAccusation,
              phase: 'GAME_OVER',
              winner: 'murderer',
              winReason: `У всех следователей сгорели жетоны обвинения! Убийца ${solution.murdererName} ушел от правосудия.`
            });
          } else {
            await update(ref(database, `deception_rooms/${code}/game`), {
              lastAccusation
            });
          }
        }
        break;
      }

      case 'murderer_guess_witness': {
        const code = this.currentRoomCode;
        if (!code) return;
        const { suspectWitnessId } = data;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        const witnessPlayer = Object.values(room.players || {}).find(p => p.role === 'witness');
        const solution = room.game?.solution;

        if (witnessPlayer && witnessPlayer.id === suspectWitnessId) {
          // Убийца угадал свидетеля и победил!
          await update(ref(database, `deception_rooms/${code}/game`), {
            phase: 'GAME_OVER',
            winner: 'murderer',
            winReason: `Убийца вычислил Свидетеля (${witnessPlayer.name}) и избавился от него! Победа преступников.`
          });
        } else {
          // Убийца ошибся — следователи побеждают!
          await update(ref(database, `deception_rooms/${code}/game`), {
            phase: 'GAME_OVER',
            winner: 'investigators',
            winReason: `Убийца не смог раскрыть Свидетеля! Торжество правосудия: победа команды Следователей.`
          });
        }
        break;
      }

      case 'next_round': {
        const code = this.currentRoomCode;
        if (!code) return;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        const currentRound = room.game?.round || 1;
        const solution = room.game?.solution;

        if (currentRound >= 3) {
          // Раунд 3 был последним — время вышло, победа убийцы
          await update(ref(database, `deception_rooms/${code}/game`), {
            phase: 'GAME_OVER',
            winner: 'murderer',
            winReason: `Истекли все 3 раунда следствия! Дело отправлено в архив, убийца ${solution?.murdererName || ''} остался безнаказанным.`
          });
        } else {
          // Переход к следующему раунду
          await update(ref(database, `deception_rooms/${code}/game`), {
            round: currentRound + 1
          });
        }
        break;
      }

      case 'reset_to_lobby': {
        const code = this.currentRoomCode;
        if (!code) return;

        const roomSnap = await get(ref(database, `deception_rooms/${code}`));
        if (!roomSnap.exists()) return;
        const room = roomSnap.val();

        const resetPlayers = {};
        Object.values(room.players || {}).forEach(p => {
          resetPlayers[p.id] = {
            ...p,
            role: null,
            team: null,
            badgeRemaining: 1,
            meansCards: [],
            clueCards: []
          };
        });

        await update(ref(database, `deception_rooms/${code}`), {
          players: resetPlayers,
          game: {
            phase: 'LOBBY',
            round: 1,
            maxRounds: 3,
            solution: null,
            activeTiles: [],
            unusedTiles: [],
            lastAccusation: null,
            winner: null,
            winReason: ''
          }
        });
        break;
      }

      default:
        console.warn(`Unknown deception action: ${event}`);
    }
  }
}

export const deceptionSocket = new DeceptionSocketAdapter();
