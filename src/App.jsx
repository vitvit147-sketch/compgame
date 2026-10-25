import React, { useState, useEffect } from 'react';
import { socket, playerId } from './utils/socket';
import SpyGame from './components/spy/SpyGame';
import HomeScreen from './components/trapwords/HomeScreen';
import LobbyScreen from './components/trapwords/LobbyScreen';
import SettingTrapsScreen from './components/trapwords/SettingTrapsScreen';
import ExplainingScreen from './components/trapwords/ExplainingScreen';
import RoundResultScreen from './components/trapwords/RoundResultScreen';
import GameOverScreen from './components/trapwords/GameOverScreen';

// Компоненты Мафии для ведущего
import { Navbar } from './components/Navbar';
import { SetupScreen } from './components/SetupScreen';
import DealingPhase from './components/DealingPhase';
import { NightPhase } from './components/NightPhase';
import { MorningSummary } from './components/MorningSummary';
import { DayPhase } from './components/DayPhase';
import { RulesModal } from './components/RulesModal';
import { GameLogModal } from './components/GameLogModal';
import { VictoryModal } from './components/VictoryModal';
import { resolveNight, checkWinCondition } from './utils/gameEngine';
import { ArrowLeft, Sparkles, Shield, Bomb } from 'lucide-react';
import './App.css';

export function App() {
  // 'menu' (Хаб игр) | 'spy' (Шпион на 1 телефоне) | 'party' (Слова-мины онлайн) | 'mafia' (Пульт ведущего)
  const [appMode, setAppMode] = useState('menu');
  const [roomData, setRoomData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ ОНЛАЙН СТОЛОВ («Слова-мины»)
  // -------------------------------------------------------------
  useEffect(() => {
    const onRoomCreated = ({ roomCode }) => {
      sessionStorage.setItem('current_room_code', roomCode);
      setErrorMessage('');
    };

    const onRoomJoined = ({ roomCode }) => {
      sessionStorage.setItem('current_room_code', roomCode);
      setErrorMessage('');
    };

    const onRoomUpdate = (data) => {
      setRoomData(data);
      if (data?.code) {
        sessionStorage.setItem('current_room_code', data.code);
      }
    };

    const onError = ({ message }) => {
      setErrorMessage(message);
    };

    const onReconnectFailed = () => {
      sessionStorage.removeItem('current_room_code');
      setRoomData(null);
    };

    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_update', onRoomUpdate);
    socket.on('error_message', onError);
    socket.on('reconnect_failed', onReconnectFailed);

    const savedRoomCode = sessionStorage.getItem('current_room_code');
    if (savedRoomCode) {
      socket.emit('reconnect_player', { roomCode: savedRoomCode, playerId });
    }

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_update', onRoomUpdate);
      socket.off('error_message', onError);
      socket.off('reconnect_failed', onReconnectFailed);
    };
  }, []);

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('current_room_code');
    setRoomData(null);
    setErrorMessage('');
  };

  // -------------------------------------------------------------
  // ЛОГИКА ОФФЛАЙН МАФИИ ДЛЯ ВЕДУЩЕГО
  // -------------------------------------------------------------
  const [gameState, setGameState] = useState({ phase: 'setup', round: 1 });
  const [players, setPlayers] = useState([]);
  const [nightResult, setNightResult] = useState(null);
  const [lastNightActions, setLastNightActions] = useState({});
  const [gameLogs, setGameLogs] = useState([]);
  const [victoryInfo, setVictoryInfo] = useState(null);
  const [gameSettings, setGameSettings] = useState({
    noKillFirstNight: true,
    noKillDay1: true
  });
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const addLog = (phase, text) => {
    setGameLogs(prev => [{ phase, text, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleStartGame = (initialPlayers, settings = {}) => {
    setPlayers(initialPlayers);
    setGameSettings(settings);
    if (settings.passAndPlayDealing) {
      setGameState({ phase: 'dealing', round: 1 });
      addLog('Раздача ролей', `Игроки по очереди смотрят свои роли (Pass & Play).`);
    } else {
      setGameState({ phase: 'night', round: 1 });
      addLog('Начало игры', `Партия началась! Участников: ${initialPlayers.length}.`);
    }
  };

  const handleDealingComplete = () => {
    setGameState({ phase: 'night', round: 1 });
    addLog('Ночь #1', `Все роли розданы. Город засыпает...`);
  };

  const handleFinishNight = (nightActions) => {
    setLastNightActions(nightActions);
    const result = resolveNight(players, nightActions);
    setPlayers(result.updatedPlayers);
    setNightResult(result);
    setGameState(prev => ({ ...prev, phase: 'morning' }));
    result.logs.forEach(logText => addLog(`Ночь #${gameState.round}`, logText));
    const win = checkWinCondition(result.updatedPlayers);
    if (win) {
      setVictoryInfo(win);
      addLog('Финал игры', `${win.title} — ${win.reason}`);
    }
  };

  const handleProceedToDay = () => {
    const win = checkWinCondition(players);
    if (win) {
      setVictoryInfo(win);
      return;
    }
    setGameState(prev => ({ ...prev, phase: 'day' }));
    addLog(`День #${gameState.round}`, 'Город проснулся. Начало обсуждения и голосования.');
  };

  const handleFinishDay = () => {
    const win = checkWinCondition(players);
    if (win) {
      setVictoryInfo(win);
      addLog('Финал игры', `${win.title} — ${win.reason}`);
      return;
    }
    setGameState(prev => ({ phase: 'night', round: prev.round + 1 }));
    addLog(`День #${gameState.round}`, 'Дневное собрание закрыто. Город засыпает...');
  };

  const handleKamikazeWin = (kamikazePlayer) => {
    const win = {
      winner: 'kamikaze',
      title: 'Победа Камикадзе (Шута)!',
      color: '#ec4899',
      reason: `Игрок №${kamikazePlayer.number} (${kamikazePlayer.name}) спровоцировал город и был казнен на дневном суде, выполнив свою цель!`
    };
    setVictoryInfo(win);
    addLog('Финал игры', win.reason);
  };

  const handleResetMafia = () => {
    if (window.confirm('Вы уверены, что хотите сбросить текущую партию в Мафию?')) {
      setGameState({ phase: 'setup', round: 1 });
      setPlayers([]);
      setNightResult(null);
      setVictoryInfo(null);
      setGameLogs([]);
    }
  };

  // =============================================================
  // РЕЖИМ 1: ШПИОН (PASS-AND-PLAY НА 1 ТЕЛЕФОНЕ)
  // =============================================================
  if (appMode === 'spy') {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <SpyGame onBackToHub={() => setAppMode('menu')} />
      </div>
    );
  }

  // =============================================================
  // МЕНЮ ВЫБОРА ИГР (ХАБ)
  // =============================================================
  if (appMode === 'menu') {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-slate-100 px-4 pt-safe pb-safe max-w-md w-full mx-auto flex flex-col justify-between select-none">
        <header className="text-center pt-2 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Party Games Hub</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">
            Игры для компании
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Выберите формат для вашей тусовки
          </p>
        </header>

        <div className="space-y-3.5 my-auto py-2">
          {/* Игра 1: ШПИОН */}
          <button
            onClick={() => setAppMode('spy')}
            className="w-full p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 text-left shadow-xl active:scale-98 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl shrink-0">
                🕵️‍♂️
              </div>
              <div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  На 1 телефоне • Pass & Play
                </div>
                <div className="text-lg font-black text-white">ШПИОН (Spyfall)</div>
                <div className="text-xs text-slate-400">
                  40+ локаций и ролей • Без интернета
                </div>
              </div>
            </div>
            <span className="text-xl text-slate-500 pr-1">→</span>
          </button>

          {/* Игра 2: СЛОВА-МИНЫ */}
          <button
            onClick={() => setAppMode('party')}
            className="w-full p-4 rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 hover:border-rose-400/60 text-left shadow-xl active:scale-98 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-2xl shrink-0">
                💣
              </div>
              <div>
                <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  Онлайн со смартфонов • По коду
                </div>
                <div className="text-lg font-black text-white">Слова-Мины (Trapwords)</div>
                <div className="text-xs text-slate-400">
                  Тайные ловушки, блеф и кнопка «БАХ!»
                </div>
              </div>
            </div>
            <span className="text-xl text-slate-500 pr-1">→</span>
          </button>

          {/* Игра 3: МАФИЯ */}
          <button
            onClick={() => setAppMode('mafia')}
            className="w-full p-4 rounded-3xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-400/60 text-left shadow-xl active:scale-98 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl shrink-0">
                🎭
              </div>
              <div>
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  Оффлайн-ассистент ведущего
                </div>
                <div className="text-lg font-black text-white">Мафия (Пульт ведущего)</div>
                <div className="text-xs text-slate-400">
                  Все роли, таймер, фолы и авто-расчет ночи
                </div>
              </div>
            </div>
            <span className="text-xl text-slate-500 pr-1">→</span>
          </button>
        </div>

        <footer className="text-center py-2 text-xs text-slate-500">
          Синхронизация через онлайн-комнаты без установки
        </footer>
      </div>
    );
  }

  // =============================================================
  // РЕЖИМ 2: СЛОВА-МИНЫ ОНЛАЙН
  // =============================================================
  if (appMode === 'party') {
    if (!roomData) {
      return (
        <HomeScreen
          onSelectMafiaMode={() => setAppMode('menu')}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      );
    }

    const gamePhase = roomData.game?.phase || 'LOBBY';

    return (
      <div className="relative min-h-[100dvh] bg-slate-950">
        {gamePhase === 'LOBBY' && (
          <LobbyScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {gamePhase === 'SETTING_TRAPS' && (
          <SettingTrapsScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
          />
        )}

        {gamePhase === 'EXPLAINING' && (
          <ExplainingScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
          />
        )}

        {gamePhase === 'ROUND_RESULT' && (
          <RoundResultScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
          />
        )}

        {gamePhase === 'GAME_OVER' && (
          <GameOverScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
            onExitToHome={handleLeaveRoom}
          />
        )}
      </div>
    );
  }

  // =============================================================
  // РЕЖИМ 3: МАФИЯ: ПУЛЬТ ВЕДУЩЕГО
  // =============================================================
  return (
    <div className="app-container">
      <div className="bg-slate-900 border-b border-slate-800 py-2 px-4 flex items-center justify-between text-xs">
        <button
          onClick={() => setAppMode('menu')}
          className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>В меню хаба</span>
        </button>
        <span className="text-slate-400">Режим: Оффлайн-ассистент ведущего</span>
      </div>

      {gameState.phase !== 'dealing' && (
        <Navbar
          gameState={gameState}
          players={players}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenLog={() => setIsLogOpen(true)}
          onResetGame={handleResetMafia}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />
      )}

      <main className="main-content">
        {gameState.phase === 'setup' && (
          <SetupScreen onStartGame={handleStartGame} />
        )}

        {gameState.phase === 'dealing' && (
          <DealingPhase
            players={players}
            onDealingComplete={handleDealingComplete}
            onCancel={() => setGameState({ phase: 'setup', round: 1 })}
          />
        )}

        {gameState.phase === 'night' && (
          <NightPhase
            round={gameState.round}
            players={players}
            onFinishNight={handleFinishNight}
            previousNightActions={lastNightActions}
            settings={gameSettings}
          />
        )}

        {gameState.phase === 'morning' && nightResult && (
          <MorningSummary
            round={gameState.round}
            nightResult={nightResult}
            players={players}
            setPlayers={setPlayers}
            onProceedToDay={handleProceedToDay}
          />
        )}

        {gameState.phase === 'day' && (
          <DayPhase
            round={gameState.round}
            players={players}
            setPlayers={setPlayers}
            onFinishDay={handleFinishDay}
            onKamikazeWin={handleKamikazeWin}
            settings={gameSettings}
          />
        )}
      </main>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <GameLogModal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} logs={gameLogs} />
      <VictoryModal
        victoryInfo={victoryInfo}
        players={players}
        onRestart={() => {
          setVictoryInfo(null);
          setGameState({ phase: 'setup', round: 1 });
        }}
      />
    </div>
  );
}

export default App;
