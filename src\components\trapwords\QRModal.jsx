// src/components/trapwords/QRModal.jsx
import React from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';

export default function QRModal({ roomCode, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${window.location.origin}/?room=${roomCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=240x240&bgcolor=0f172a&color=38bdf8&qzone=2`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          Подключение к столу
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Наведите камеру телефона на QR-код или поделитесь ссылкой
        </p>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl inline-block mb-4 shadow-inner">
          <img
            src={qrUrl}
            alt={`QR для стола ${roomCode}`}
            className="w-52 h-52 mx-auto rounded-lg"
          />
        </div>

        <div className="text-2xl font-black tracking-widest text-sky-400 mb-4 font-mono">
          СТОЛ № {roomCode}
        </div>

        <button
          onClick={copyLink}
          className="w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-emerald-300" />
              <span>Ссылка скопирована!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Скопировать ссылку</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
