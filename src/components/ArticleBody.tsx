import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { useChessPublica } from '@/lib/chesspublica';
import { curlyComments, curlyProse, watchComments } from '@/lib/curly-dom';
import ProgressiveImage from '@/components/ProgressiveImage';
import { watchLocalization } from '@/lib/localize-dom';

// Makale gövdesi: markdown metni + PGN oyun blokları + çapraz tablo + video bağlantısı.

const NAG: Record<string, string> = {
  '1': '!', '2': '?', '3': '!!', '4': '??', '5': '!?', '6': '?!',
  '10': '=', '13': '∞', '14': '⩲', '15': '⩱', '16': '±', '17': '∓',
  '18': '+−', '19': '−+', '36': '↑', '40': '→', '44': '⯹', '132': '⇆', '146': 'N',
};

function parseTags(chunk: string) {
  const tags: Record<string, string> = {};
  for (const m of chunk.matchAll(/^\[(\w+)\s+"([^"]*)"\]\s*$/gm)) tags[m[1]] = m[2];
  return tags;
}

function cleanMoves(raw: string) {
  return raw
    .replace(/\[%[^\]]*\]/g, '')
    .replace(/\[[DP]\]/g, '')
    .replace(/\{\s*\}/g, '')
    .replace(/\$(\d+)/g, (_, n: string) => NAG[n] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function Game({ header, moves }: { header: string; moves: string }) {
  const t = parseTags(header);
  const result = (t.Result ?? '').replace('1/2-1/2', '½–½').replace(/-/g, '–');
  const parts = cleanMoves(moves).split(/(\{[^}]*\})/g).filter(Boolean);
  return (
    <figure className="border-t border-[#2E2620] pt-4 pb-4">
      <figcaption className="f-mono text-[#C8893E] leading-relaxed">
        {t.Round && <span>{t.Round}. tur · </span>}
        {t.White} {t.WhiteElo && `(${t.WhiteElo})`} — {t.Black} {t.BlackElo && `(${t.BlackElo})`} · {result}
      </figcaption>
      <p className="mt-4 text-[17px] leading-[1.9] text-[#F1E9DC]/85" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {parts.map((p, i) =>
          p.startsWith('{') ? (
            <span key={i} className="italic text-[#A89A88]"> {p.slice(1, -1).trim()} </span>
          ) : (
            <Fragment key={i}>{p}</Fragment>
          ),
        )}
      </p>
    </figure>
  );
}

// Bulmaca işareti: yorumda [P] ya da [P2] (çözülecek yarım hamle sayısı).
const PUZZLE_MARK = /\[P\s*\d*\]/;

// Ana hattaki ilk [P] işaretinde hamle sırası kimdeyse onu döndürür ('w' | 'b'); işaret yoksa null.
function puzzleSide(header: string, moves: string): 'w' | 'b' | null {
  const fen = header.match(/\[FEN\s+"([^"]+)"\]/i)?.[1];
  const blackFirst = fen ? fen.split(' ')[1] === 'b' : false;
  let plies = 0;
  let depth = 0;
  const re = /\{[^}]*\}|[()]|\$\d+|\d+\.+|1-0|0-1|1\/2-1\/2|\*|[^\s(){}]+/g;
  for (const m of moves.matchAll(re)) {
    const t = m[0];
    if (t === '(') depth++;
    else if (t === ')') depth--;
    else if (t[0] === '{') { if (depth === 0 && PUZZLE_MARK.test(t)) return (plies % 2 === 0) !== blackFirst ? 'w' : 'b'; }
    else if (depth === 0 && /^[A-Za-z]/.test(t) && !/^\d/.test(t)) plies++;
  }
  return null;
}

// ChessPublica <pgn> öğesini çizerken DOM'u kendisi değiştirdiği için oyun, React'in içine
// dokunmadığı bir kutuda (dangerouslySetInnerHTML) durur. [P] işaretli oyunlar <pgn-player>
// ile çizilir (bulmaca görünümü); ilk işaret Siyah'ın hamlesindeyse tahta Siyah tarafından açılır.
function PgnGame({ header, moves }: { header: string; moves: string }) {
  const side = puzzleSide(header, moves);
  const head = side === 'b' && !/\[Orientation\s/i.test(header) ? `${header.trim()}\n[Orientation "black"]` : header.trim();
  const raw = `${head}\n\n${moves.trim()}`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const tag = side ? 'pgn-player' : 'pgn';
  return <div className="cp-game pb-4" dangerouslySetInnerHTML={{ __html: `<${tag}>\n${raw}\n</${tag}>` }} />;
}

// İçindekiler: yazıdaki tüm oyunlar, [Event] başlıklarından otomatik çıkarılır.
type TocItem = { id: string; round: string; label: string; result: string };

function surname(name?: string) {
  return (name ?? '').split(',')[0].trim();
}

function gameToc(chunks: string[]): TocItem[] {
  const items: TocItem[] = [];
  chunks.forEach((c) => {
    if (!c.trim().startsWith('[Event ')) return;
    const t = parseTags(c);
    const n = items.length + 1;
    items.push({
      id: `oyun-${t.Round || n}`,
      round: t.Round || String(n),
      label: `${surname(t.White)} – ${surname(t.Black)}`,
      result: (t.Result ?? '').replace('1/2-1/2', '½–½').replace(/-/g, '–'),
    });
  });
  return items;
}

function Toc({ items, allOpen, onGo, onAll }: { items: TocItem[]; allOpen: boolean; onGo: (id: string) => void; onAll: (open: boolean) => void }) {
  const btn = 'f-mono text-[#A89A88] hover:text-[#C8893E] transition-colors';
  return (
    <nav aria-label="İçindekiler" className="mt-16 mb-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h3 className="f-display text-3xl md:text-4xl text-[#F1E9DC]">İçindekiler</h3>
        <div className="pb-1">
          <button type="button" onClick={() => onAll(!allOpen)} className={btn}>{allOpen ? 'Tümünü kapat' : 'Tümünü aç'}</button>
        </div>
      </div>
      <ol className="border-t border-[#2E2620]">
        {items.map((it) => (
          <li key={it.id} className="border-b border-[#2E2620]">
            <a href={`#${it.id}`} onClick={(e) => { e.preventDefault(); onGo(it.id); }}
              className="group flex items-baseline gap-4 py-3 text-[#F1E9DC]/85 hover:text-[#C8893E] transition-colors">
              <span className="f-mono text-[#C8893E] w-[5rem] shrink-0">{it.round}. tur</span>
              <span className="flex-1">{it.label}</span>
              <span className="f-mono text-[#A89A88] group-hover:text-[#C8893E]">{it.result}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Katlanabilir oyun kutusu. İçerik kapalıyken de DOM'da kalır (satır yüksekliği 0'a iner), böylece
// ChessPublica tahtaları gizliyken değil, gerçek genişlikte çizer; kapalı içerik `inert` ile erişilemez olur.
function GameBox({ item, open, onToggle, children }: { item: TocItem; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    if (open) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [open]);
  const regionId = `${item.id}-icerik`;
  return (
    <section id={item.id} className="my-4 border-b border-[#2E2620] scroll-mt-8">
      <h4>
        <button type="button" aria-expanded={open} aria-controls={regionId} onClick={onToggle}
          className="group flex w-full items-baseline gap-4 py-4 text-left text-[#F1E9DC]/90 hover:text-[#C8893E] transition-colors">
          <span className="f-mono text-[#C8893E] w-[5rem] shrink-0">{item.round}. tur</span>
          <span className="flex-1">{item.label}</span>
          <span className="f-mono text-[#A89A88] group-hover:text-[#C8893E]">{item.result}</span>
          <ChevronDown aria-hidden size={18} className={`self-center shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
      </h4>
      <div id={regionId} className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div ref={inner} className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

// Markdown resim bloğu: ![alt](yol "açıklama") — açıklama satır içi markdown (bağlantı) içerebilir.
// Yol göreliyse sitenin kök adresine (BASE_URL) göre çözülür. Resim, makale sütununda ortalanır.
const IMG_CHUNK = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([\s\S]*)")?\)$/;

const captionOptions = {
  forceInline: true,
  overrides: { a: { props: { className: 'underline underline-offset-2 hover:text-[#F1E9DC]', target: '_blank', rel: 'noreferrer' } } },
};

function Figure({ chunk }: { chunk: string }) {
  const m = chunk.match(IMG_CHUNK);
  if (!m) return null;
  const [, alt, path, caption] = m;
  return (
    <figure className="my-10 mx-auto w-fit max-w-full">
      <ProgressiveImage path={path} alt={alt} />
      {caption && (
        <figcaption className="credit mt-3 w-0 min-w-full text-[#A89A88]">
          <Markdown options={captionOptions}>{caption}</Markdown>
        </figcaption>
      )}
    </figure>
  );
}

// YouTube videosu: markdown'daki <figure class="video-embed"> bloğundan video kimliği, başlangıç saniyesi,
// başlık ve açıklama okunur; gizlilik dostu youtube-nocookie alan adıyla gömülü oynatıcı çizilir.
function Video({ chunk }: { chunk: string }) {
  const id = chunk.match(/embed\/([\w-]+)(?:\?start=(\d+))?/);
  if (!id) return null;
  const title = chunk.match(/<iframe[^>]*\btitle="([^"]*)"/)?.[1] ?? 'YouTube videosu';
  const capLines = (chunk.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1] ?? '')
    .split(/<br\s*\/?>/)
    .map((l) => l.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  const src = `https://www.youtube-nocookie.com/embed/${id[1]}${id[2] ? `?start=${id[2]}` : ''}`;
  const href = `https://www.youtube.com/watch?v=${id[1]}${id[2] ? `&t=${id[2]}s` : ''}`;
  return (
    <figure className="my-10 mx-auto w-full md:max-w-[600px]">
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allowFullScreen
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <figcaption className="credit mt-3 text-[#A89A88]">
        {capLines.map((l) => (/[.!?…]$/.test(l) ? l : `${l}.`)).join(' ')}{' '}
        <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#F1E9DC]">YouTube'da aç</a>
      </figcaption>
    </figure>
  );
}

const mdOptions = {
  overrides: {
    h3: { props: { className: 'f-display text-4xl md:text-5xl mt-16 mb-6 text-[#F1E9DC]' } },
    a: { props: { className: 'text-[#C8893E] underline underline-offset-4', target: '_blank', rel: 'noreferrer' } },
    blockquote: { props: { className: 'my-8 border-l-2 border-[#C8893E] pl-6 italic text-[#F1E9DC]/75' } },
    strong: { props: { className: 'font-semibold text-[#F1E9DC]' } },
  },
};

// Markdown dosyasını paragraf bloklarına böler. Giriş (dek) metni articles.json'dan gelir;
// dosyanın hiçbir paragrafı sayfadan ayrılmaz.
export function splitArticle(md: string) {
  return { chunks: md.trim().split(/\n\s*\n/) };
}

export default function ArticleBody({ chunks }: { chunks: string[] }) {
  const hasGames = chunks.some((c) => c.trim().startsWith('[Event '));
  const cp = useChessPublica(hasGames);
  // ChessPublica yüklenemezse eski düz metin görünümüne düşülür.
  const useFallback = cp === 'error';
  const toc = gameToc(chunks);
  // Oyunlar varsayılan olarak kapalıdır; açık olanların kimlikleri burada tutulur.
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const setOpen = (id: string, open: boolean) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id); else next.delete(id);
      return next;
    });
  const openAll = (open: boolean) => setOpenIds(open ? new Set(toc.map((t) => t.id)) : new Set());
  // Tembel yüklenen fotoğraflar kaydırma sırasında sayfa yüksekliğini değiştirir; bu yüzden kaydırma
  // bittikten sonra konum (scroll-mt-8 = 32 px) gerekirse yeniden düzeltilir.
  const scrollToGame = (id: string, smooth: boolean) => {
    const go = (behavior: ScrollBehavior) => document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
    go(smooth ? 'smooth' : 'auto');
    [900, 1800].forEach((ms) =>
      window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el && Math.abs(el.getBoundingClientRect().top - 32) > 4) go('auto');
      }, ms),
    );
  };
  const goTo = (id: string) => {
    setOpen(id, true);
    window.setTimeout(() => {
      scrollToGame(id, true);
      window.history.replaceState(null, '', `#${id}`);
    }, 60);
  };
  let gameNo = 0;
  let tocPlaced = false;
  const out: JSX.Element[] = [];

  // Curly quotes: yazı metni ve oyunların YORUMLARI (hamle metni değil). ChessPublica yorumları geç çizdiği için
  // gözlemci bağlanır; oyunlar hazır olunca son bir geçiş daha yapılır.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    curlyProse(el);
    curlyComments(el);
    const stopCurly = watchComments(el);
    const stopLocalize = watchLocalization(el);
    return () => { stopCurly(); stopLocalize(); };
  }, [chunks]);
  useEffect(() => {
    const el = rootRef.current;
    if (el && (cp === 'ready' || cp === 'error')) {
      curlyProse(el);
      curlyComments(el);
    }
  }, [cp]);

  // Adresteki #oyun-N bağlantısı ile açılırsa, oyunlar çizildikten sonra o oyunu açar ve kaydırır.
  useEffect(() => {
    if (cp !== 'ready' && cp !== 'error') return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    if (toc.some((t) => t.id === id)) setOpen(id, true);
    window.setTimeout(() => scrollToGame(id, false), 80);
  }, [cp]); // eslint-disable-line react-hooks/exhaustive-deps

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i].trim();
    if (toc.length && !tocPlaced && c.startsWith('### ')) {
      out.push(<Toc key="toc" items={toc} allOpen={toc.length > 0 && openIds.size === toc.length} onGo={goTo} onAll={openAll} />);
      tocPlaced = true;
    }
    if (c.startsWith('[Event ')) {
      const item = toc[gameNo++];
      const game = useFallback
        ? <Game header={c} moves={chunks[i + 1] ?? ''} />
        : <PgnGame header={c} moves={chunks[i + 1] ?? ''} />;
      out.push(
        <GameBox key={i} item={item} open={openIds.has(item.id)} onToggle={() => setOpen(item.id, !openIds.has(item.id))}>
          {game}
        </GameBox>,
      );
      i++;
    } else if (c.startsWith('<pre>')) {
      out.push(
        <pre key={i} className="crosstable my-10 overflow-x-auto">
          {c.replace(/<\/?pre>/g, '').replace(/^\n/, '')}
        </pre>,
      );
    } else if (IMG_CHUNK.test(c)) {
      out.push(<Figure key={i} chunk={c} />);
    } else if (c.startsWith('<figure')) {
      out.push(<Video key={i} chunk={c} />);
    } else {
      out.push(
        <div key={i} className="[&>p]:mb-6 [&>h3]:mb-6">
          <Markdown options={{ ...mdOptions, forceBlock: true }}>{c}</Markdown>
        </div>,
      );
    }
  }
  if (toc.length && !tocPlaced) out.unshift(<Toc key="toc" items={toc} allOpen={toc.length > 0 && openIds.size === toc.length} onGo={goTo} onAll={openAll} />);
  return (
    <div ref={rootRef} className="text-lg leading-[1.8] text-[#F1E9DC]/85" data-cp={cp}>
      {out}
    </div>
  );
}
