import { useEffect, useState } from 'react';

// ChessPublica (https://chesspublica.github.io) — <pgn> öğelerini etkileşimli oyun görünümüne çevirir.
// Paket (jQuery + chess.js + chessboard.js + ChessPublica) bu repo'da public/chesspublica/ altında durur
// ve yalnızca oyun içeren sayfalarda yüklenir. Paket üzerinde yapılan düzeltmeler:
//  - pgn-player.js'i yüklemeye çalışan, tek dosya paketinde hata fırlatan blok kaldırıldı;
//  - global nesneye window.ChessPublica takma adı eklendi (paket yalnızca window.JekyllChess veriyordu).
const BASE = `${import.meta.env.BASE_URL}chesspublica`;

type CP = { initAll: () => void };
declare global {
  interface Window { ChessPublica?: CP }
}

let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if (window.ChessPublica) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${BASE}/ChessPublica.all.min.css`;
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = `${BASE}/ChessPublica.all.min.js`;
    js.async = true;
    js.onload = () => resolve();
    js.onerror = () => { loading = null; reject(new Error('ChessPublica yüklenemedi')); };
    document.head.appendChild(js);
  });
  return loading;
}

/** `active` true iken ChessPublica'yı yükler ve sayfadaki <pgn> öğelerini çizdirir. */
export function useChessPublica(active: boolean) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setStatus('loading');
    load()
      .then(() => {
        if (cancelled) return;
        window.ChessPublica?.initAll();
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [active]);
  return status;
}
