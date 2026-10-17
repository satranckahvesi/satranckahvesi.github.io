// Büyük “Satranç vs.” yazılarının sol üstünde, liste işareti gibi duran küçük favicon. Boyutu yazıyla ölçeklenir (em).
// `hang`: sola dayalı başlıklarda ikon soldaki boşluğa taşar, yazı diğer satırlarla aynı hizada kalır.
export default function FaviconBullet({ hang = false }: { hang?: boolean }) {
  return <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden="true" className={`inline-block align-top w-[0.15em] h-[0.15em] mt-[0.135em] mr-[0.1em]${hang ? ' -ml-[0.25em]' : ''}`} />;
}
