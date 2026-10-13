import { Fragment } from 'react';
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

function Game({ header, moves }: { header: string; moves: string }) {
  const t = parseTags(header);
  const result = (t.Result ?? '').replace('1/2-1/2', '½–½').replace(/-/g, '–');
  const parts = cleanMoves(moves).split(/(\{[^}]*\})/g).filter(Boolean);
  return (
    <figure className="my-10 border-y border-[#2E2620] py-6">
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
function PgnGame({ header, moves }: { header: string; moves: string }) {
  const raw = `${header.trim()}\n\n${moves.trim()}`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return <div className="cp-game my-10" dangerouslySetInnerHTML={{ __html: `<pgn>\n${raw}\n</pgn>` }} />;
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
  const out: JSX.Element[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i].trim();
    if (c.startsWith('[Event ')) {
      out.push(useFallback
        ? <Game key={i} header={c} moves={chunks[i + 1] ?? ''} />
        : <PgnGame key={i} header={c} moves={chunks[i + 1] ?? ''} />);
      i++;
    } else if (c.startsWith('<pre>')) {
      out.push(
        <pre key={i} className="my-10 overflow-x-auto f-mono !normal-case !tracking-normal text-[13px] leading-6 text-[#F1E9DC]/85">
          {c.replace(/<\/?pre>/g, '').replace(/^\n/, '')}
        </pre>,
      );
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
