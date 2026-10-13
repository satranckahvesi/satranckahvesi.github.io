// <pgn-player> yorumlarının sonundaki oynat düğmesini yorum metninin son satırına taşır (satır içi öğe gibi):
// satır sonunda yer varsa metnin hemen yanında, yoksa bir alt satırda durur. Düğme her adımda yeniden oluşturulduğu
// için taşıma, eklenen düğmeler izlenerek yapılır. Varyant içeren yorumlarda düğme olduğu yerde (altta) kalır.
const GAME = '.cp-game';

function move(btn: Element) {
  const comment = btn.parentElement;
  if (!comment?.classList.contains('video-comment') || !comment.closest(GAME)) return;
  if (comment.querySelector('.variation-block')) return;
  const bodies = comment.querySelectorAll('.comment-body');
  // Düğmeden önce sıradan bir boşluk: satır sonunda yer varsa metinle arasında boşluk kalır, bir alt satıra inerse
  // boşluk satır sonunda erir ve düğme metinle aynı sol kenardan başlar (margin kullanılırsa girinti kalırdı).
  bodies[bodies.length - 1]?.append(document.createTextNode(' '), btn);
}

export function watchInlinePlay(root: Element) {
  const scan = (el: Element) => {
    if (el.matches('.comment-play-btn')) move(el);
    el.querySelectorAll('.video-comment > .comment-play-btn').forEach(move);
  };
  scan(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((n) => n.nodeType === Node.ELEMENT_NODE && scan(n as Element));
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
