// src/components/bunker/BunkerFinaleScreen.jsx
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { bunkerSocket } from '../../utils/bunkerSocket';
import { sounds } from '../../utils/soundEffects';
import { Shield, Sparkles, AlertTriangle, CheckCircle2, RotateCcw, Home, Skull, Users } from 'lucide-react';

export default function BunkerFinaleScreen({ roomData, myPlayer, isHost, onExitToHome }) {
  const game = roomData.game || {};
  const disaster = game.disaster || {};
  const threats = game.threats || [];
  const players = roomData.players || [];

  const survivors = players.filter(p => p.status === 'in_bunker' || p.status === 'alive');
  const exiled = players.filter(p => p.status === 'exiled');

  const isSurvivor = survivors.some(s => s.id === myPlayer?.id);

  // Проверка угроз по ключевым словам в характеристиках выживших
  const threatOutcomes = threats.map(threat => {
    const required = threat.requiredKeywords || [];
    let matchedPlayer = null;
    let matchedReason = '';

    for (const p of survivors) {
      const char = p.character || {};
      const allText = [
        char.profession?.name,
        char.profession?.desc,
        char.hobby?.text,
        char.baggage?.text,
        char.fact?.text
      ].filter(Boolean).join(' ').toLowerCase();

      for (const kw of required) {
        if (allText.includes(kw.toLowerCase())) {
          matchedPlayer = p;
          matchedReason = `Благодаря опыту / предмету игрока ${p.name}`;
          break;
        }
      }
      if (matchedPlayer) break;
    }

    return {
      ...threat,
      isOvercome: !!matchedPlayer,
      reason: matchedReason || 'В бункере не оказалось нужных специалистов или инструментов!'
    };
  });

  const totalOvercome = threatOutcomes.filter(t => t.isOvercome).length;
  const isCompleteSuccess = totalOvercome === threats.length;

  useEffect(() => {
    if (isCompleteSuccess) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      sounds.playSuccess();
    } else {
      sounds.playExplosion();
    }
  }, [isCompleteSuccess]);

  const handleRematch = () => {
    sounds.playTap();
    bunkerSocket.emit('reset_to_lobby');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-4 select-none">
      {/* Шапка триумфа */}
      <header className="text-center py-2 space-y-2">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-4xl">
            {isCompleteSuccess ? '🏆' : '☣️'}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Гермодвери запечатаны</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          {isCompleteSuccess ? 'Бункер выжил и возродил мир!' : 'Борьба за выживание продолжается'}
        </h1>

        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
          {isSurvivor
            ? 'Поздравляем! Вы пробились через отбор и вошли в число избранных!'
            : 'Вы остались снаружи, но ваша жертва дала человечеству шанс на спасение.'}
        </p>
      </header>

      {/* Команда выживших внутри бункера */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2.5">
        <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>Состав убежища ({survivors.length} чел.):</span>
        </div>

        <div className="space-y-1.5">
          {survivors.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{p.avatar || '🦺'}</span>
                <span className="font-bold text-white">{p.name}</span>
                {p.id === myPlayer?.id && (
                  <span className="text-[10px] text-amber-400">(Вы)</span>
                )}
              </div>
              <span className="text-slate-400 text-[11px] font-medium">
                {p.character?.profession?.name || 'Выживший'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Проверка угроз финала */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Испытания бункера ({totalOvercome} из {threats.length} отражено):</span>
        </div>

        <div className="space-y-2">
          {threatOutcomes.map(threat => (
            <div
              key={threat.id}
              className={`p-3 rounded-2xl border text-xs space-y-1 ${
                threat.isOvercome
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{threat.title}</span>
                <span>{threat.isOvercome ? '✅ Отражена' : '❌ Провал'}</span>
              </div>
              <p className="text-[11px] opacity-80 leading-snug">
                {threat.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопки */}
      <footer className="space-y-2.5 pt-2 pb-6">
        {isHost ? (
          <button
            onClick={handleRematch}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-950/50 active:scale-98 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сыграть новую партию (Реванш)</span>
          </button>
        ) : (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Ожидаем, пока командир запустит новую партию...
          </div>
        )}

        <button
          onClick={onExitToHome}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Выйти в главное меню</span>
        </button>
      </footer>
    </div>
  );
}
