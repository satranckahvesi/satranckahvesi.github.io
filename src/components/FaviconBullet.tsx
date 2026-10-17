// Siteyi simgeleyen küçük favicon; header, Hakkında ve footer'da aynı boyda (header'daki işaretle aynı, 28px).
// Yerleşim `className` ile verilir.
export default function FaviconBullet({ className = '' }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden="true" width={28} height={28} className={`w-7 h-7 ${className}`} />;
}
