import { splitArticle } from '@/components/ArticleBody';
import timmanMd from '@/content/mar-del-plata-1982.md?raw';
import data from './articles.json';

export type Article = {
  id: string; slug: string; cat: string; title: string; dek: string; author: string; read: string;
  excerpt?: string; date?: string; chunks?: string[]; photo?: boolean; body: string[];
};

const TIMMAN = splitArticle(timmanMd);

// Makale metinleri/üst bilgileri articles.json'da (build sırasında prerender de bunu okur);
// Mar del Plata yazısının gövdesi markdown dosyasından gelir.
export const ARTICLES: Article[] = (data as Article[]).map((a) =>
  a.id === 'kapak' ? { ...a, chunks: TIMMAN.chunks } : a,
);

export const articleBySlug = (slug?: string) => ARTICLES.find((a) => a.slug === slug);
export const articlePath = (a: Article) => `/posts/${a.slug}/`;
