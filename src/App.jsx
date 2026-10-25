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
import { ArrowLeft, Sparkles, Shield, Bomb, Radio, ChevronRight } from 'lucide-react';
import GameHeader from './components/common/GameHeader';

// Компоненты Бункера онлайн
import { bunkerSocket, bunkerPlayerId } from './utils/bunkerSocket';
import BunkerHome from './components/bunker/BunkerHome';
import BunkerLobby from './components/bunker/BunkerLobby';
import BunkerCatastropheScreen from './components/bunker/BunkerCatastropheScreen';
import BunkerGameScreen from './components/bunker/BunkerGameScreen';
import BunkerVotingScreen from './components/bunker/BunkerVotingScreen';
import BunkerFinaleScreen from './components/bunker/BunkerFinaleScreen';
import './App.css';

export function App() {
  // 'menu' (Хаб игр) | 'spy' (Шпион) | 'party' (Слова-мины) | 'mafia' (Пульт ведущего) | 'bunker' (Бункер онлайн)
  const [appMode, setAppMode] = useState('menu');
  const [roomData, setRoomData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ БУНКЕРА ОНЛАЙН
  // -------------------------------------------------------------
  const [bunkerRoomData, setBunkerRoomData] = useState(null);
  const [bunkerErrorMessage, setBunkerErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bunker_room')) {
      setAppMode('bunker');
    }
  }, []);

  useEffect(() => {
    const onBunkerRoomCreated = ({ roomCode }) => {
      sessionStorage.setItem('current_bunker_room_code', roomCode);
      setBunkerErrorMessage('');
    };

    const onBunkerRoomJoined = ({ roomCode }) => {
      sessionStorage.setItem('current_bunker_room_code', roomCode);
      setBunkerErrorMessage('');
    };

    const onBunkerRoomUpdate = (data) => {
      setBunkerRoomData(data);
      if (data?.code) {
        sessionStorage.setItem('current_bunker_room_code', data.code);
      }
    };

    const onBunkerError = ({ message }) => {
      setBunkerErrorMessage(message);
    };

    const onBunkerReconnectFailed = () => {
      sessionStorage.removeItem('current_bunker_room_code');
      setBunkerRoomData(null);
    };

    bunkerSocket.on('room_created', onBunkerRoomCreated);
    bunkerSocket.on('room_joined', onBunkerRoomJoined);
    bunkerSocket.on('room_update', onBunkerRoomUpdate);
    bunkerSocket.on('error_message', onBunkerError);
    bunkerSocket.on('reconnect_failed', onBunkerReconnectFailed);

    const savedBunkerCode = sessionStorage.getItem('current_bunker_room_code');
    if (savedBunkerCode) {
      bunkerSocket.emit('reconnect_player', { roomCode: savedBunkerCode, playerId: bunkerPlayerId });
    }

    return () => {
      bunkerSocket.off('room_created', onBunkerRoomCreated);
      bunkerSocket.off('room_joined', onBunkerRoomJoined);
      bunkerSocket.off('room_update', onBunkerRoomUpdate);
      bunkerSocket.off('error_message', onBunkerError);
      bunkerSocket.off('reconnect_failed', onBunkerReconnectFailed);
    };
  }, []);

  const handleLeaveBunkerRoom = () => {
    sessionStorage.removeItem('current_bunker_room_code');
    setBunkerRoomData(null);
    setBunkerErrorMessage('');
  };

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
  // МЕНЮ ВЫБОРА ИГР (ХАБ) - ПРОСТОРНЫЙ МОБИЛЬНЫЙ ФОРМАТ
  // =============================================================
  if (appMode === 'menu') {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-slate-100 px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(2rem,env(safe-area-inset-bottom,0px))] max-w-md w-full mx-auto flex flex-col justify-start select-none overflow-y-auto">
        {/* Заголовок хаба */}
        <header className="text-center pt-3 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Party Games Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
            Игры для компании
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1.5 leading-relaxed font-medium">
            Выберите формат для вашей вечеринки или посиделок
          </p>
        </header>

        {/* Список карточек игр с удобными большими кликабельными зонами */}
        <div className="space-y-4 pt-4 pb-6">
          {/* Игра 1: ШПИОН */}
          <button
            type="button"
            onClick={() => setAppMode('spy')}
            className="w-full p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 active:border-indigo-400 text-left shadow-xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🕵️‍♂️
              </div>
              <div>
                <div className="text-xs text-indigo-400 font-extrabold uppercase tracking-wider mb-0.5">
                  На 1 телефоне • Pass & Play
                </div>
                <div className="text-xl font-black text-white">ШПИОН (Spyfall)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  40+ локаций и ролей • Без интернета
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* Игра 2: БУНКЕР ОНЛАЙН */}
          <button
            type="button"
            onClick={() => setAppMode('bunker')}
            className="w-full p-5 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/40 hover:border-amber-400 active:border-amber-400 text-left shadow-xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                ☢️
              </div>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                  <span>Онлайн со смартфонов</span>
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black tracking-normal">ХИТ</span>
                </div>
                <div className="text-xl font-black text-white">БУНКЕР (Bunker 3.0)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Карточки выживших, катастрофа и тайное голосование
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-amber-400 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* Игра 3: МАФИЯ */}
          <button
            type="button"
            onClick={() => setAppMode('mafia')}
            className="w-full p-5 rounded-3xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-400/60 active:border-purple-400 text-left shadow-xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🎭
              </div>
              <div>
                <div className="text-xs text-purple-400 font-extrabold uppercase tracking-wider mb-0.5">
                  Оффлайн-пульт ведущего
                </div>
                <div className="text-xl font-black text-white">Мафия (Пульт ведущего)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Все роли, таймер, фолы и авто-расчет ночи
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-purple-400 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* Игра 4: СЛОВА-МИНЫ */}
          <button
            type="button"
            onClick={() => setAppMode('party')}
            className="w-full p-5 rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 hover:border-rose-400/60 active:border-rose-400 text-left shadow-xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                💣
              </div>
              <div>
                <div className="text-xs text-rose-400 font-extrabold uppercase tracking-wider mb-0.5">
                  Онлайн со смартфонов • По коду
                </div>
                <div className="text-xl font-black text-white">Слова-Мины (Trapwords)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Тайные ловушки, блеф и кнопка «БАХ!»
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-rose-400 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>

        <footer className="text-center pt-2 pb-6 text-xs text-slate-500 font-medium">
          🎮 Синхронизация через онлайн-комнаты без установки
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
  // РЕЖИМ 3: БУНКЕР ОНЛАЙН
  // =============================================================
  if (appMode === 'bunker') {
    if (!bunkerRoomData) {
      return (
        <BunkerHome
          onBackToHub={() => setAppMode('menu')}
          errorMessage={bunkerErrorMessage}
          setErrorMessage={setBunkerErrorMessage}
        />
      );
    }

    const bunkerPhase = bunkerRoomData.game?.phase || 'LOBBY';

    return (
      <div className="relative min-h-[100dvh] bg-slate-950">
        {bunkerPhase === 'LOBBY' && (
          <BunkerLobby
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
            onLeaveRoom={handleLeaveBunkerRoom}
          />
        )}

        {bunkerPhase === 'CATASTROPHE' && (
          <BunkerCatastropheScreen
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
          />
        )}

        {bunkerPhase === 'ROUND_DISCUSS' && (
          <BunkerGameScreen
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
          />
        )}

        {(bunkerPhase === 'VOTING' || bunkerPhase === 'VOTE_RESULT') && (
          <BunkerVotingScreen
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
          />
        )}

        {bunkerPhase === 'FINALE' && (
          <BunkerFinaleScreen
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
            onExitToHome={handleLeaveBunkerRoom}
          />
        )}
      </div>
    );
  }

  // =============================================================
  // РЕЖИМ 4: МАФИЯ: ПУЛЬТ ВЕДУЩЕГО
  // =============================================================
  return (
    <div className="app-container">
      <GameHeader
        onBack={() => setAppMode('menu')}
        backLabel="В меню"
        title="МАФИЯ"
        icon="🎭"
        badge="Пульт ведущего"
      />

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
