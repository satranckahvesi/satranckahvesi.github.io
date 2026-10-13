import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import ArticleBody from '@/components/ArticleBody';
import PhotoCredit, { PHOTO } from '@/components/PhotoCredit';
import { articleBySlug } from '@/data/articles';
import NotFound from './NotFound';
import '../site.css';

export default function Post() {
  const { slug } = useParams();
  const a = articleBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!a) return;
    const prev = document.title;
    document.title = `${a.title} — Satranç vs.`;
    return () => { document.title = prev; };
  }, [a]);

  if (!a) return <NotFound />;

  return (
    <div className="sk min-h-screen bg-[#0E0C0A]">
      <Link to="/" aria-label="Ana sayfaya dön" className="fixed top-5 right-5 z-10 w-12 h-12 rounded-full bg-[#F1E9DC] text-[#0E0C0A] grid place-items-center hover:bg-[#C8893E]"><X /></Link>
      <article className="max-w-[760px] mx-auto px-6 pt-32 relative pb-32">
        <p className="f-mono text-[#C8893E]">{a.cat} · {a.read ? `${a.read} okuma` : a.date}</p>
        <h1 className="f-display text-[clamp(44px,6vw,88px)] mt-6">{a.title}</h1>
        {a.dek && <p className="text-xl text-[#F1E9DC]/80 mt-8 italic" style={{ fontFamily: 'Fraunces, serif' }}>{a.dek}</p>}
        <p className="f-mono text-[#A89A88] mt-8 pb-8 border-b border-[#2E2620]">Yazan: {a.author}</p>
        {a.photo && (
          <figure className="mt-10">
            <img src={PHOTO.src} alt={PHOTO.alt} className="w-full h-auto grayscale" />
            <figcaption className="mt-3"><PhotoCredit full /></figcaption>
          </figure>
        )}
        <div className="mt-10 space-y-6 text-lg leading-[1.8] text-[#F1E9DC]/85">
          {a.chunks ? <ArticleBody chunks={a.chunks} /> : a.body.map((p, i) => <p key={i} className={i === 0 ? 'first-letter:f-display first-letter:text-7xl first-letter:float-left first-letter:mr-3 first-letter:text-[#C8893E] first-letter:leading-[0.8]' : ''}>{p}</p>)}
        </div>
      </article>
    </div>
  );
}
