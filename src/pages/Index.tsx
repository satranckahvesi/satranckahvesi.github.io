import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu as MenuIcon, X, Instagram, Twitter, Youtube, Mail } from 'lucide-react';
import '../site.css';

const NAV = [
  ['Kapak', 'kapak'],
  ['Yazılar', 'yazilar'],
  ['Kategoriler', 'kategoriler'],
  ['Yazarlar', 'yazarlar'],
  ['Hakkında', 'hakkinda'],
] as const;

type Article = { id: string; cat: string; title: string; dek: string; author: string; read: string; body: string[] };

const ARTICLES: Article[] = [
  { id: 'kapak', cat: 'Kapak Dosyası', title: 'Şahın yalnızlığı: Oyunsonunda karar vermek', dek: 'Tahtada az taş kaldığında asıl oyun başlar. Oyunsonunun sessiz matematiği üzerine uzun bir okuma.', author: 'Deniz Arslan', read: '14 dk',
    body: ['Oyunsonu, satrancın en dürüst evresidir. Tuzaklar azalır, taktik gürültü diner; geriye hesap, sabır ve bir planın ne kadar sağlam olduğunu gösteren çıplak bir tahta kalır.', 'Capablanca öğrencilerine oyunsonuyla başlamalarını öğütlerdi. Çünkü az taşla çalışmak, her taşın gerçek değerini görmeyi öğretir.', 'Bu dosyada üç klasik pozisyonu ve modern motorların bize bu pozisyonlar hakkında öğrettiklerini inceliyoruz.'] },
  { id: 'roportaj', cat: 'Röportaj', title: '“Kaybetmeyi öğrenmeden ustalaşamazsın”', dek: 'Genç bir büyükusta ile hazırlık, yorgunluk ve turnuva psikolojisi üzerine.', author: 'Selin Kaya', read: '11 dk',
    body: ['Bir turnuvanın son turunda, saat düşerken neler hissedilir? Konuğumuz kariyerinin dönüm noktalarını anlatıyor.', '“İlk yıllarda her yenilgi bir hakaret gibiydi. Sonra fark ettim ki en çok kaybettiğim partilerden öğreniyorum.”'] },
  { id: 'analiz', cat: 'Analiz', title: 'Kale oyunsonlarında Lucena köprüsü', dek: 'Her kulüp oyuncusunun bilmesi gereken pozisyonu adım adım çözüyoruz.', author: 'Kerem Aydın', read: '8 dk',
    body: ['Lucena pozisyonu, piyonu yedinci yataya ulaşmış kale oyunsonlarında kazanç tekniğidir.', 'Anahtar fikir: kaleyi dördüncü yataya getirip şaha bir “köprü” kurmak. Böylece rakip kalenin yandan şahları kesilir.'] },
  { id: 'tarih', cat: 'Tarih', title: 'İstanbul kahvehanelerinde satrancın yüz yılı', dek: 'Osmanlı’dan Cumhuriyet’e, masa başında oynanan partilerin izinde.', author: 'Ayşe Demir', read: '16 dk',
    body: ['19. yüzyıl sonunda İstanbul’da satranç, belirli kahvehanelerde toplanan meraklıların oyunuydu.', 'Arşiv kayıtları ve eski gazete sütunları üzerinden bu kayıp kültürü yeniden kuruyoruz.'] },
  { id: 'acilis', cat: 'Açılışlar', title: 'Damı Gambiti’nin yeniden doğuşu', dek: 'Klasik bir açılış, modern motorlarla nasıl yeni bir hayat buldu?', author: 'Kerem Aydın', read: '10 dk',
    body: ['Damı Gambiti yüz yılı aşkın süredir üst düzey satrancın merkezinde.', 'Bu yazıda ana varyantları ve son yıllarda öne çıkan yan yolları inceliyoruz.'] },
  { id: 'turnuva', cat: 'Turnuva', title: 'Bir hafta sonunda dokuz tur', dek: 'Açık turnuvaların yorucu ve büyüleyici dünyasından notlar.', author: 'Selin Kaya', read: '7 dk',
    body: ['Sabah dokuzda başlayan ilk tur, gece yarısına doğru biten son parti…', 'Açık turnuvalar, satrancın en demokratik sahnesi.'] },
  { id: 'blitz', cat: 'Analiz', title: 'Blitzde zaman yönetimi', dek: '3+2 tempoda saatini nasıl kullanmalısın? Pratik ilkeler.', author: 'Deniz Arslan', read: '6 dk',
    body: ['Blitzde en iyi hamle, zamanında yapılan iyi hamledir.', 'Açılışta hızlı, kritik anlarda yavaş: süreyi bütçelemenin üç kuralı.'] },
  { id: 'egitim', cat: 'Eğitim', title: 'Çocuklara satranç öğretirken', dek: 'Kuralları değil, merakı öğretmek üzerine bir eğitmenin notları.', author: 'Ayşe Demir', read: '9 dk',
    body: ['İlk derste kuralları değil, bir hikâyeyi anlatıyoruz: piyonun vezire dönüşme yolculuğunu.', 'Oyun, merak sürdükçe öğrenilir.'] },
];

const CATS = ['Tümü', ...Array.from(new Set(ARTICLES.map((a) => a.cat)))];

const AUTHORS = [
  { name: 'Deniz Arslan', role: 'Genel Yayın Yönetmeni', bio: 'FIDE Usta. Oyunsonu ve satranç felsefesi üzerine yazıyor.' },
  { name: 'Selin Kaya', role: 'Röportaj & Turnuva', bio: 'Turnuva salonlarından haber ve portreler.' },
  { name: 'Kerem Aydın', role: 'Analiz Editörü', bio: 'Açılış teorisi ve motor destekli analizler.' },
  { name: 'Ayşe Demir', role: 'Tarih & Eğitim', bio: 'Satranç tarihi araştırmacısı ve eğitmen.' },
];

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
    return () => io.disconnect();
  }, []);
}

function Label({ n, children }: { n: string; children: string }) {
  return <p className="f-mono text-[#A89A88]"><span className="text-[#C8893E]">{n}</span> — {children}</p>;
}

const CELL = 96;

function ChessGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current!;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Kare hücreler: sütun sayısı genişliğe göre seçilir, hücre kenarı genişliği tam böler.
  const cols = Math.max(1, Math.round(size.w / CELL));
  const s = size.w / cols;
  const rows = s > 0 ? Math.ceil(size.h / s) : 0;
  return (
    <div ref={ref} aria-hidden
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
      onMouseLeave={() => setPos({ x: -999, y: -999 })}
      className="absolute inset-0 grid overflow-hidden z-10"
      style={{ gridTemplateColumns: `repeat(${cols}, ${s}px)`, gridAutoRows: `${s}px` }}>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const d = Math.hypot((col + 0.5) * s - pos.x, (row + 0.5) * s - pos.y);
        const a = Math.max(0, 1 - d / 260);
        const dark = (col + row) % 2 === 1;
        return <div key={i} className="border-[0.5px] border-[#F1E9DC]/[0.04] transition-colors duration-500"
          style={{ backgroundColor: dark ? `rgba(14,12,10,${0.55 * (1 - a)})` : `rgba(200,137,62,${0.18 * a})` }} />;
      })}
    </div>
  );
}

function Reader({ a, onClose }: { a: Article; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal aria-label={a.title} className="fixed inset-0 z-[70] bg-[#0E0C0A] overflow-y-auto">
      <button aria-label="Yazıyı kapat" onClick={onClose} className="fixed top-5 right-5 z-10 w-12 h-12 rounded-full bg-[#F1E9DC] text-[#0E0C0A] grid place-items-center hover:bg-[#C8893E]"><X /></button>
      <article className="max-w-[760px] mx-auto px-6 pt-32 relative pb-32">
        <p className="f-mono text-[#C8893E]">{a.cat} · {a.read} okuma</p>
        <h1 className="f-display text-[clamp(44px,6vw,88px)] mt-6">{a.title}</h1>
        <p className="text-xl text-[#F1E9DC]/80 mt-8 italic" style={{ fontFamily: 'Fraunces, serif' }}>{a.dek}</p>
        <p className="f-mono text-[#A89A88] mt-8 pb-8 border-b border-[#2E2620]">Yazan: {a.author}</p>
        <div className="mt-10 space-y-6 text-lg leading-[1.8] text-[#F1E9DC]/85">
          {a.body.map((p, i) => <p key={i} className={i === 0 ? 'first-letter:f-display first-letter:text-7xl first-letter:float-left first-letter:mr-3 first-letter:text-[#C8893E] first-letter:leading-[0.8]' : ''}>{p}</p>)}
        </div>
      </article>
    </div>
  );
}

export default function Index() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('Tümü');
  const [reading, setReading] = useState<Article | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [y, setY] = useState(0);
  const [email, setEmail] = useState('');
  const [subbed, setSubbed] = useState(false);
  useReveal();
  useEffect(() => {
    const on = () => { setScrolled(window.scrollY > 40); setY(window.scrollY); };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const [cover, ...rest] = ARTICLES;
  const featured = rest.slice(0, 3);
  const list = ARTICLES.filter((a) => cat === 'Tümü' || a.cat === cat);

  return (
    <div className="sk min-h-screen overflow-x-hidden">
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0E0C0A]/90 backdrop-blur border-b border-[#2E2620]' : ''}`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <a href="#kapak" className="flex items-center gap-3">
            <span className="grid grid-cols-2 w-7 h-7 border border-[#F1E9DC]"><span className="bg-[#F1E9DC]" /><span /><span /><span className="bg-[#C8893E]" /></span>
            <span className="f-display text-2xl tracking-tight">Satranç <em className="italic">vs.</em></span>
          </a>
          <nav className="hidden lg:flex gap-10">
            {NAV.map(([l, id], i) => (
              <a key={id} href={`#${id}`} className="f-mono text-[#A89A88] hover:text-[#F1E9DC] transition-colors"><span className="text-[#C8893E]">0{i + 1}</span> {l}</a>
            ))}
          </nav>
          <a href="#bulten" className="hidden lg:inline-flex rounded-full bg-[#F1E9DC] text-[#0E0C0A] px-6 h-11 items-center text-sm font-semibold hover:bg-[#C8893E] transition-colors">Bültene Abone Ol</a>
          <button aria-label="Menüyü aç" onClick={() => setOpen(true)} className="lg:hidden w-11 h-11 grid place-items-center"><MenuIcon /></button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[60] bg-[#0E0C0A] flex flex-col p-6">
          <button aria-label="Menüyü kapat" onClick={() => setOpen(false)} className="self-end w-11 h-11 grid place-items-center"><X /></button>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {NAV.map(([l, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="f-display text-6xl">{l}</a>)}
          </div>
        </div>
      )}

      {/* KAPAK */}
      <section id="kapak" className="relative h-[100svh] min-h-[680px] overflow-hidden">
        <ChessGrid />
        <div className="absolute top-24 inset-x-0 z-20 pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between f-mono text-[#A89A88]">
            <span>Sayı 47 · Ekim 2026</span><span className="hidden sm:inline">Satranç üzerine yazılar</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 pb-12 md:pb-16">
            <p className="f-mono text-[#C8893E] mb-6">{cover.cat} — {cover.read} okuma</p>
            <h1 className="f-display text-[clamp(52px,9vw,160px)] max-w-[14ch]">
              <span className="block overflow-hidden pb-[0.2em] -mb-[0.2em]"><span className="rise">Şahın</span></span>
              <span className="block overflow-hidden pb-[0.2em] -mb-[0.2em]"><span className="rise italic text-[#C8893E]" style={{ animationDelay: '.15s' }}>yalnızlığı.</span></span>
            </h1>
            <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <p className="max-w-md text-lg text-[#F1E9DC]/80">{cover.dek} <span className="f-mono text-[#A89A88] block mt-3">Yazan: {cover.author}</span></p>
              <button onClick={() => setReading(cover)} className="pointer-events-auto inline-flex items-center gap-3 rounded-full bg-[#F1E9DC] text-[#0E0C0A] h-14 px-8 font-semibold hover:bg-[#C8893E] transition-colors self-start">Kapak dosyasını oku <ArrowUpRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ÖNE ÇIKANLAR */}
      <section id="yazilar" className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 reveal">
          <div><Label n="01">Bu Sayıda</Label>
            <h2 className="f-display text-[clamp(48px,7vw,120px)] mt-8">Öne <em className="italic text-[#C8893E]">çıkanlar.</em></h2></div>
          <p className="max-w-sm text-[#F1E9DC]/70">Analizler, röportajlar ve tarihten hikâyeler. Her ay, tahtanın ötesine bakan yazılar.</p>
        </div>
        <div className="grid md:grid-cols-12 gap-10 mt-16">
          {featured.map((a, i) => (
            <button key={a.id} onClick={() => setReading(a)}
              className={`group text-left reveal ${i === 0 ? 'md:col-span-7 md:row-span-2' : 'md:col-span-5'}`}>
              <p className="f-mono text-[#C8893E] mt-6">{a.cat} · {a.read}</p>
              <h3 className={`f-display mt-3 group-hover:italic transition-all ${i === 0 ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}`}>{a.title}</h3>
              <p className="text-[#F1E9DC]/70 mt-3 max-w-xl">{a.dek}</p>
              <p className="f-mono text-[#A89A88] mt-4">{a.author}</p>
            </button>
          ))}
        </div>
      </section>

      {/* KATEGORİLER / ARŞİV */}
      <section id="kategoriler" className="bg-[#F1E9DC] text-[#0E0C0A]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-40 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4 reveal">
            <p className="f-mono text-[#0E0C0A]/60"><span className="text-[#9A5F1E]">02</span> — Kategoriler</p>
            <h2 className="f-display text-[clamp(56px,7vw,120px)] mt-8">Tüm<br /><em className="italic">yazılar</em></h2>
            <div role="tablist" className="flex flex-wrap gap-x-6 gap-y-2 mt-12">
              {CATS.map((k) => (
                <button key={k} role="tab" aria-selected={cat === k} onClick={() => setCat(k)}
                  className={`f-mono h-11 border-b-2 transition-colors ${cat === k ? 'border-[#C8893E] text-[#0E0C0A]' : 'border-transparent text-[#0E0C0A]/50 hover:text-[#0E0C0A]'}`}>{k}</button>
              ))}
            </div>
          </div>
          <ul className="md:col-span-8">
            {list.map((a, i) => (
              <li key={cat + a.id}>
                <button onClick={() => setReading(a)} className="group w-full text-left grid grid-cols-[48px_1fr_auto] md:grid-cols-[48px_1fr_auto] items-center gap-4 md:gap-6 py-7 border-b border-[#0E0C0A]/15">
                  <span className="f-mono text-[#0E0C0A]/40">{String.fromCharCode(97 + (i % 8))}{i + 1}</span>
                  <div>
                    <p className="f-mono text-[#9A5F1E] text-[11px]">{a.cat}</p>
                    <p className="f-display text-2xl md:text-4xl mt-2 group-hover:italic group-hover:translate-x-2 transition-all duration-500">{a.title}</p>
                    <p className="text-sm text-[#0E0C0A]/60 mt-2">{a.author} · {a.read}</p>
                  </div>
                  <ArrowUpRight className="group-hover:rotate-45 transition-transform" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* YAZARLAR */}
      <section id="yazarlar" className="py-24 md:py-40">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 reveal">
          <Label n="03">Yazarlar</Label>
          <h2 className="f-display text-[clamp(48px,7vw,120px)] mt-8">Kalemi <em className="italic text-[#C8893E]">tutanlar.</em></h2>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 mt-16 grid sm:grid-cols-2 lg:grid-cols-4 border-t border-[#2E2620]">
          {AUTHORS.map((au, i) => (
            <div key={au.name} className="group p-8 border-b lg:border-b-0 sm:border-r border-[#2E2620] hover:bg-[#1A1512] transition-colors">
              <span className={`block w-14 h-14 mb-8 ${(i % 2) ? 'bg-[#F1E9DC]' : 'bg-[#3A2C22]'} grid place-items-center f-display text-3xl ${(i % 2) ? 'text-[#0E0C0A]' : 'text-[#C8893E]'}`}>{'♔♕♖♘'[i]}</span>
              <h3 className="f-display text-3xl">{au.name}</h3>
              <p className="f-mono text-[#C8893E] mt-3">{au.role}</p>
              <p className="text-[#F1E9DC]/70 mt-4">{au.bio}</p>
              <p className="f-mono text-[#A89A88] mt-6">{ARTICLES.filter((a) => a.author === au.name).length} yazı</p>
            </div>
          ))}
        </div>
      </section>

      {/* HAKKINDA + BÜLTEN */}
      <section id="hakkinda" className="max-w-[1440px] mx-auto px-6 md:px-10 pb-24 md:pb-40 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-7 reveal">
          <Label n="04">Hakkında</Label>
          <h2 className="f-display text-[clamp(40px,5.5vw,88px)] mt-8">Satranç bir oyundan fazlası; <em className="italic text-[#C8893E]">bir düşünme biçimi.</em></h2>
          <p className="text-[#F1E9DC]/75 leading-relaxed mt-10 max-w-xl">Satranç vs., satranç üzerine uzun okumalar, analizler ve hikâyeler yayımlayan bağımsız bir dergidir. Bir fincan kahve eşliğinde, acele etmeden okunsun diye.</p>
        </div>
        <div id="bulten" className="md:col-span-12 mt-10 border border-[#2E2620] p-8 md:p-14 grid md:grid-cols-2 gap-8 items-end">
          <div><p className="f-mono text-[#C8893E]">Bülten</p><h3 className="f-display text-4xl md:text-6xl mt-4">Her ay bir hamle, <em className="italic">e-postanda.</em></h3></div>
          {subbed ? (
            <p className="text-lg">Teşekkürler! <span className="text-[#C8893E]">{email}</span> adresi listeye eklendi.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(email)) setSubbed(true); }} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="em" className="sr-only">E-posta</label>
              <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-posta adresin"
                className="flex-1 h-14 bg-transparent border-b border-[#F1E9DC]/40 focus:border-[#C8893E] outline-none text-lg" />
              <button className="h-14 px-8 rounded-full bg-[#F1E9DC] text-[#0E0C0A] font-semibold hover:bg-[#C8893E] inline-flex items-center gap-2 justify-center"><Mail size={18} /> Abone ol</button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-[#2E2620]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row justify-between gap-6">
          <p className="f-mono text-[#A89A88]">İletişim: <a href="mailto:editor@satrancvs.com" className="text-[#F1E9DC] hover:text-[#C8893E]">editor@satrancvs.com</a></p>
          <div className="flex gap-3">
            {[[Instagram, 'Instagram', 'https://instagram.com/satrancvs'], [Twitter, 'X', 'https://x.com/satrancvs'], [Youtube, 'YouTube', 'https://youtube.com/@satrancvs']].map(([Icon, l, href]) => {
              const I = Icon as typeof Instagram;
              return <a key={l as string} href={href as string} target="_blank" rel="noreferrer" aria-label={l as string} className="w-11 h-11 rounded-full border border-[#2E2620] grid place-items-center hover:bg-[#C8893E] hover:text-[#0E0C0A]"><I size={18} /></a>;
            })}
          </div>
        </div>
        <div className="overflow-hidden border-t border-[#2E2620]">
          <p className="f-display text-[17vw] leading-[0.8] whitespace-nowrap text-center pt-6 -mb-[2vw]">Satranç <em className="italic text-[#C8893E]">vs.</em></p>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-6 flex justify-between f-mono text-[#A89A88]">
          <span>© 2026 Satranç vs. Dergisi</span><span>a1 — h8</span>
        </div>
      </footer>

      {reading && <Reader a={reading} onClose={() => setReading(null)} />}
    </div>
  );
}
