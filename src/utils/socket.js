// src/utils/socket.js - Полноценный адаптер сокетов на базе Firebase Realtime Database
import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import { WORDS_DATABASE, getRandomWord } from '../data/trapwordsWords';

const AVATARS = ['🦊', '🐼', '🦁', '🚀', '🍕', '🎩', '💎', '🦄', '🥑', '👾', '🔥', '⚡'];

function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem('party_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('party_player_id', id);
  }
  return id;
}

export const playerId = getOrCreatePlayerId();

export function getSavedPlayerName() {
  return localStorage.getItem('party_player_name') || '';
}

export function savePlayerName(name) {
  if (name) {
    localStorage.setItem('party_player_name', name.trim());
  }
}

// ----------------------------------------------------------------------------
// FIREBASE SOCKET ADAPTER
// ----------------------------------------------------------------------------
class FirebaseSocketAdapter {
  constructor() {
    this.listeners = new Map(); // event -> Set<callback>
    this.currentRoomCode = null;
    this.roomRef = null;
    this.unsubscribeRoom = null;
    this.timerInterval = null;
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
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // СЛУШАТЕЛЬ КОМНАТЫ В FIREBASE
  // --------------------------------------------------------------------------
  _startListeningToRoom(code) {
    if (this.currentRoomCode === code && this.unsubscribeRoom) return;

    this._stopListeningToRoom();
    this.currentRoomCode = code;
    this.roomRef = ref(database, `rooms/${code}`);

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

    // Таймер обратного отсчета для синхронизации
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this._tickTimer();
    }, 1000);
  }

  _stopListeningToRoom() {
    if (this.unsubscribeRoom) {
      this.unsubscribeRoom();
      this.unsubscribeRoom = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.currentRoomCode = null;
    this.roomRef = null;
  }

  // --------------------------------------------------------------------------
  // ОБРАБОТКА ОБНОВЛЕНИЯ КОМНАТЫ И МАСКИРОВКА ДАННЫХ
  // --------------------------------------------------------------------------
  _handleRoomUpdate(roomRaw) {
    const playersObj = roomRaw.players || {};
    const playersList = Object.values(playersObj);
    const myPlayer = playersObj[playerId] || {
      id: playerId,
      name: getSavedPlayerName() || 'Я',
      team: 'spectator',
      isHost: false
    };

    const isHost = roomRaw.hostId === playerId;
    const game = roomRaw.game || { phase: 'LOBBY' };

    // Вычисляем оставшийся таймер
    let currentTimer = game.timer || 0;
    if (game.timerEndsAt) {
      currentTimer = Math.max(0, Math.ceil((game.timerEndsAt - Date.now()) / 1000));
    }

    // Серверная маскировка: противники не должны видеть чужие мины
    const isPlayerTrapping = myPlayer.team === game.trappingTeam;
    const isSpeaker = myPlayer.id === game.speakerId;
    const isExplainingTeam = myPlayer.team === game.explainingTeam;
    const isRevealed = game.phase === 'ROUND_RESULT' || game.phase === 'GAME_OVER';

    let visibleWord = null;
    let visibleTraps = [];
    const actualTraps = game.traps || [];

    if (isRevealed) {
      visibleWord = game.word || null;
      visibleTraps = actualTraps;
    } else if (game.phase === 'SETTING_TRAPS') {
      if (isPlayerTrapping) {
        visibleWord = game.word || null;
        visibleTraps = actualTraps;
      } else {
        visibleWord = null;
        visibleTraps = actualTraps.map(t => (t ? '***' : ''));
      }
    } else if (game.phase === 'EXPLAINING') {
      if (isSpeaker) {
        visibleWord = game.word || null;
        visibleTraps = actualTraps.map(() => '***');
      } else if (isPlayerTrapping) {
        visibleWord = game.word || null;
        visibleTraps = actualTraps;
      } else {
        visibleWord = null;
        visibleTraps = actualTraps.map(() => '***');
      }
    }

    const speakerPlayer = playersObj[game.speakerId];

    const maskedGame = {
      ...game,
      timer: currentTimer,
      word: visibleWord,
      traps: visibleTraps,
      trapsFilledCount: actualTraps.filter(Boolean).length,
      speakerName: speakerPlayer ? speakerPlayer.name : null,
      isMyTurnToExplain: isSpeaker,
      isMyTeamExplaining: isExplainingTeam,
      isMyTeamTrapping: isPlayerTrapping
    };

    const roomData = {
      code: roomRaw.code,
      hostId: roomRaw.hostId,
      isHost,
      myPlayer,
      players: playersList,
      game: maskedGame
    };

    this._trigger('room_update', roomData);

    // Если время истекло и я хост, выполняем переход фазы
    if (isHost && game.timerEndsAt && currentTimer <= 0) {
      this._handleTimerExpired(roomRaw);
    }
  }

  _tickTimer() {
    if (!this.currentRoomCode) return;
    // Локальный тик для плавного обновления таймера в UI
    get(ref(database, `rooms/${this.currentRoomCode}`)).then(snapshot => {
      if (snapshot.exists()) {
        this._handleRoomUpdate(snapshot.val());
      }
    }).catch(() => {});
  }

  async _handleTimerExpired(roomRaw) {
    const game = roomRaw.game;
    if (!game || !game.timerEndsAt) return;

    // Сбрасываем timerEndsAt чтобы не вызывать повторно
    const code = roomRaw.code;
    const rRef = ref(database, `rooms/${code}/game`);

    if (game.phase === 'SETTING_TRAPS') {
      // Авто-заполнение пустых мин подсказками и старт объяснения
      const defaultTraps = game.defaultTraps || [];
      const currentTraps = [...(game.traps || [])];
      let defIdx = 0;
      for (let i = 0; i < (game.trapCount || 5); i++) {
        if (!currentTraps[i]) {
          while (defIdx < defaultTraps.length && currentTraps.includes(defaultTraps[defIdx])) {
            defIdx++;
          }
          currentTraps[i] = defaultTraps[defIdx++] || `Мина ${i + 1}`;
        }
      }

      await update(rRef, {
        phase: 'EXPLAINING',
        traps: currentTraps,
        timerEndsAt: Date.now() + (game.explainTime || 60) * 1000,
        totalTimer: game.explainTime || 60
      });
    } else if (game.phase === 'EXPLAINING') {
      // Время объяснения вышло: очко команде ловушек
      const scores = { ...(game.scores || { red: 0, blue: 0 }) };
      const trappingTeam = game.trappingTeam || 'red';
      scores[trappingTeam] = (scores[trappingTeam] || 0) + 1;

      const isGameOver = scores[trappingTeam] >= (game.targetScore || 3);

      await update(rRef, {
        phase: isGameOver ? 'GAME_OVER' : 'ROUND_RESULT',
        scores,
        timerEndsAt: null,
        winner: isGameOver ? trappingTeam : null,
        roundResult: {
          outcome: 'TIME_OUT',
          pointsTeam: trappingTeam,
          message: `Время вышло! Очко уходит команде ${trappingTeam === 'blue' ? 'Синих' : 'Красных'}.`
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // EMIT: ОБРАБОТКА КОМАНД ОТ КЛИЕНТА
  // --------------------------------------------------------------------------
  async emit(event, data = {}) {
    const { playerId: pId, playerName, roomCode, team, index, word, trapIndex } = data;

    // 1. Создание новой комнаты
    if (event === 'create_room') {
      const code = generateRoomCode();
      const pName = playerName || 'Игрок 1';

      const initialRoom = {
        code,
        createdAt: Date.now(),
        hostId: pId,
        players: {
          [pId]: {
            id: pId,
            name: pName,
            team: 'red',
            isHost: true,
            isOnline: true,
            avatar: getRandomAvatar()
          }
        },
        game: {
          phase: 'LOBBY',
          targetScore: 3,
          trapCount: 5,
          trapTime: 45,
          explainTime: 60,
          scores: { red: 0, blue: 0 },
          round: 0
        }
      };

      // Оптимистичный мгновенный переход
      this.currentRoomCode = code;
      this.roomRef = ref(database, `rooms/${code}`);
      this._handleRoomUpdate(initialRoom);
      this._startListeningToRoom(code);
      this._trigger('room_created', { roomCode: code, player: initialRoom.players[pId] });
      set(ref(database, `rooms/${code}`), initialRoom).catch(err => {
        console.error('Firebase room write error:', err);
      });
      return;
    }

    // 2. Вход в существующую комнату
    if (event === 'join_room') {
      const code = (roomCode || '').toString().trim();
      const snap = await get(ref(database, `rooms/${code}`));

      if (!snap.exists()) {
        this._trigger('error_message', { message: `Комната №${code} не найдена. Проверьте номер.` });
        return;
      }

      const roomData = snap.val();
      const playersObj = roomData.players || {};
      let player = playersObj[pId];

      if (!player) {
        // Балансировка команд
        const redCount = Object.values(playersObj).filter(p => p.team === 'red').length;
        const blueCount = Object.values(playersObj).filter(p => p.team === 'blue').length;
        const initialTeam = redCount <= blueCount ? 'red' : 'blue';

        player = {
          id: pId,
          name: playerName || `Игрок ${Object.keys(playersObj).length + 1}`,
          team: initialTeam,
          isHost: false,
          isOnline: true,
          avatar: getRandomAvatar()
        };
      } else {
        player.isOnline = true;
        if (playerName) player.name = playerName;
      }

      await set(ref(database, `rooms/${code}/players/${pId}`), player);
      this._startListeningToRoom(code);
      this._trigger('room_joined', { roomCode: code, player });
      return;
    }

    // 3. Переподключение
    if (event === 'reconnect_player') {
      const code = (roomCode || '').toString().trim();
      const snap = await get(ref(database, `rooms/${code}`));

      if (!snap.exists()) {
        this._trigger('reconnect_failed', { message: 'Комната больше не существует' });
        return;
      }

      const roomData = snap.val();
      const playersObj = roomData.players || {};
      const player = playersObj[pId];

      if (player) {
        await update(ref(database, `rooms/${code}/players/${pId}`), { isOnline: true });
        this._startListeningToRoom(code);
      } else {
        this._trigger('reconnect_failed', { message: 'Игрок не найден в комнате' });
      }
      return;
    }

    if (!this.currentRoomCode) return;
    const currentCode = this.currentRoomCode;

    // 4. Смена команды
    if (event === 'set_team') {
      await update(ref(database, `rooms/${currentCode}/players/${playerId}`), { team });
      return;
    }

    // 5. Перемешивание команд
    if (event === 'shuffle_teams') {
      const snap = await get(ref(database, `rooms/${currentCode}/players`));
      if (!snap.exists()) return;

      const playersObj = snap.val();
      const activePlayers = Object.values(playersObj).filter(p => p.team !== 'spectator');
      const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);

      const updates = {};
      shuffled.forEach((p, idx) => {
        updates[`rooms/${currentCode}/players/${p.id}/team`] = idx % 2 === 0 ? 'red' : 'blue';
      });

      await update(ref(database), updates);
      return;
    }

    // 6. Обновление настроек лобби
    if (event === 'update_settings') {
      await update(ref(database, `rooms/${currentCode}/game`), data);
      return;
    }

    // 7. Старт игры
    if (event === 'start_game') {
      const wordItem = getRandomWord([]);
      const explainingTeam = Math.random() > 0.5 ? 'blue' : 'red';
      const trappingTeam = explainingTeam === 'blue' ? 'red' : 'blue';

      const snap = await get(ref(database, `rooms/${currentCode}`));
      const room = snap.val();
      const players = Object.values(room.players || {});
      const expPlayers = players.filter(p => p.team === explainingTeam);
      const speakerId = expPlayers.length > 0 ? expPlayers[0].id : players[0]?.id || playerId;

      const trapCount = room.game?.trapCount || 5;
      const trapTime = room.game?.trapTime || 45;

      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: 'SETTING_TRAPS',
        round: 1,
        scores: { red: 0, blue: 0 },
        explainingTeam,
        trappingTeam,
        speakerId,
        word: wordItem.word,
        defaultTraps: wordItem.defaultTraps,
        traps: new Array(trapCount).fill(''),
        triggeredTrap: null,
        triggeredBy: null,
        roundResult: null,
        winner: null,
        timerEndsAt: Date.now() + trapTime * 1000,
        totalTimer: trapTime
      });
      return;
    }

    // 8. Назначение слова-мины
    if (event === 'set_trap_word') {
      await set(ref(database, `rooms/${currentCode}/game/traps/${index}`), (word || '').trim());
      return;
    }

    // 9. Заполнение подсказками
    if (event === 'fill_suggested_traps') {
      const snap = await get(ref(database, `rooms/${currentCode}/game`));
      if (!snap.exists()) return;
      const game = snap.val();

      const defaultTraps = game.defaultTraps || [];
      const currentTraps = [...(game.traps || [])];
      let dIdx = 0;
      for (let i = 0; i < (game.trapCount || 5); i++) {
        if (!currentTraps[i]) {
          while (dIdx < defaultTraps.length && currentTraps.includes(defaultTraps[dIdx])) {
            dIdx++;
          }
          currentTraps[i] = defaultTraps[dIdx++] || `Мина ${i + 1}`;
        }
      }

      await update(ref(database, `rooms/${currentCode}/game`), { traps: currentTraps });
      return;
    }

    // 10. Подтверждение расстановки мин
    if (event === 'confirm_traps') {
      const snap = await get(ref(database, `rooms/${currentCode}/game`));
      if (!snap.exists()) return;
      const game = snap.val();

      const explainTime = game.explainTime || 60;
      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: 'EXPLAINING',
        timerEndsAt: Date.now() + explainTime * 1000,
        totalTimer: explainTime
      });
      return;
    }

    // 11. Назначить себя спикером
    if (event === 'set_speaker') {
      await update(ref(database, `rooms/${currentCode}/game`), { speakerId: data.speakerId });
      return;
    }

    // 12. Нажатие на мину: «БАХ!»
    if (event === 'trigger_trap') {
      const snap = await get(ref(database, `rooms/${currentCode}`));
      if (!snap.exists()) return;
      const room = snap.val();
      const game = room.game;
      const players = room.players || {};

      const detonatedWord = (game.traps || [])[trapIndex] || 'Мина';
      const actor = players[playerId]?.name || 'Игрок команды ловушек';

      const scores = { ...(game.scores || { red: 0, blue: 0 }) };
      const trappingTeam = game.trappingTeam || 'red';
      scores[trappingTeam] = (scores[trappingTeam] || 0) + 1;

      const isGameOver = scores[trappingTeam] >= (game.targetScore || 3);

      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: isGameOver ? 'GAME_OVER' : 'ROUND_RESULT',
        scores,
        timerEndsAt: null,
        triggeredTrap: detonatedWord,
        triggeredBy: actor,
        winner: isGameOver ? trappingTeam : null,
        roundResult: {
          outcome: 'TRAP_TRIGGERED',
          pointsTeam: trappingTeam,
          message: `БАХ! ${actor} активировал мину «${detonatedWord}»! Очко уходит команде ${trappingTeam === 'blue' ? 'Синих' : 'Красных'}.`
        }
      });
      return;
    }

    // 13. Слово успешно угадано!
    if (event === 'guess_success') {
      const snap = await get(ref(database, `rooms/${currentCode}/game`));
      if (!snap.exists()) return;
      const game = snap.val();

      const scores = { ...(game.scores || { red: 0, blue: 0 }) };
      const explainingTeam = game.explainingTeam || 'blue';
      scores[explainingTeam] = (scores[explainingTeam] || 0) + 1;

      const isGameOver = scores[explainingTeam] >= (game.targetScore || 3);

      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: isGameOver ? 'GAME_OVER' : 'ROUND_RESULT',
        scores,
        timerEndsAt: null,
        winner: isGameOver ? explainingTeam : null,
        roundResult: {
          outcome: 'GUESSED',
          pointsTeam: explainingTeam,
          message: `Угадано! Команда ${explainingTeam === 'blue' ? 'Синих' : 'Красных'} обошла все мины и получает очко!`
        }
      });
      return;
    }

    // 14. Сдаться в раунде
    if (event === 'give_up') {
      const snap = await get(ref(database, `rooms/${currentCode}/game`));
      if (!snap.exists()) return;
      const game = snap.val();

      const scores = { ...(game.scores || { red: 0, blue: 0 }) };
      const trappingTeam = game.trappingTeam || 'red';
      scores[trappingTeam] = (scores[trappingTeam] || 0) + 1;

      const isGameOver = scores[trappingTeam] >= (game.targetScore || 3);

      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: isGameOver ? 'GAME_OVER' : 'ROUND_RESULT',
        scores,
        timerEndsAt: null,
        winner: isGameOver ? trappingTeam : null,
        roundResult: {
          outcome: 'GIVE_UP',
          pointsTeam: trappingTeam,
          message: `Команда сдалась! Очко уходит команде ${trappingTeam === 'blue' ? 'Синих' : 'Красных'}.`
        }
      });
      return;
    }

    // 15. Следующий раунд
    if (event === 'next_round') {
      const snap = await get(ref(database, `rooms/${currentCode}`));
      if (!snap.exists()) return;
      const room = snap.val();
      const game = room.game;
      const players = Object.values(room.players || {});

      const nextExplainingTeam = game.explainingTeam === 'blue' ? 'red' : 'blue';
      const nextTrappingTeam = nextExplainingTeam === 'blue' ? 'red' : 'blue';

      const expPlayers = players.filter(p => p.team === nextExplainingTeam);
      const nextRoundNum = (game.round || 1) + 1;
      const speakerIdx = (nextRoundNum - 1) % (expPlayers.length || 1);
      const speakerId = expPlayers[speakerIdx]?.id || players[0]?.id || playerId;

      const wordItem = getRandomWord([]);
      const trapCount = game.trapCount || 5;
      const trapTime = game.trapTime || 45;

      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: 'SETTING_TRAPS',
        round: nextRoundNum,
        explainingTeam: nextExplainingTeam,
        trappingTeam: nextTrappingTeam,
        speakerId,
        word: wordItem.word,
        defaultTraps: wordItem.defaultTraps,
        traps: new Array(trapCount).fill(''),
        triggeredTrap: null,
        triggeredBy: null,
        roundResult: null,
        timerEndsAt: Date.now() + trapTime * 1000,
        totalTimer: trapTime
      });
      return;
    }

    // 16. Возврат в лобби
    if (event === 'reset_to_lobby') {
      await update(ref(database, `rooms/${currentCode}/game`), {
        phase: 'LOBBY',
        round: 0,
        scores: { red: 0, blue: 0 },
        timerEndsAt: null,
        roundResult: null,
        winner: null
      });
      return;
    }
  }
}

export const socket = new FirebaseSocketAdapter();
