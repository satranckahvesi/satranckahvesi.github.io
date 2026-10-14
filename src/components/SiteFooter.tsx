import { Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const WORDMARK_CLASS = 'block w-full f-display text-[17vw] leading-[1] whitespace-nowrap text-center pt-6 pb-[2vw] hover:opacity-80 transition-opacity';

const Wordmark = () => <>Satranç <em className="italic text-[#C8893E]">vs.</em></>;

// `page`: ana sayfada iletişim satırı görünür, büyük yazı yukarı kaydırır; yazı sayfalarında iletişim gizlidir, büyük yazı ana sayfaya gider.
export default function SiteFooter({ page = 'home' }: { page?: 'home' | 'post' }) {
  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  return (
    <footer className="border-t border-[#2E2620]">
      {page === 'home' && (
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row justify-between gap-6">
        <p className="f-mono text-[#A89A88]">İletişim: <a href="mailto:editor@satrancvs.com" className="text-[#F1E9DC] hover:text-[#C8893E]">editor@satrancvs.com</a></p>
        <div className="flex gap-3">
          {[[Instagram, 'Instagram', 'https://instagram.com/satrancvs'], [Twitter, 'X', 'https://x.com/satrancvs'], [Youtube, 'YouTube', 'https://youtube.com/@satrancvs']].map(([Icon, l, href]) => {
            const I = Icon as typeof Instagram;
            return <a key={l as string} href={href as string} target="_blank" rel="noreferrer" aria-label={l as string} className="w-11 h-11 rounded-full border border-[#2E2620] grid place-items-center hover:bg-[#C8893E] hover:text-[#0E0C0A]"><I size={18} /></a>;
          })}
        </div>
      </div>
      )}
      <div className={`overflow-hidden ${page === 'home' ? 'border-t border-[#2E2620]' : ''}`}>
        {page === 'home'
          ? <button type="button" onClick={toTop} aria-label="Sayfanın başına dön" className={WORDMARK_CLASS}><Wordmark /></button>
          : <Link to="/" aria-label="Ana sayfaya git" className={WORDMARK_CLASS}><Wordmark /></Link>}
      </div>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-6 flex justify-between f-mono text-[#A89A88]">
        <span>© 2026 Satranç vs. Dergisi</span>
      </div>
    </footer>
  );
}
