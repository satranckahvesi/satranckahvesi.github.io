# Satranç vs. — DESIGN

## Direction & Layout
- Purpose: Satranç oynanabilen kahve mekânı için editoryal, sinematik vitrin. Mood: gece, gergin bir oyun anı, sıcak kahve buharı. Defining idea: hero'da imleçle aydınlanan 8x8 satranç ızgarası + devasa serif "Hamle sende." başlığı. Reference: Awwwards SOTD editoryal restoran siteleri.
- Should feel: sakin, zeki, karanlık-sıcak. Should NOT feel: kafe şablonu, pastel, mor gradient.
- Max width 1440px, 12 kolon, gutter 24px; section padding 160px desktop / 96px mobile. Asimetrik 7/5 kompozisyonlar.
- Breakpoints: <768 tek kolon, nav menüsü tam ekran overlay; 768–1024 iki kolon; >1024 tam asimetrik.
- Do: koordinat etiketleri (a–h, 1–8) dekor olarak, büyük numaralı bölümler (01–06). Don't: yuvarlak kartlar, glassmorphism, emoji.

## Tokens
- Colors: ink #0E0C0A (bg), espresso #1A1512 (surface), line #2E2620, cream #F1E9DC (text/inverse bg), muted #A89A88, accent crema #C8893E (yalnızca vurgu, %10), board-dark #3A2C22.
- Type: Display "Fraunces" 400/300 italic, clamp(56px,11vw,200px)/0.9, tracking -0.04em; Body "Manrope" 400/500 16–18px/1.6; Label "JetBrains Mono" 12px uppercase tracking 0.2em.
- Spacing 4/8/16/24/40/64/96/160. Radius 0 (kare dil), buton pill 999px.
- Depth: 1px #2E2620 çizgiler; gölge yok; overlay bg ink/90.

## Shared Patterns & States
- SectionHeader: mono label "01 — Hikâye" + serif başlık.
- Button: pill, cream bg ink text; hover crema bg; focus ring 2px crema offset 4px.
- Menu tabs: mono label, aktif alt çizgi crema.
- Motion: 700ms cubic-bezier(.2,.7,.1,1); reveal translateY 40px ama içerik varsayılan görünür (animasyon sadece class eklenince). Marquee 40s lineer. prefers-reduced-motion'da kapalı.
- A11y: hedefler ≥44px, kontrast AA, ikon butonlarda aria-label.

## Media
- AI fotoğraf: hero (3:2, sağda şah, solda metin alanı), hikâye 2 görsel, 3 etkinlik dikey 2:3, 4 galeri. Tümü sıcak-karanlık palet, metin yok. Gradient/SVG yerine gerçek görsel şart.
