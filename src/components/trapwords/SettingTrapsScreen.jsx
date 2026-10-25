// src/components/trapwords/SettingTrapsScreen.jsx
import React from 'react';
import { socket } from '../../utils/socket';
import { sounds } from '../../utils/soundEffects';
import { Bomb, Shield, Clock, Lightbulb, CheckCircle2, UserCheck, Flame } from 'lucide-react';

export default function SettingTrapsScreen({ roomData, myPlayer }) {
  const game = roomData.game || {};
  const isMyTeamTrapping = game.isMyTeamTrapping;
  const isMyTeamExplaining = game.isMyTeamExplaining;

  const explainingTeamName = game.explainingTeam === 'blue' ? 'Синяя' : 'Красная';
  const trappingTeamName = game.trappingTeam === 'blue' ? 'Синяя' : 'Красная';

  const handleTrapChange = (index, word) => {
    socket.emit('set_trap_word', { index, word });
  };

  const handleFillSuggestions = () => {
    sounds.playTap();
    socket.emit('fill_suggested_traps');
  };

  const handleConfirmTraps = () => {
    sounds.playTap();
    socket.emit('confirm_traps');
  };

  const handleClaimSpeaker = () => {
    sounds.playTap();
    socket.emit('set_speaker', { speakerId: myPlayer.id });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md w-full mx-auto px-4 pt-safe pb-safe space-y-3.5 select-none">
      {/* Шапка раунда и счета */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Раунд {game.round} • Минирование
          </div>
          <div className="flex items-center gap-2 mt-0.5 font-black text-sm">
            <span className="text-rose-400">🔴 {game.scores.red}</span>
            <span className="text-slate-600">:</span>
            <span className="text-sky-400">🔵 {game.scores.blue}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              (до {game.targetScore})
            </span>
          </div>
        </div>

        {/* Таймер */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border ${
            game.timer <= 10
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-amber-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{game.timer}с</span>
        </div>
      </header>

      {/* Основной контент */}
      {isMyTeamTrapping ? (
        /* =================================================== */
        /* ЭКРАН МИНИРУЮЩЕЙ КОМАНДЫ (Видят слово и ставят мины) */
        /* =================================================== */
        <div className="space-y-3.5">
          {/* Карточка со словом */}
          <div className="bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-600/50 rounded-3xl p-5 text-center shadow-xl shadow-rose-950/30">
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Соперники будут отгадывать слово:</span>
            </div>
            <div className="text-3xl font-black tracking-wide text-white uppercase drop-shadow-md py-1">
              {game.word || '...'}
            </div>
          </div>

          {/* Блок расстановки мин */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Bomb className="w-4 h-4 text-amber-400" />
                <span>Заложите {game.trapCount} слов-мин:</span>
              </div>
              <button
                onClick={handleFillSuggestions}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20 active:scale-95 transition-all"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Идеи</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-snug">
              Если спикер соперников произнесет любое из этих слов — ловушка сработает, и их раунд проигран!
            </p>

            {/* Слоты мин */}
            <div className="space-y-2 pt-1">
              {game.traps.map((trap, idx) => (
                <div key={idx} className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-bold text-xs text-rose-400/90">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={trap || ''}
                    onChange={(e) => handleTrapChange(idx, e.target.value)}
                    placeholder={`Слово-мина #${idx + 1}...`}
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white text-base font-bold placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all uppercase"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirmTraps}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-950/50 active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Заминировано! Начать раунд</span>
          </button>
        </div>
      ) : (
        /* ======================================================== */
        /* ЭКРАН ОБЪЯСНЯЮЩЕЙ КОМАНДЫ (Ждут, пока соперники минируют) */
        /* ======================================================== */
        <div className="space-y-4 text-center py-2">
          {/* Радар/анимация ожидания */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-2">
            <div className="absolute inset-0 rounded-full bg-sky-500/10 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-sky-400/30 animate-spin"></div>
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/10">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h2 className="text-lg font-black text-white">
              {trappingTeamName} команда закладывает мины!
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Соперники видят секретное слово и выбирают {game.trapCount} очевидных ассоциаций, которые они запретят вам говорить.
            </p>

            <div className="pt-2 border-t border-slate-800 text-xs">
              <div className="text-slate-400 mb-1">Спикер вашей команды:</div>
              <div className="text-base font-black text-sky-400 flex items-center justify-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>{game.speakerName || 'Определяется...'}</span>
              </div>
            </div>

            {isMyTeamExplaining && game.speakerId !== myPlayer.id && (
              <button
                onClick={handleClaimSpeaker}
                className="mt-2 py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold active:scale-95 transition-all"
              >
                Я хочу объяснять слово!
              </button>
            )}
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300/90 text-xs leading-relaxed text-left">
            💡 <strong>Совет спикеру:</strong> объясняйте через нестандартные метафоры, истории или рифмы, чтобы случайно не наступить на мину.
          </div>
        </div>
      )}

      {/* Футер-подсказка */}
      <footer className="text-center pt-2 pb-6 text-xs text-slate-500">
        Слова-мины • Соперники расставляют скрытые ловушки
      </footer>
    </div>
  );
}
