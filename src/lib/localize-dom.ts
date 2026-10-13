// ChessPublica'nın <pgn-player> öğesindeki sabit İngilizce arayüz metinlerini Türkçeleştirir
// (eski sitedeki localize.js'in karşılığı). Metinler seçeneksiz gömülü olduğundan çizildikçe çevrilir.
const GAME = '.cp-game';

const LABELS = new Map([
  ['Show solution move', 'Çözümü göster'],
  ['Settings', 'Ayarlar'],
  ['Download PGN', 'PGN’i indir'],
  ['Flip board', 'Tahtayı çevir'],
  ['Playback speed', 'Oynatma hızı'],
  ['Play', 'Oynat'],
  ['Replay', 'Yeniden oynat'],
  ['Pause', 'Duraklat'],
  ['Play variation', 'Varyantı oynat'],
  ['Pause variation', 'Varyantı duraklat'],
]);

const HINT_RE = /^Find the best move for (White|Black)\.$/;
const HINT = { White: 'Beyaz için en iyi hamleyi bulun.', Black: 'Siyah için en iyi hamleyi bulun.' };

function localizeHint(el: Element) {
  const m = HINT_RE.exec(el.textContent ?? '');
  if (m) el.textContent = HINT[m[1] as 'White' | 'Black'];
}

function localizeLabels(el: Element) {
  for (const attr of ['aria-label', 'title']) {
    const value = el.getAttribute(attr);
    const tr = value && LABELS.get(value);
    if (tr) el.setAttribute(attr, tr);
  }
}

function localizeTree(el: Element) {
  if (el.matches('.puzzle-hint-text')) localizeHint(el);
  if (el.hasAttribute('aria-label') || el.hasAttribute('title')) localizeLabels(el);
  el.querySelectorAll('.puzzle-hint-text').forEach(localizeHint);
  el.querySelectorAll('[aria-label], [title]').forEach(localizeLabels);
}

/** Oyunlardaki arayüz metinlerini çevirir ve sonradan eklenen/yeniden yazılanları da izler. Durdurma işlevi döndürür. */
export function watchLocalization(root: Element) {
  root.querySelectorAll(GAME).forEach(localizeTree);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : (record.target as Element);
      if (!target?.closest(GAME)) continue;
      if (record.type === 'attributes') localizeLabels(target);
      else if (record.type === 'characterData') {
        const hint = target.closest('.puzzle-hint-text');
        if (hint) localizeHint(hint);
      } else {
        // İpucu metni yerinde yeniden yazılır (textContent = ...): hedef ipucu öğesinin kendisidir.
        const hint = target.closest('.puzzle-hint-text');
        if (hint) localizeHint(hint);
        record.addedNodes.forEach((n) => n.nodeType === Node.ELEMENT_NODE && localizeTree(n as Element));
      }
    }
  });
  observer.observe(root, { childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title'], subtree: true });
  return () => observer.disconnect();
}
