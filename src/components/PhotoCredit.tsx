export const PHOTO = {
  src: `${import.meta.env.BASE_URL}images/jan-timman-1973.jpg`,
  alt: 'Jan Timman, AVRO satranç turnuvası, 1973 (siyah-beyaz fotoğraf)',
  page: 'https://commons.wikimedia.org/wiki/File:AVRO-schaaktoernooi,_Jan_Timman,_Bestanddeelnr_926-4781.jpg',
  license: 'https://creativecommons.org/publicdomain/zero/1.0/deed.tr',
};

export default function PhotoCredit({ full = false, className = '' }: { full?: boolean; className?: string }) {
  const link = 'underline underline-offset-2 hover:text-[#F1E9DC]';
  return (
    <p className={`credit text-[#A89A88] ${className}`}>
      {full ? (
        <>
          Jan Timman, 1973. · Fotoğraf: Rob Mieremet / Anefo — Nationaal Archief (Hollanda Ulusal Arşivi), · Envanter no 2.24.01.05, madde 926-4781 · Lisans:{' '}
          <a href={PHOTO.license} target="_blank" rel="noreferrer" className={link}>CC0 1.0 (Kamu Bağışı)</a>.
        </>
      ) : (
        <>
          Fotoğraf: Rob Mieremet / Anefo — Nationaal Archief (Hollanda Ulusal Arşivi), 12 Haziran 1973. Lisans:{' '}
          <a href={PHOTO.license} target="_blank" rel="noreferrer" className={link}>CC0 1.0 (Kamu Malı Bağışı)</a>.
        </>
      )}
      {' '}Kaynak: <a href={PHOTO.page} target="_blank" rel="noreferrer" className={link}>Wikimedia Commons</a>
    </p>
  );
}
