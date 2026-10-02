// The three ways a PGN game can be shown. Icons are Lucide icons, the same
// family ChessPublica's own ribbon uses ("list-video" rather than a bare play
// triangle, "microscope" rather than a magnifier, so neither reads as a
// play/search control).

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const VIEW_CONFIG = [
  {
    key: 'pgn',
    label: 'Metin görünümü',
    icon: svg(
      '<path d="M15 5h6"/><path d="M15 12h6"/><path d="M3 19h18"/><path d="m3 12 3.553-7.724a.5.5 0 0 1 .894 0L11 12"/><path d="M3.92 10h6.16"/>'
    )
  },
  {
    key: 'pgn-player',
    label: 'Oynatıcı görünümü',
    icon: svg(
      '<path d="M21 5H3"/><path d="M10 12H3"/><path d="M10 19H3"/><path d="M15 12.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.859z"/>'
    )
  },
  {
    key: 'pgn-study',
    label: 'Analiz görünümü',
    icon: svg(
      '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>'
    )
  }
];
