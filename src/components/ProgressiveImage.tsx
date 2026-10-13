import { useEffect, useRef, useState, type CSSProperties } from 'react';
import imageMeta from '@/data/image-meta.json';

type Meta = { w: number; h: number; lqip: string };
const META = imageMeta as Record<string, Meta>;

// Yazı fotoğrafları: en fazla 600 px genişlik, 720 px yükseklik. Yüklenirken küçük bulanık bir önizleme (LQIP)
// görünür ve fotoğraf yüklenince yumuşakça yerini alır. Önizlemeler ve boyutlar scripts/image-placeholders.py ile
// üretilir; en-boy oranı baştan bilindiği için yer ayrılır ve sayfa yükleme sırasında kaymaz.
export default function ProgressiveImage({ path, alt, lazy = true }: { path: string; alt: string; lazy?: boolean }) {
  const key = path.replace(/^\//, '');
  const meta = META[key];
  const src = /^(https?:)?\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${key}`;
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  // Önbellekten gelen görsel onLoad tetiklenmeden tamamlanmış olabilir.
  useEffect(() => { if (ref.current?.complete) setLoaded(true); }, []);
  if (!meta) {
    return <img src={src} alt={alt} loading={lazy ? 'lazy' : undefined} className="block mx-auto w-auto h-auto max-w-full max-h-[720px] md:max-w-[600px] grayscale" />;
  }
  return (
    <span
      className="relative block mx-auto max-w-full overflow-hidden w-[min(600px,calc(720px*var(--ar)))]"
      style={{ '--ar': meta.w / meta.h, aspectRatio: `${meta.w} / ${meta.h}` } as CSSProperties}
    >
      <img src={meta.lqip} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl grayscale" />
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={meta.w}
        height={meta.h}
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover grayscale transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  );
}
