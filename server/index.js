// server/index.js - Главный сервер Party Games Hub
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsActive: roomManager.rooms.size,
    timestamp: Date.now()
  });
});

// Обработка сокетов
io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentPlayerId = null;

  // 1. Создание комнаты
  socket.on('create_room', ({ playerName, playerId }) => {
    const room = roomManager.createRoom();
    currentRoomCode = room.code;
    currentPlayerId = playerId;

    const player = room.addPlayer(playerId, playerName, socket.id, true);
    socket.join(room.code);

    socket.emit('room_created', { roomCode: room.code, player });
    room.broadcastState();
  });

  // 2. Вход в существующую комнату по коду
  socket.on('join_room', ({ roomCode, playerName, playerId }) => {
    const code = (roomCode || '').toString().trim();
    const room = roomManager.getRoom(code);

    if (!room) {
      socket.emit('error_message', { message: `Комната №${code} не найдена. Проверьте номер.` });
      return;
    }

    currentRoomCode = room.code;
    currentPlayerId = playerId;

    // Проверяем, был ли уже этот игрок (переподключение)
    let player = room.getPlayer(playerId);
    if (player) {
      room.setPlayerOnline(playerId, true, socket.id);
      if (playerName) player.name = playerName;
    } else {
      player = room.addPlayer(playerId, playerName, socket.id, false);
    }

    socket.join(room.code);
    socket.emit('room_joined', { roomCode: room.code, player });
    room.broadcastState();
  });

  // 3. Автоматическое переподключение (при перезагрузке мобильного браузера)
  socket.on('reconnect_player', ({ roomCode, playerId }) => {
    const code = (roomCode || '').toString().trim();
    const room = roomManager.getRoom(code);
    if (!room) {
      socket.emit('reconnect_failed', { message: 'Комната больше не существует' });
      return;
    }

    const player = room.getPlayer(playerId);
    if (!player) {
      socket.emit('reconnect_failed', { message: 'Игрок не найден в комнате' });
      return;
    }

    currentRoomCode = room.code;
    currentPlayerId = playerId;
    room.setPlayerOnline(playerId, true, socket.id);
    socket.join(room.code);
    room.broadcastState();
  });

  // 4. Смена команды (красные / синие / зрители)
  socket.on('set_team', ({ team }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      room.setPlayerTeam(currentPlayerId, team);
    }
  });

  // 5. Перемешать команды
  socket.on('shuffle_teams', () => {
    if (!currentRoomCode) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      room.shuffleTeams();
    }
  });

  // 6. Настройки игры
  socket.on('update_settings', (settings) => {
    if (!currentRoomCode) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      room.game.updateSettings(settings);
    }
  });

  // 7. Старт игры
  socket.on('start_game', () => {
    if (!currentRoomCode) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      room.game.startGame();
    }
  });

  // 8. Назначение спикера (в фазе SETTING_TRAPS)
  socket.on('set_speaker', ({ speakerId }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.setSpeaker(speakerId, player);
    }
  });

  // 9. Ввод слова-мины
  socket.on('set_trap_word', ({ index, word }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.setTrapWord(index, word, player);
    }
  });

  // 10. Заполнить мины подсказками
  socket.on('fill_suggested_traps', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.fillSuggestedTraps(player);
    }
  });

  // 11. Подтверждение расстановки мин
  socket.on('confirm_traps', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.confirmTraps(player);
    }
  });

  // 12. Активация мины соперником (БА-БАХ!)
  socket.on('trigger_trap', ({ trapIndex }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.triggerTrap(trapIndex, player);
    }
  });

  // 13. Спикер отметил "УГАДАНО!"
  socket.on('guess_success', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.guessSuccess(player);
    }
  });

  // 14. Спикер сдался
  socket.on('give_up', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      const player = room.getPlayer(currentPlayerId);
      room.game.giveUp(player);
    }
  });

  // 15. Следующий раунд
  socket.on('next_round', () => {
    if (!currentRoomCode) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      room.game.nextRoundRequest();
    }
  });

  // 16. Возврат в лобби
  socket.on('reset_to_lobby', () => {
    if (!currentRoomCode) return;
    const room = roomManager.getRoom(currentRoomCode);
    if (room) {
      room.game.resetToLobby();
    }
  });

  // Отключение сокета
  socket.on('disconnect', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = roomManager.getRoom(currentRoomCode);
      if (room) {
        room.setPlayerOnline(currentPlayerId, false);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Сервер Party Games запущен на порту ${PORT}`);
  console.log(`👉 Локальный доступ: http://localhost:${PORT}`);
});
