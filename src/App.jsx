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
import ExitConfirmModal from './components/common/ExitConfirmModal';

// Компоненты Бункера онлайн
import { bunkerSocket, bunkerPlayerId } from './utils/bunkerSocket';
import BunkerHome from './components/bunker/BunkerHome';
import BunkerLobby from './components/bunker/BunkerLobby';
import BunkerCatastropheScreen from './components/bunker/BunkerCatastropheScreen';
import BunkerGameScreen from './components/bunker/BunkerGameScreen';
import BunkerVotingScreen from './components/bunker/BunkerVotingScreen';
import BunkerFinaleScreen from './components/bunker/BunkerFinaleScreen';

// Компоненты Криминалиста (Deception: Murder in Hong Kong)
import { deceptionSocket, deceptionPlayerId } from './utils/deceptionSocket';
import DeceptionHome from './components/deception/DeceptionHome';
import DeceptionLobby from './components/deception/DeceptionLobby';
import DeceptionNightScreen from './components/deception/DeceptionNightScreen';
import DeceptionScientistSetup from './components/deception/DeceptionScientistSetup';
import DeceptionBoardScreen from './components/deception/DeceptionBoardScreen';
import DeceptionFinaleScreen from './components/deception/DeceptionFinaleScreen';

// Компоненты Мафии Онлайн
import { mafiaOnlineSocket, mafiaOnlinePlayerId } from './utils/mafiaOnlineSocket';
import MafiaOnlineHome from './components/mafia_online/MafiaOnlineHome';
import MafiaOnlinePlayerLobby from './components/mafia_online/MafiaOnlinePlayerLobby';
import MafiaOnlineHostLobby from './components/mafia_online/MafiaOnlineHostLobby';
import MafiaOnlinePlayerGameScreen from './components/mafia_online/MafiaOnlinePlayerGameScreen';

// Компоненты игры «Стикеры» («Кто я?»)
import { stickersSocket, stickersPlayerId } from './utils/stickersSocket';
import StickersApp from './components/stickers/StickersApp';
import './App.css';

export function App() {
  // 'menu' (Хаб игр) | 'spy' (Шпион) | 'party' (Слова-мины) | 'mafia' (Мафия) | 'bunker' (Бункер онлайн) | 'deception' (Криминалист) | 'stickers' (Стикеры)
  const [appMode, setAppMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('bunker_room')) return 'bunker';
      if (params.get('crime_room')) return 'deception';
      if (params.get('mafia_room')) return 'mafia';
      if (params.get('stickers_room')) return 'stickers';
    } catch (e) {}
    return 'menu';
  });

  const [mafiaSubMode, setMafiaSubMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mafia_room')) return 'online';
    } catch (e) {}
    return null;
  });

  const [roomData, setRoomData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMafiaExitModal, setShowMafiaExitModal] = useState(false);
  const [mafiaExitAction, setMafiaExitAction] = useState('menu'); // 'menu' | 'reset'

  // -------------------------------------------------------------
  // СОСТОЯНИЯ ОФФЛАЙН/ОНЛАЙН МАФИИ ДЛЯ ПУЛЬТА ВЕДУЩЕГО
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

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ МАФИИ ОНЛАЙН
  // -------------------------------------------------------------
  const [mafiaOnlineRoomData, setMafiaOnlineRoomData] = useState(null);
  const [mafiaOnlineErrorMessage, setMafiaOnlineErrorMessage] = useState('');

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ КРИМИНАЛИСТА ОНЛАЙН (DECEPTION)
  // -------------------------------------------------------------
  const [deceptionRoomData, setDeceptionRoomData] = useState(null);
  const [deceptionErrorMessage, setDeceptionErrorMessage] = useState('');

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ СТИКЕРОВ ОНЛАЙН («Кто я?»)
  // -------------------------------------------------------------
  const [stickersRoomData, setStickersRoomData] = useState(null);
  const [stickersErrorMessage, setStickersErrorMessage] = useState('');

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ БУНКЕРА ОНЛАЙН
  // -------------------------------------------------------------
  const [bunkerRoomData, setBunkerRoomData] = useState(null);
  const [bunkerErrorMessage, setBunkerErrorMessage] = useState('');

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
      try {
        if (window.history && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
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

  const handleLeaveBunkerRoom = (isHost = false) => {
    bunkerSocket.leaveRoom(isHost);
    sessionStorage.removeItem('current_bunker_room_code');
    setBunkerRoomData(null);
    setBunkerErrorMessage('');
    try {
      if (window.history && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ КРИМИНАЛИСТА ОНЛАЙН (DECEPTION)
  // -------------------------------------------------------------
  useEffect(() => {
    const onDeceptionRoomCreated = ({ roomCode }) => {
      sessionStorage.setItem('current_deception_room_code', roomCode);
      setDeceptionErrorMessage('');
    };

    const onDeceptionRoomJoined = ({ roomCode }) => {
      sessionStorage.setItem('current_deception_room_code', roomCode);
      setDeceptionErrorMessage('');
    };

    const onDeceptionRoomUpdate = (data) => {
      setDeceptionRoomData(data);
      if (data?.code) {
        sessionStorage.setItem('current_deception_room_code', data.code);
      }
    };

    const onDeceptionError = ({ message }) => {
      setDeceptionErrorMessage(message);
    };

    const onDeceptionReconnectFailed = () => {
      sessionStorage.removeItem('current_deception_room_code');
      setDeceptionRoomData(null);
      try {
        if (window.history && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
    };

    deceptionSocket.on('room_created', onDeceptionRoomCreated);
    deceptionSocket.on('room_joined', onDeceptionRoomJoined);
    deceptionSocket.on('room_update', onDeceptionRoomUpdate);
    deceptionSocket.on('error_message', onDeceptionError);
    deceptionSocket.on('reconnect_failed', onDeceptionReconnectFailed);

    const savedDeceptionCode = sessionStorage.getItem('current_deception_room_code');
    if (savedDeceptionCode) {
      deceptionSocket.emit('reconnect_player', { roomCode: savedDeceptionCode, playerId: deceptionPlayerId });
    }

    return () => {
      deceptionSocket.off('room_created', onDeceptionRoomCreated);
      deceptionSocket.off('room_joined', onDeceptionRoomJoined);
      deceptionSocket.off('room_update', onDeceptionRoomUpdate);
      deceptionSocket.off('error_message', onDeceptionError);
      deceptionSocket.off('reconnect_failed', onDeceptionReconnectFailed);
    };
  }, []);

  const handleLeaveDeceptionRoom = (isHost = false) => {
    deceptionSocket.leaveRoom(isHost);
    sessionStorage.removeItem('current_deception_room_code');
    setDeceptionRoomData(null);
    setDeceptionErrorMessage('');
    try {
      if (window.history && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ ИГРЫ «СТИКЕРЫ» («Кто я?»)
  // -------------------------------------------------------------
  useEffect(() => {
    const onStickersRoomCreated = ({ roomCode }) => {
      sessionStorage.setItem('current_stickers_room_code', roomCode);
      setStickersErrorMessage('');
    };

    const onStickersRoomJoined = ({ roomCode }) => {
      sessionStorage.setItem('current_stickers_room_code', roomCode);
      setStickersErrorMessage('');
    };

    const onStickersRoomUpdate = (data) => {
      setStickersRoomData(data);
      if (data?.code) {
        sessionStorage.setItem('current_stickers_room_code', data.code);
      }
    };

    const onStickersError = ({ message }) => {
      setStickersErrorMessage(message);
    };

    const onStickersReconnectFailed = () => {
      sessionStorage.removeItem('current_stickers_room_code');
      setStickersRoomData(null);
      try {
        if (window.history && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
    };

    stickersSocket.on('room_created', onStickersRoomCreated);
    stickersSocket.on('room_joined', onStickersRoomJoined);
    stickersSocket.on('room_update', onStickersRoomUpdate);
    stickersSocket.on('error_message', onStickersError);
    stickersSocket.on('reconnect_failed', onStickersReconnectFailed);

    const savedStickersCode = sessionStorage.getItem('current_stickers_room_code');
    if (savedStickersCode) {
      stickersSocket.emit('reconnect_player', { roomCode: savedStickersCode, playerId: stickersPlayerId });
    }

    return () => {
      stickersSocket.off('room_created', onStickersRoomCreated);
      stickersSocket.off('room_joined', onStickersRoomJoined);
      stickersSocket.off('room_update', onStickersRoomUpdate);
      stickersSocket.off('error_message', onStickersError);
      stickersSocket.off('reconnect_failed', onStickersReconnectFailed);
    };
  }, []);

  const handleLeaveStickersRoom = (isHost = false) => {
    stickersSocket.leaveRoom(isHost);
    sessionStorage.removeItem('current_stickers_room_code');
    setStickersRoomData(null);
    setStickersErrorMessage('');
    try {
      if (window.history && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // ЛОГИКА СОКЕТОВ ДЛЯ МАФИИ ОНЛАЙН
  // -------------------------------------------------------------
  useEffect(() => {
    const onMafiaRoomCreated = ({ roomCode }) => {
      sessionStorage.setItem('current_mafia_online_room_code', roomCode);
      setMafiaOnlineErrorMessage('');
      setMafiaSubMode('online');
    };

    const onMafiaRoomJoined = ({ roomCode }) => {
      sessionStorage.setItem('current_mafia_online_room_code', roomCode);
      setMafiaOnlineErrorMessage('');
      setMafiaSubMode('online');
    };

    const onMafiaRoomUpdate = (data) => {
      setMafiaOnlineRoomData(data);
      if (data?.code) {
        sessionStorage.setItem('current_mafia_online_room_code', data.code);
        setMafiaSubMode('online');
      }

      // Если я хост и игра только что запустилась из лобби — синхронизируем локальный пульт ведущего
      if (data?.isHost && data?.game?.status === 'PLAYING' && data.players) {
        const gamePlayers = data.players.filter(p => !p.isHost);
        setPlayers(prev => {
          if (gamePlayers.length > 0 && prev.length === 0) {
            setGameState({
              phase: data.game.phase || 'night',
              round: data.game.round || 1
            });
            return gamePlayers;
          }
          return prev;
        });
      }
    };

    const onMafiaError = ({ message }) => {
      setMafiaOnlineErrorMessage(message);
    };

    const onMafiaReconnectFailed = () => {
      sessionStorage.removeItem('current_mafia_online_room_code');
      setMafiaOnlineRoomData(null);
      setMafiaSubMode(null);
      try {
        if (window.history && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
    };

    mafiaOnlineSocket.on('room_created', onMafiaRoomCreated);
    mafiaOnlineSocket.on('room_joined', onMafiaRoomJoined);
    mafiaOnlineSocket.on('room_update', onMafiaRoomUpdate);
    mafiaOnlineSocket.on('error_message', onMafiaError);
    mafiaOnlineSocket.on('reconnect_failed', onMafiaReconnectFailed);

    const savedMafiaCode = sessionStorage.getItem('current_mafia_online_room_code');
    if (savedMafiaCode) {
      mafiaOnlineSocket.emit('reconnect_player', { roomCode: savedMafiaCode, playerId: mafiaOnlinePlayerId });
    }

    return () => {
      mafiaOnlineSocket.off('room_created', onMafiaRoomCreated);
      mafiaOnlineSocket.off('room_joined', onMafiaRoomJoined);
      mafiaOnlineSocket.off('room_update', onMafiaRoomUpdate);
      mafiaOnlineSocket.off('error_message', onMafiaError);
      mafiaOnlineSocket.off('reconnect_failed', onMafiaReconnectFailed);
    };
  }, []);

  const handleLeaveMafiaOnlineRoom = (isHost = false) => {
    mafiaOnlineSocket.leaveRoom(isHost);
    sessionStorage.removeItem('current_mafia_online_room_code');
    setMafiaOnlineRoomData(null);
    setMafiaOnlineErrorMessage('');
    setMafiaSubMode(null);
    try {
      if (window.history && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
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
      try {
        if (window.history && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
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

  const handleLeaveRoom = (isHost = false) => {
    socket.leaveRoom(isHost);
    sessionStorage.removeItem('current_room_code');
    setRoomData(null);
    setErrorMessage('');
    try {
      if (window.history && window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  };

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

    if (mafiaOnlineRoomData?.isHost) {
      mafiaOnlineSocket.emit('sync_host_game_state', {
        phase: 'morning',
        round: gameState.round,
        nightResult: result,
        winner: win?.winner || null,
        players: result.updatedPlayers
      });
    }
  };

  const handleProceedToDay = () => {
    const win = checkWinCondition(players);
    if (win) {
      setVictoryInfo(win);
      if (mafiaOnlineRoomData?.isHost) {
        mafiaOnlineSocket.emit('sync_host_game_state', {
          phase: 'game_over',
          winner: win.winner
        });
      }
      return;
    }
    setGameState(prev => ({ ...prev, phase: 'day' }));
    addLog(`День #${gameState.round}`, 'Город проснулся. Начало обсуждения и голосования.');

    if (mafiaOnlineRoomData?.isHost) {
      mafiaOnlineSocket.emit('sync_host_game_state', {
        phase: 'day',
        round: gameState.round
      });
    }
  };

  const handleFinishDay = () => {
    const win = checkWinCondition(players);
    if (win) {
      setVictoryInfo(win);
      addLog('Финал игры', `${win.title} — ${win.reason}`);
      if (mafiaOnlineRoomData?.isHost) {
        mafiaOnlineSocket.emit('sync_host_game_state', {
          phase: 'game_over',
          winner: win.winner
        });
      }
      return;
    }
    setGameState(prev => ({ phase: 'night', round: prev.round + 1 }));
    addLog(`День #${gameState.round}`, 'Дневное собрание закрыто. Город засыпает...');

    if (mafiaOnlineRoomData?.isHost) {
      mafiaOnlineSocket.emit('sync_host_game_state', {
        phase: 'night',
        round: gameState.round + 1,
        players
      });
    }
  };

  const handleSetPlayersSynced = (newPlayersOrUpdater) => {
    setPlayers(prev => {
      const next = typeof newPlayersOrUpdater === 'function' ? newPlayersOrUpdater(prev) : newPlayersOrUpdater;
      if (mafiaOnlineRoomData?.isHost) {
        mafiaOnlineSocket.emit('sync_host_game_state', { players: next });
      }
      return next;
    });
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

    if (mafiaOnlineRoomData?.isHost) {
      mafiaOnlineSocket.emit('sync_host_game_state', {
        phase: 'game_over',
        winner: 'kamikaze'
      });
    }
  };

  const handleConfirmMafiaExit = () => {
    setShowMafiaExitModal(false);
    setGameState({ phase: 'setup', round: 1 });
    setPlayers([]);
    setNightResult(null);
    setVictoryInfo(null);
    setGameLogs([]);
    if (mafiaOnlineRoomData?.isHost) {
      handleLeaveMafiaOnlineRoom(true);
    }
    if (mafiaExitAction === 'menu') {
      setMafiaSubMode(null);
      setAppMode('menu');
    }
  };

  const handleResetMafia = () => {
    setMafiaExitAction('reset');
    setShowMafiaExitModal(true);
  };

  const handleMafiaBack = () => {
    if (gameState.phase === 'setup') {
      setAppMode('menu');
    } else {
      setMafiaExitAction('menu');
      setShowMafiaExitModal(true);
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
      <div className="min-h-[100dvh] bg-slate-950 text-slate-100 px-5 sm:px-6 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] max-w-lg w-full mx-auto flex flex-col justify-start select-none overflow-y-auto">
        {/* Заголовок хаба */}
        <header className="text-center pt-3 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-3 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Party Games Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
            Игры для компании
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
            Выберите формат для вашей вечеринки или посиделок
          </p>
        </header>

        {/* Список карточек игр с удобными большими кликабельными зонами */}
        <div className="space-y-5 pt-3 pb-8">
          {/* Игра 1: ШПИОН */}
          <button
            type="button"
            onClick={() => setAppMode('spy')}
            className="w-full p-6 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 active:border-indigo-400 text-left shadow-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🕵️‍♂️
              </div>
              <div>
                <div className="text-xs text-indigo-400 font-extrabold uppercase tracking-wider mb-1">
                  На 1 телефоне • Pass & Play
                </div>
                <div className="text-xl font-black text-white">ШПИОН (Spyfall)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
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
            className="w-full p-6 rounded-3xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-900 border border-amber-500/40 hover:border-amber-400 active:border-amber-400 text-left shadow-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                ☢️
              </div>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <span>Онлайн со смартфонов</span>
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black tracking-normal">ХИТ</span>
                </div>
                <div className="text-xl font-black text-white">БУНКЕР (Bunker 3.0)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
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
            className="w-full p-6 rounded-3xl bg-gradient-to-br from-purple-950/90 via-slate-900 to-slate-900 border border-purple-500/40 hover:border-purple-400 active:border-purple-400 text-left shadow-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🎭
              </div>
              <div>
                <div className="text-xs text-purple-400 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>Онлайн со смартфонов</span>
                  <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black tracking-normal">ОБНОВЛЕНО</span>
                </div>
                <div className="text-xl font-black text-white">Мафия (Онлайн & Пульт)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  Подключение по коду комнаты, тайные роли на экране + пульт
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
            className="w-full p-6 rounded-3xl bg-gradient-to-br from-rose-950/90 via-slate-900 to-slate-900 border border-rose-500/40 hover:border-rose-400 active:border-rose-400 text-left shadow-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                💣
              </div>
              <div>
                <div className="text-xs text-rose-400 font-extrabold uppercase tracking-wider mb-1">
                  Онлайн со смартфонов • По коду
                </div>
                <div className="text-xl font-black text-white">Слова-Мины (Trapwords)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  Тайные ловушки, блеф и кнопка «БАХ!»
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-rose-400 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* Игра 5: КРИМИНАЛИСТ */}
          <button
            type="button"
            onClick={() => setAppMode('deception')}
            className="w-full p-6 rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border-2 border-amber-500/50 hover:border-amber-400 active:border-amber-400 text-left shadow-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🔍
              </div>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <span>Онлайн со смартфонов</span>
                </div>
                <div className="text-xl font-black text-white">КРИМИНАЛИСТ (Deception)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  Судмедэксперт без слов, тайный убийца, улики и жетон обвинения
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-750 flex items-center justify-center text-slate-400 group-hover:text-amber-400 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* Игра 6: СТИКЕРЫ НА ЛОБ («Кто я?») — НОВИНКА */}
          <button
            type="button"
            onClick={() => setAppMode('stickers')}
            className="w-full p-6 rounded-3xl bg-gradient-to-br from-amber-400/20 via-slate-900 to-slate-900 border-2 border-amber-400 hover:border-yellow-300 active:border-yellow-300 text-left shadow-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-3 touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/25 border-2 border-amber-400/50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                🏷️
              </div>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <span>Онлайн со смартфонов</span>
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black tracking-normal">НОВИНКА</span>
                </div>
                <div className="text-xl font-black text-white">СТИКЕРЫ («Кто я?»)</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  Бумажка на лоб: тайные персонажи соседа и вопросы «Да/Нет»
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-amber-400 shrink-0">
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
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {gamePhase === 'EXPLAINING' && (
          <ExplainingScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {gamePhase === 'ROUND_RESULT' && (
          <RoundResultScreen
            roomData={roomData}
            myPlayer={roomData.myPlayer}
            isHost={roomData.isHost}
            onLeaveRoom={handleLeaveRoom}
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
            onLeaveRoom={handleLeaveBunkerRoom}
          />
        )}

        {bunkerPhase === 'ROUND_DISCUSS' && (
          <BunkerGameScreen
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
            onLeaveRoom={handleLeaveBunkerRoom}
          />
        )}

        {(bunkerPhase === 'VOTING' || bunkerPhase === 'VOTE_RESULT') && (
          <BunkerVotingScreen
            roomData={bunkerRoomData}
            myPlayer={bunkerRoomData.myPlayer}
            isHost={bunkerRoomData.isHost}
            onLeaveRoom={handleLeaveBunkerRoom}
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
  // РЕЖИМ 5: КРИМИНАЛИСТ ОНЛАЙН (DECEPTION: MURDER IN HONG KONG)
  // =============================================================
  if (appMode === 'deception') {
    if (!deceptionRoomData) {
      return (
        <DeceptionHome
          onBackToHub={() => setAppMode('menu')}
          errorMessage={deceptionErrorMessage}
          setErrorMessage={setDeceptionErrorMessage}
        />
      );
    }

    const crimePhase = deceptionRoomData.game?.phase || 'LOBBY';

    return (
      <div className="relative min-h-[100dvh] bg-slate-950">
        {crimePhase === 'LOBBY' && (
          <DeceptionLobby
            roomData={deceptionRoomData}
            myPlayer={deceptionRoomData.myPlayer}
            isHost={deceptionRoomData.isHost}
            onLeaveRoom={handleLeaveDeceptionRoom}
          />
        )}

        {crimePhase === 'NIGHT' && (
          <DeceptionNightScreen
            roomData={deceptionRoomData}
            myPlayer={deceptionRoomData.myPlayer}
            isHost={deceptionRoomData.isHost}
            onLeaveRoom={handleLeaveDeceptionRoom}
          />
        )}

        {crimePhase === 'SCIENTIST_SETUP' && (
          <DeceptionScientistSetup
            roomData={deceptionRoomData}
            myPlayer={deceptionRoomData.myPlayer}
            isHost={deceptionRoomData.isHost}
            onLeaveRoom={handleLeaveDeceptionRoom}
          />
        )}

        {crimePhase === 'DISCUSSION' && (
          <DeceptionBoardScreen
            roomData={deceptionRoomData}
            myPlayer={deceptionRoomData.myPlayer}
            isHost={deceptionRoomData.isHost}
            onLeaveRoom={handleLeaveDeceptionRoom}
          />
        )}

        {(crimePhase === 'WITNESS_GUESS' || crimePhase === 'GAME_OVER') && (
          <DeceptionFinaleScreen
            roomData={deceptionRoomData}
            myPlayer={deceptionRoomData.myPlayer}
            isHost={deceptionRoomData.isHost}
            onExitToHome={handleLeaveDeceptionRoom}
          />
        )}
      </div>
    );
  }

  // =============================================================
  // РЕЖИМ 6: СТИКЕРЫ НА ЛОБ («Кто я?», «Лобстер»)
  // =============================================================
  if (appMode === 'stickers') {
    return (
      <div className="relative min-h-[100dvh] bg-slate-950">
        <StickersApp
          roomData={stickersRoomData}
          errorMessage={stickersErrorMessage}
          setErrorMessage={setStickersErrorMessage}
          onBackToHub={() => setAppMode('menu')}
          onLeaveRoom={handleLeaveStickersRoom}
        />
      </div>
    );
  }

  // =============================================================
  // РЕЖИМ 4: МАФИЯ: ОНЛАЙН ИЛИ ПУЛЬТ ВЕДУЩЕГО
  // =============================================================
  // 1. Выбор режима входа (если еще не выбрано и не в комнате)
  if (!mafiaSubMode && !mafiaOnlineRoomData) {
    return (
      <MafiaOnlineHome
        onBackToHub={() => setAppMode('menu')}
        onSelectOfflineMode={() => setMafiaSubMode('offline')}
        errorMessage={mafiaOnlineErrorMessage}
        setErrorMessage={setMafiaOnlineErrorMessage}
      />
    );
  }

  // 2. Игрок или Хост находится в онлайн-комнате
  if (mafiaOnlineRoomData) {
    // Фаза ожидания в лобби
    if (mafiaOnlineRoomData.game?.status === 'LOBBY') {
      if (mafiaOnlineRoomData.isHost) {
        return (
          <MafiaOnlineHostLobby
            roomData={mafiaOnlineRoomData}
            myPlayer={mafiaOnlineRoomData.myPlayer}
            onLeaveRoom={handleLeaveMafiaOnlineRoom}
          />
        );
      } else {
        return (
          <MafiaOnlinePlayerLobby
            roomData={mafiaOnlineRoomData}
            myPlayer={mafiaOnlineRoomData.myPlayer}
            onLeaveRoom={handleLeaveMafiaOnlineRoom}
          />
        );
      }
    }

    // Фаза активной игры для обычных игроков (видят свою роль)
    if (mafiaOnlineRoomData.game?.status === 'PLAYING' && !mafiaOnlineRoomData.isHost) {
      return (
        <MafiaOnlinePlayerGameScreen
          roomData={mafiaOnlineRoomData}
          myPlayer={mafiaOnlineRoomData.myPlayer}
          onLeaveRoom={handleLeaveMafiaOnlineRoom}
        />
      );
    }
  }

  // 3. Пульт ведущего (для Хоста онлайн или Оффлайн-игры на 1 телефоне)
  return (
    <div className="app-container">
      <GameHeader
        onBack={handleMafiaBack}
        backLabel="В меню"
        title="МАФИЯ"
        icon="🎭"
        badge={mafiaOnlineRoomData?.isHost ? `Комната №${mafiaOnlineRoomData.code}` : "Пульт ведущего"}
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
            setPlayers={handleSetPlayersSynced}
            onProceedToDay={handleProceedToDay}
          />
        )}

        {gameState.phase === 'day' && (
          <DayPhase
            round={gameState.round}
            players={players}
            setPlayers={handleSetPlayersSynced}
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
          if (mafiaOnlineRoomData?.isHost) {
            mafiaOnlineSocket.emit('reset_to_lobby');
          } else {
            setGameState({ phase: 'setup', round: 1 });
          }
        }}
      />

      {/* Защита от случайного сброса Мафии (двойное подтверждение) */}
      <ExitConfirmModal
        isOpen={showMafiaExitModal}
        onClose={() => setShowMafiaExitModal(false)}
        onConfirm={handleConfirmMafiaExit}
        isHost={true}
        customTitle={mafiaExitAction === 'menu' ? 'Выйти в главное меню?' : 'Сбросить текущую партию?'}
        customDesc="Текущая рассадка, ночные действия и роли игроков будут сброшены. Чтобы подтвердить выход, нажмите кнопку еще раз."
      />
    </div>
  );
}

export default App;
