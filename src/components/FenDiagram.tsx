import { useEffect, useRef, useState } from 'react';
import { useChessPublica } from '@/lib/chesspublica';

// Ana sayfa kartları için statik ChessPublica diyagramı (<fen>). Paket yalnızca diyagram ekrana yaklaşınca yüklenir;
// o zamana kadar kare bir yer tutucu yer ayırır, sayfa kaymaz. Ham FEN metni CSS'le (.fen-diagram fen) gizlenir.
export default function FenDiagram({ fen, label }: { fen: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (near || !box.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: '600px 0px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, [near]);
  useChessPublica(near);
  return (
    <div ref={box} role="img" aria-label={label} className="fen-diagram"
      dangerouslySetInnerHTML={near ? { __html: `<fen>${fen}</fen>` } : undefined} />
  );
}
