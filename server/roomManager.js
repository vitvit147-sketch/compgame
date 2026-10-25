// server/roomManager.js - Управление игровыми комнатами и столами
import { TrapwordsGame } from './games/trapwords.js';

const AVATARS = ['🦊', '🐼', '🦁', '🚀', '🍕', '🎩', '💎', '🦄', '🥑', '👾', '🔥', '⚡'];

function generateRoomCode() {
  // Простой 4-значный номер комнаты от 1000 до 9999
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export class Room {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.hostId = null;
    this.players = new Map(); // playerId -> Player
    this.selectedGame = 'trapwords';
    this.createdAt = Date.now();
    this.lastActivity = Date.now();

    // Создаем экземпляр игры «Слова-мины»
    this.game = new TrapwordsGame(this, () => this.broadcastState());
  }

  touch() {
    this.lastActivity = Date.now();
  }

  addPlayer(id, name, socketId, isHost = false) {
    this.touch();
    if (isHost || this.players.size === 0) {
      this.hostId = id;
    }

    // Автоматическое распределение по командам при входе для баланса
    const redCount = this.getPlayersByTeam('red').length;
    const blueCount = this.getPlayersByTeam('blue').length;
    const initialTeam = redCount <= blueCount ? 'red' : 'blue';

    const player = {
      id,
      name: name || `Игрок ${this.players.size + 1}`,
      socketId,
      team: initialTeam,
      isHost: this.hostId === id,
      isOnline: true,
      avatar: getRandomAvatar()
    };

    this.players.set(id, player);
    return player;
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  getPlayerBySocketId(socketId) {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) return player;
    }
    return null;
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getPlayersByTeam(team) {
    return this.getPlayers().filter(p => p.team === team);
  }

  setPlayerTeam(id, team) {
    this.touch();
    const player = this.players.get(id);
    if (!player) return;
    if (['red', 'blue', 'spectator'].includes(team)) {
      player.team = team;
      this.broadcastState();
    }
  }

  shuffleTeams() {
    this.touch();
    const active = this.getPlayers().filter(p => p.team !== 'spectator');
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    shuffled.forEach((p, idx) => {
      p.team = idx % 2 === 0 ? 'red' : 'blue';
    });
    this.broadcastState();
  }

  setPlayerOnline(id, isOnline, newSocketId = null) {
    this.touch();
    const player = this.players.get(id);
    if (player) {
      player.isOnline = isOnline;
      if (newSocketId) player.socketId = newSocketId;
      this.broadcastState();
    }
  }

  removePlayer(id) {
    this.touch();
    const player = this.players.get(id);
    if (!player) return;

    this.players.delete(id);

    // Если вышел хост, назначаем нового
    if (this.hostId === id && this.players.size > 0) {
      const nextHost = this.getPlayers()[0];
      this.hostId = nextHost.id;
      nextHost.isHost = true;
    }

    this.broadcastState();
  }

  // Рассылка персонализированного состояния каждому игроку
  broadcastState() {
    this.touch();
    for (const player of this.players.values()) {
      if (player.socketId && player.isOnline) {
        const maskedGameState = this.game.getMaskedState(player.id);
        const roomData = {
          code: this.code,
          hostId: this.hostId,
          isHost: player.id === this.hostId,
          myPlayer: player,
          players: this.getPlayers().map(p => ({
            id: p.id,
            name: p.name,
            team: p.team,
            isHost: p.isHost,
            isOnline: p.isOnline,
            avatar: p.avatar
          })),
          game: maskedGameState
        };
        this.io.to(player.socketId).emit('room_update', roomData);
      }
    }
  }
}

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // code -> Room

    // Очистка неактивных комнат каждые 30 минут
    setInterval(() => this.cleanupInactiveRooms(), 30 * 60 * 1000);
  }

  createRoom() {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const room = new Room(code, this.io);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toString().trim());
  }

  cleanupInactiveRooms() {
    const now = Date.now();
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivity > FOUR_HOURS) {
        room.game.clearTimer();
        this.rooms.delete(code);
      }
    }
  }
}
