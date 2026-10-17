import { useEffect, useRef, useState } from 'react';
import { useChessPublica } from '@/lib/chesspublica';

const MAX = 640;

// Ana sayfa kartları için statik ChessPublica diyagramı (<fen>). Paket yalnızca diyagram ekrana yaklaşınca yüklenir;
// o zamana kadar yer tutucu yer ayırır, sayfa kaymaz. Ham FEN metni CSS'le (.fen-diagram fen) gizlenir.
//
// Tahta kutunun sağına yaslanır; `caption` tahtanın altına, sağa yaslı bir bilgi satırı olarak girer.
// `fill`: md ve üstünde kartın kalan yüksekliğini doldurur (kart, ızgara satırlarının yüksekliğine esner; böylece soldaki kart
// sağdaki kartlarla aynı boyda biter). Tahta, kutunun genişliği ve yüksekliğinden küçük olanına göre kare çizilir. Kutunun
// içeriği mutlak konumlu olduğu için kartın doğal yüksekliğine katılmaz ve ızgara satırlarını büyütmez. ChessPublica tahtayı
// çizildiği andaki genişliğe göre kurar, bu yüzden boyut değişince <fen> yeniden kurulur (key).
export default function FenDiagram({ fen, label, caption, orientation, fill = false }: { fen: string; label: string; caption?: string; orientation?: 'white' | 'black'; fill?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  const [size, setSize] = useState(0);
  useEffect(() => {
    if (near || !box.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: '600px 0px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, [near]);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let t: number | undefined;
    const ro = new ResizeObserver(([e]) => {
      const s = Math.floor(Math.min(e.contentRect.width, e.contentRect.height, MAX));
      window.clearTimeout(t);
      t = window.setTimeout(() => setSize((prev) => (Math.abs(prev - s) >= 2 ? s : prev)), 120);
    });
    ro.observe(el);
    return () => { window.clearTimeout(t); ro.disconnect(); };
  }, []);
  const status = useChessPublica(near);
  // Boyut değişince yeni <fen> kurulur; paket zaten yüklüyse yeniden taratılır.
  useEffect(() => { if (status === 'ready' && size > 0) window.ChessPublica?.initAll(); }, [status, size]);
  return (
    <div className={`fen-wrap${fill ? ' fen-fill' : ''}`}>
      <div ref={box} role="img" aria-label={label} className="fen-diagram">
        {near && size > 0 && (
          <div key={size} className="absolute right-0 top-0" style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: `<fen${orientation ? ` orientation="${orientation}"` : ''}>${fen}</fen>` }} />
        )}
      </div>
      {/* Tahta sağa yaslıdır; alt yazı da sağa yaslanır ve tahtadan geniş olmaz. */}
      {caption && <p className="f-mono normal-case text-[#A89A88] text-right ml-auto mt-3" style={size > 0 ? { maxWidth: size } : undefined}>{caption}</p>}
    </div>
  );
}
