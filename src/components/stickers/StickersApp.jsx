// src/components/stickers/StickersApp.jsx - Корневой контроллер игры «Стикеры»
import React from 'react';
import StickersHome from './StickersHome';
import StickersLobby from './StickersLobby';
import StickersNamingScreen from './StickersNamingScreen';
import StickersGameScreen from './StickersGameScreen';
import StickersFinaleScreen from './StickersFinaleScreen';

export default function StickersApp({
  roomData,
  errorMessage,
  setErrorMessage,
  onBackToHub,
  onLeaveRoom
}) {
  if (!roomData) {
    return (
      <StickersHome
        onBackToHub={onBackToHub}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    );
  }

  const { status } = roomData;

  switch (status) {
    case 'LOBBY':
      return <StickersLobby roomData={roomData} onLeaveRoom={onLeaveRoom} />;
    case 'NAMING':
      return <StickersNamingScreen roomData={roomData} onLeaveRoom={onLeaveRoom} />;
    case 'PLAYING':
      return <StickersGameScreen roomData={roomData} onLeaveRoom={onLeaveRoom} />;
    case 'FINALE':
      return <StickersFinaleScreen roomData={roomData} onLeaveRoom={onLeaveRoom} />;
    default:
      return <StickersLobby roomData={roomData} onLeaveRoom={onLeaveRoom} />;
  }
}
