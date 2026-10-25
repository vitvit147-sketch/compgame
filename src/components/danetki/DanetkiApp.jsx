// src/components/danetki/DanetkiApp.jsx - Главный модуль игры «Данетки»
import React, { useState, useEffect } from 'react';
import { danetkiSocket, danetkiPlayerId } from '../../utils/danetkiSocket';
import { getRandomDanetka } from '../../data/danetkiData';
import DanetkiHome from './DanetkiHome';
import DanetkiPlayScreen from './DanetkiPlayScreen';

export default function DanetkiApp({ onBackToHub }) {
  const [roomData, setRoomData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [screen, setScreen] = useState('home'); // 'home' | 'local_play' | 'online_play'
  const [localDanetka, setLocalDanetka] = useState(null);

  // Хранилище отгаданных загадок (в localStorage)
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('danetki_completed_ids')) || [];
    } catch {
      return [];
    }
  });

  const markCompleted = (id) => {
    if (!id) return;
    setCompletedIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('danetki_completed_ids', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving completed danetki:', e);
      }
      return updated;
    });
  };

  // Слушатели Firebase
  useEffect(() => {
    const onRoomCreated = ({ roomCode }) => {
      sessionStorage.setItem('current_danetki_room_code', roomCode);
      setErrorMessage('');
      setScreen('online_play');
    };

    const onRoomJoined = ({ roomCode }) => {
      sessionStorage.setItem('current_danetki_room_code', roomCode);
      setErrorMessage('');
      setScreen('online_play');
    };

    const onRoomUpdate = (data) => {
      setRoomData(data);
      if (data?.code) {
        sessionStorage.setItem('current_danetki_room_code', data.code);
        setScreen('online_play');
      }
    };

    const onReconnectFailed = () => {
      sessionStorage.removeItem('current_danetki_room_code');
      setRoomData(null);
      setScreen('home');
    };

    danetkiSocket.on('room_created', onRoomCreated);
    danetkiSocket.on('room_joined', onRoomJoined);
    danetkiSocket.on('room_update', onRoomUpdate);
    danetkiSocket.on('reconnect_failed', onReconnectFailed);

    return () => {
      danetkiSocket.off('room_created', onRoomCreated);
      danetkiSocket.off('room_joined', onRoomJoined);
      danetkiSocket.off('room_update', onRoomUpdate);
      danetkiSocket.off('reconnect_failed', onReconnectFailed);
    };
  }, []);

  const handleStartLocalGame = (category = 'all', chosenDanetka = null) => {
    const item = chosenDanetka || getRandomDanetka(category, completedIds);
    setLocalDanetka(item);
    setScreen('local_play');
  };

  const handleExitLocal = () => {
    setScreen('home');
  };

  const handleExitOnline = (isHost) => {
    danetkiSocket.leaveRoom(isHost);
    setRoomData(null);
    setScreen('home');
  };

  // ЭКРАН 1: ОНЛАЙН ИГРА
  if (screen === 'online_play' && roomData) {
    return (
      <DanetkiPlayScreen
        isOnline={true}
        roomData={roomData}
        myPlayer={roomData.myPlayer}
        isHost={roomData.isHost}
        onExit={() => handleExitOnline(roomData.isHost)}
        completedIds={completedIds}
        onMarkCompleted={markCompleted}
      />
    );
  }

  // ЭКРАН 2: ЛОКАЛЬНАЯ ИГРА НА 1 ТЕЛЕФОНЕ
  if (screen === 'local_play') {
    return (
      <DanetkiPlayScreen
        isOnline={false}
        roomData={null}
        myPlayer={{ name: 'Ведущий', isHost: true }}
        isHost={true}
        onExit={handleExitLocal}
        completedIds={completedIds}
        onMarkCompleted={markCompleted}
      />
    );
  }

  // ЭКРАН 3: ГЛАВНЫЙ ЭКРАН ДАНЕТОК
  return (
    <DanetkiHome
      onBackToHub={onBackToHub}
      onStartLocalGame={handleStartLocalGame}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
      completedIds={completedIds}
    />
  );
}
