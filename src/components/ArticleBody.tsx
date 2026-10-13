import { Fragment, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { useChessPublica } from '@/lib/chesspublica';

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

function Game({ header, moves, id }: { header: string; moves: string; id?: string }) {
  const t = parseTags(header);
  const result = (t.Result ?? '').replace('1/2-1/2', '½–½').replace(/-/g, '–');
  const parts = cleanMoves(moves).split(/(\{[^}]*\})/g).filter(Boolean);
  return (
    <figure id={id} className="my-10 border-y border-[#2E2620] py-6 scroll-mt-8">
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

// ChessPublica <pgn> öğesini çizerken DOM'u kendisi değiştirdiği için oyun, React'in içine
// dokunmadığı bir kutuda (dangerouslySetInnerHTML) durur.
function PgnGame({ header, moves, id }: { header: string; moves: string; id?: string }) {
  const raw = `${header.trim()}\n\n${moves.trim()}`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return <div id={id} className="cp-game my-10 scroll-mt-8" dangerouslySetInnerHTML={{ __html: `<pgn>\n${raw}\n</pgn>` }} />;
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

function goTo(e: React.MouseEvent, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}

function Toc({ items }: { items: TocItem[] }) {
  return (
    <nav aria-label="İçindekiler" className="mt-16 mb-10">
      <h3 className="f-display text-3xl md:text-4xl mb-6 text-[#F1E9DC]">İçindekiler</h3>
      <ol className="border-t border-[#2E2620]">
        {items.map((it) => (
          <li key={it.id} className="border-b border-[#2E2620]">
            <a href={`#${it.id}`} onClick={(e) => goTo(e, it.id)}
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
  const src = /^(https?:)?\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
  return (
    <figure className="my-10 mx-auto w-fit max-w-full">
      <img src={src} alt={alt} loading="lazy" className="block mx-auto w-auto h-auto max-w-full max-h-[720px] md:max-w-[600px] grayscale" />
      {caption && (
        <figcaption className="mt-3 w-0 min-w-full text-[11px] leading-relaxed text-[#A89A88]">
          <Markdown options={captionOptions}>{caption}</Markdown>
        </figcaption>
      )}
    </figure>
  );
}

function Video({ chunk }: { chunk: string }) {
  const id = chunk.match(/embed\/([\w-]+)(?:\?start=(\d+))?/);
  const cap = chunk.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').trim();
  if (!id) return null;
  const href = `https://www.youtube.com/watch?v=${id[1]}${id[2] ? `&t=${id[2]}s` : ''}`;
  return (
    <p className="my-8 border-l-2 border-[#C8893E] pl-5 text-[#F1E9DC]/75">
      <a href={href} target="_blank" rel="noreferrer" className="text-[#C8893E] underline underline-offset-4">Videoyu YouTube'da izle</a>
      {cap && <span className="block mt-2 text-base">{cap}</span>}
    </p>
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
  let gameNo = 0;
  let tocPlaced = false;
  const out: JSX.Element[] = [];

  // Adresteki #oyun-N bağlantısı ile açılırsa, oyunlar çizildikten sonra o oyuna kaydırır.
  useEffect(() => {
    if (cp !== 'ready' && cp !== 'error') return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [cp]);

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i].trim();
    if (toc.length && !tocPlaced && c.startsWith('### ')) {
      out.push(<Toc key="toc" items={toc} />);
      tocPlaced = true;
    }
    if (c.startsWith('[Event ')) {
      const id = toc[gameNo++]?.id;
      out.push(useFallback
        ? <Game key={i} id={id} header={c} moves={chunks[i + 1] ?? ''} />
        : <PgnGame key={i} id={id} header={c} moves={chunks[i + 1] ?? ''} />);
      i++;
    } else if (c.startsWith('<pre>')) {
      out.push(
        <pre key={i} className="my-10 overflow-x-auto f-mono !normal-case !tracking-normal text-[13px] leading-6 text-[#F1E9DC]/85">
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
  if (toc.length && !tocPlaced) out.unshift(<Toc key="toc" items={toc} />);
  return (
    <div className="text-lg leading-[1.8] text-[#F1E9DC]/85" data-cp={cp}>
      {out}
      {hasGames && !useFallback && (
        <p className="mt-12 text-[11px] leading-relaxed text-[#A89A88]">
          Satranç tahtaları ChessPublica ile çizilmiştir (MIT). Taş görselleri: Colin M.L. Burnett,{' '}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.tr" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#F1E9DC]">CC BY-SA 3.0</a>.
        </p>
      )}
    </div>
  );
}
