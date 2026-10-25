// server/games/trapwords.js - Игровой движок «Слова-мины»
import { getRandomWord } from '../words.js';

export class TrapwordsGame {
  constructor(room, onStateChange) {
    this.room = room;
    this.onStateChange = onStateChange;

    // Настройки
    this.targetScore = 3;       // Очков для победы
    this.trapCount = 5;         // Количество мин (3-7)
    this.trapTime = 45;         // Секунд на минирование
    this.explainTime = 60;      // Секунд на объяснение

    // Состояние
    this.phase = 'LOBBY';       // 'LOBBY' | 'SETTING_TRAPS' | 'EXPLAINING' | 'ROUND_RESULT' | 'GAME_OVER'
    this.round = 0;
    this.scores = { red: 0, blue: 0 };
    this.explainingTeam = 'blue'; // Чередуется каждый раунд: 'blue' <-> 'red'
    this.trappingTeam = 'red';
    this.speakerId = null;

    this.currentWordData = null; // { word, defaultTraps }
    this.traps = [];             // ['микрофон', 'песня', ...]
    this.triggeredTrap = null;   // Слово, на котором подорвались
    this.triggeredBy = null;     // Имя игрока, нажавшего кнопку мины

    this.roundResult = null;     // { outcome: 'GUESSED'|'TRAP_TRIGGERED'|'TIME_OUT', pointsTeam, message }
    this.usedWords = [];
    this.roundHistory = [];

    this.timer = 0;
    this.timerInterval = null;
  }

  // Обновление настроек перед стартом
  updateSettings({ targetScore, trapCount, trapTime, explainTime }) {
    if (this.phase !== 'LOBBY') return;
    if (targetScore) this.targetScore = Math.max(1, Math.min(10, Number(targetScore)));
    if (trapCount) this.trapCount = Math.max(2, Math.min(7, Number(trapCount)));
    if (trapTime) this.trapTime = Math.max(15, Math.min(120, Number(trapTime)));
    if (explainTime) this.explainTime = Math.max(20, Math.min(180, Number(explainTime)));
    this.notify();
  }

  // Старт всей игры
  startGame() {
    this.round = 0;
    this.scores = { red: 0, blue: 0 };
    this.usedWords = [];
    this.roundHistory = [];
    this.explainingTeam = Math.random() > 0.5 ? 'blue' : 'red';
    this.startNewRound();
  }

  // Переход к новому раунду
  startNewRound() {
    this.clearTimer();
    this.round += 1;
    this.trappingTeam = this.explainingTeam === 'blue' ? 'red' : 'blue';

    // Выбираем спикера для объясняющей команды
    const teamPlayers = this.room.getPlayersByTeam(this.explainingTeam);
    if (teamPlayers.length === 0) {
      // Если в команде пусто, берем любого
      const anyPlayer = this.room.getPlayers().find(p => p.team !== 'spectator');
      this.speakerId = anyPlayer ? anyPlayer.id : null;
    } else {
      // Ротация спикеров
      const speakerIndex = (this.round - 1) % teamPlayers.length;
      this.speakerId = teamPlayers[speakerIndex].id;
    }

    // Выбираем секретное слово
    this.currentWordData = getRandomWord(this.usedWords);
    this.usedWords.push(this.currentWordData.word);

    // Инициализируем пустые слоты под мины
    this.traps = new Array(this.trapCount).fill('');
    this.triggeredTrap = null;
    this.triggeredBy = null;
    this.roundResult = null;

    // Фаза расстановки мин
    this.phase = 'SETTING_TRAPS';
    this.timer = this.trapTime;

    this.timerInterval = setInterval(() => {
      this.timer -= 1;
      if (this.timer <= 0) {
        this.clearTimer();
        this.autoFillTrapsIfEmpty();
        this.startExplainingPhase();
      } else {
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  // Ручной выбор спикера
  setSpeaker(speakerId, requestingPlayer) {
    if (this.phase !== 'SETTING_TRAPS') return;
    const player = this.room.getPlayer(speakerId);
    if (!player || player.team !== this.explainingTeam) return;
    this.speakerId = speakerId;
    this.notify();
  }

  // Обновление слова-мины игроком минирующей команды
  setTrapWord(index, word, player) {
    if (this.phase !== 'SETTING_TRAPS') return;
    if (player.team !== this.trappingTeam) return;
    if (index < 0 || index >= this.trapCount) return;

    this.traps[index] = (word || '').trim().toLowerCase();
    this.notify();
  }

  // Подставить подсказку (одну или все)
  fillSuggestedTraps(player) {
    if (this.phase !== 'SETTING_TRAPS') return;
    if (player.team !== this.trappingTeam) return;

    const defaults = this.currentWordData?.defaultTraps || ['Слово1', 'Слово2', 'Слово3'];
    for (let i = 0; i < this.trapCount; i++) {
      if (!this.traps[i] && defaults[i]) {
        this.traps[i] = defaults[i].toLowerCase();
      }
    }
    this.notify();
  }

  // Автозаполнение пустых мин при истечении таймера
  autoFillTrapsIfEmpty() {
    const defaults = this.currentWordData?.defaultTraps || [];
    let defIdx = 0;
    for (let i = 0; i < this.trapCount; i++) {
      if (!this.traps[i]) {
        while (defIdx < defaults.length && this.traps.includes(defaults[defIdx].toLowerCase())) {
          defIdx++;
        }
        if (defIdx < defaults.length) {
          this.traps[i] = defaults[defIdx].toLowerCase();
          defIdx++;
        } else {
          this.traps[i] = `ловушка_${i + 1}`;
        }
      }
    }
  }

  // Минирующая команда нажимает "Готово! Поле заминировано"
  confirmTraps(player) {
    if (this.phase !== 'SETTING_TRAPS') return;
    if (player.team !== this.trappingTeam) return;

    this.clearTimer();
    this.autoFillTrapsIfEmpty();
    this.startExplainingPhase();
  }

  // Переход к фазе объяснения слова
  startExplainingPhase() {
    this.clearTimer();
    this.phase = 'EXPLAINING';
    this.timer = this.explainTime;

    this.timerInterval = setInterval(() => {
      this.timer -= 1;
      if (this.timer <= 0) {
        this.clearTimer();
        this.handleTimeout();
      } else {
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  // Соперник нажимает кнопку "БАХ! МИНА!"
  triggerTrap(trapIndex, player) {
    if (this.phase !== 'EXPLAINING') return;
    if (player.team !== this.trappingTeam) return;
    if (trapIndex < 0 || trapIndex >= this.traps.length) return;

    const hitWord = this.traps[trapIndex];
    if (!hitWord) return;

    this.clearTimer();
    this.triggeredTrap = hitWord;
    this.triggeredBy = player.name;

    // При подрыве на мине объясняющая команда получает 0 очков, а очко может получить минирующая
    // В каноничных словах-минах: подрыв = ход сгорел, очко не получено
    this.roundResult = {
      outcome: 'TRAP_TRIGGERED',
      hitWord: hitWord,
      triggeredBy: player.name,
      explainingTeam: this.explainingTeam,
      pointsTeam: null,
      message: `💥 БА-БАХ! Спикер произнес слово «${hitWord.toUpperCase()}»!`
    };

    this.finishRound();
  }

  // Спикер нажимает "УГАДАНО!"
  guessSuccess(player) {
    if (this.phase !== 'EXPLAINING') return;
    // Нажать может спикер или хост
    if (player.id !== this.speakerId && !player.isHost) return;

    this.clearTimer();
    // Очко объясняющей команде!
    this.scores[this.explainingTeam] += 1;

    this.roundResult = {
      outcome: 'GUESSED',
      hitWord: null,
      explainingTeam: this.explainingTeam,
      pointsTeam: this.explainingTeam,
      message: `🎉 УРА! Слово «${this.currentWordData.word.toUpperCase()}» успешно угадано без подрыва!`
    };

    this.finishRound();
  }

  // Спикер нажимает "Сдаемся"
  giveUp(player) {
    if (this.phase !== 'EXPLAINING') return;
    if (player.id !== this.speakerId && !player.isHost) return;

    this.clearTimer();
    this.roundResult = {
      outcome: 'GIVE_UP',
      hitWord: null,
      explainingTeam: this.explainingTeam,
      pointsTeam: null,
      message: `🏳️ Команда сдалась в этом раунде.`
    };

    this.finishRound();
  }

  // Тайм-аут
  handleTimeout() {
    this.roundResult = {
      outcome: 'TIME_OUT',
      hitWord: null,
      explainingTeam: this.explainingTeam,
      pointsTeam: null,
      message: `⏰ Время вышло! Слово не было угадано.`
    };

    this.finishRound();
  }

  // Завершение раунда: проверка победы или переход к показу итогов
  finishRound() {
    this.clearTimer();
    this.phase = 'ROUND_RESULT';

    this.roundHistory.push({
      round: this.round,
      word: this.currentWordData.word,
      traps: [...this.traps],
      result: this.roundResult,
      scoresAfter: { ...this.scores }
    });

    // Проверяем условие победы
    if (this.scores.blue >= this.targetScore || this.scores.red >= this.targetScore) {
      this.winner = this.scores.blue >= this.targetScore ? 'blue' : 'red';
      this.phase = 'GAME_OVER';
    }

    this.notify();
  }

  // Переход к следующему раунду по кнопке игрока/хоста
  nextRoundRequest() {
    if (this.phase !== 'ROUND_RESULT') return;
    // Меняем сторону объясняющей команды
    this.explainingTeam = this.explainingTeam === 'blue' ? 'red' : 'blue';
    this.startNewRound();
  }

  // Рестарт игры в лобби
  resetToLobby() {
    this.clearTimer();
    this.phase = 'LOBBY';
    this.round = 0;
    this.scores = { red: 0, blue: 0 };
    this.traps = [];
    this.triggeredTrap = null;
    this.roundResult = null;
    this.notify();
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  notify() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  // ==========================================
  // КЛЮЧЕВОЙ МЕТОД: Серверная маскировка данных!
  // ==========================================
  getMaskedState(playerId) {
    const player = this.room.getPlayer(playerId);
    const isPlayerTrapping = player && player.team === this.trappingTeam;
    const isSpeaker = player && player.id === this.speakerId;
    const isExplainingTeam = player && player.team === this.explainingTeam;

    // В фазах результатов и лобби видно всё
    const isRevealed = this.phase === 'ROUND_RESULT' || this.phase === 'GAME_OVER';

    let visibleWord = null;
    let visibleTraps = [];

    if (isRevealed) {
      visibleWord = this.currentWordData ? this.currentWordData.word : null;
      visibleTraps = this.traps;
    } else if (this.phase === 'SETTING_TRAPS') {
      // Минирующая команда видит слово и список мин
      if (isPlayerTrapping) {
        visibleWord = this.currentWordData ? this.currentWordData.word : null;
        visibleTraps = this.traps;
      } else {
        // Объясняющая команда не видит слово и не видит мины!
        visibleWord = null;
        visibleTraps = this.traps.map(t => (t ? '***' : ''));
      }
    } else if (this.phase === 'EXPLAINING') {
      if (isSpeaker) {
        // Спикер видит ТОЛЬКО слово, но НЕ мины!
        visibleWord = this.currentWordData ? this.currentWordData.word : null;
        visibleTraps = this.traps.map(() => '***');
      } else if (isPlayerTrapping) {
        // Минирующая команда видит слово и все мины, чтобы нажимать кнопки
        visibleWord = this.currentWordData ? this.currentWordData.word : null;
        visibleTraps = this.traps;
      } else if (isExplainingTeam) {
        // Отгадывающие сокомандники не видят слово и не видят мины
        visibleWord = null;
        visibleTraps = this.traps.map(() => '***');
      } else {
        // Зрители
        visibleWord = this.currentWordData ? this.currentWordData.word : null;
        visibleTraps = this.traps;
      }
    }

    const speakerPlayer = this.room.getPlayer(this.speakerId);

    return {
      gameType: 'trapwords',
      phase: this.phase,
      round: this.round,
      scores: this.scores,
      targetScore: this.targetScore,
      trapCount: this.trapCount,
      explainingTeam: this.explainingTeam,
      trappingTeam: this.trappingTeam,
      speakerId: this.speakerId,
      speakerName: speakerPlayer ? speakerPlayer.name : null,
      timer: this.timer,
      totalTimer: this.phase === 'SETTING_TRAPS' ? this.trapTime : this.explainTime,
      word: visibleWord,
      traps: visibleTraps,
      trapsFilledCount: this.traps.filter(Boolean).length,
      triggeredTrap: this.triggeredTrap,
      triggeredBy: this.triggeredBy,
      roundResult: this.roundResult,
      winner: this.winner || null,
      isMyTurnToExplain: isSpeaker,
      isMyTeamExplaining: isExplainingTeam,
      isMyTeamTrapping: isPlayerTrapping
    };
  }
}
