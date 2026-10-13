import { splitArticle } from '@/components/ArticleBody';
import timmanMd from '@/content/mar-del-plata-1982.md?raw';
import muglaMd from '@/content/amman-mugla.md?raw';
import data from './articles.json';

export type Article = {
  id: string; slug: string; cat: string; title: string; dek?: string; author: string; translator?: string; read: string;
  excerpt?: string; date?: string; chunks?: string[]; photo?: boolean; body: string[];
};

// Gövdesi markdown dosyasından gelen yazılar (id -> dosya)
const CHUNKS: Record<string, string[]> = {
  kapak: splitArticle(timmanMd).chunks,
  mugla: splitArticle(muglaMd).chunks,
};

// Makale metinleri/üst bilgileri articles.json'da (build sırasında prerender de bunu okur);
// gövdesi markdown dosyasında olan yazılar için CHUNKS kullanılır.
export const ARTICLES: Article[] = (data as Article[]).map((a) => (CHUNKS[a.id] ? { ...a, chunks: CHUNKS[a.id] } : a));

export const articleBySlug = (slug?: string) => ARTICLES.find((a) => a.slug === slug);
export const articlePath = (a: Article) => `/${a.slug}/`;
