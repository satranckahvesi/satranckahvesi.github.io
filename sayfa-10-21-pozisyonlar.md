# "At ve fil" — sayfa 10–21 görselleri (FEN + PGN)

Her bölüm: pozisyonun FEN'i ve görseldeki yorumların (Johan Hellsten) hamleleri/varyantları/yorumlarıyla PGN hali. Metinler orijinal İngilizce, hamleler İngilizce taş harfleriyle (N, B, R, K). Tüm hamleler ve varyantlar python-chess ile yasal bulundu.

## Uhlmann – Fischer, Leipzig Olimpiyatı 1960

**FEN:** `8/p6p/2k1b3/2P3K1/P3N1p1/8/7P/8 b - - 0 1`

```pgn
[Event "Leipzig Olympiad"]
[Site "Leipzig"]
[Date "1960.??.??"]
[Round "?"]
[White "Uhlmann, W"]
[Black "Fischer, RJ"]
[Result "0-1"]
[Annotator "Johan Hellsten"]
[SetUp "1"]
[FEN "8/p6p/2k1b3/2P3K1/P3N1p1/8/7P/8 b - - 0 1"]

{Such positions with mutual passed pawns are clearly in the bishop's favour, though precision is still required.} 1... a5! {Fixing the a4-pawn as a future target, and advancing the potential passed pawn as well.} ( 1... Bb3?! {Obviously,} 2. a5 {would be less to the point.} ) 2. Kf4 ( 2. Kh6 Bd5 3. Nf6 Bf3 4. Kxh7 Kxc5 5. Kg6 Kb4 6. Kg5 Kxa4 7. Nxg4 Bxg4! 8. Kxg4 Kb4 {and wins – Speelman.} ) 2... Bb3 3. Ke3 ( 3. Kxg4 Bxa4 4. Kg5 Bc2 {Black wins even more comfortably.} ) 3... Bxa4 4. Kd2 ( 4. Nf6 Bc2 {Seeing that 4.Nf6 fails to ...Bc2, White denies the bishop that square.} ) 4... h6! {A useful move, in order to delay White's conquest of that pawn.} 5. Nf6 Kxc5 6. Nxg4 h5 7. Ne3 ( 7. Nf6 h4 8. Ne4+ Kd4 9. Nd6 Bd7! {the knight is fatally sidelined from the battle – Speelman.} ) 7... Kd4 8. Nf1 Ke5 9. Ke3 Bb3 10. Ng3 {Here White resigned. Let's see a possible conclusion:} 10... a4 11. Kd3 a3 12. Kc3 a2 13. Kb2 h4 14. Ne2 Ke4 {Black wins – Speelman.} 0-1
```

## Alekhine – Yates, Hastings 1926

**FEN:** `4b3/p3kp2/6p1/2ppP2p/5P2/3PK1P1/P3N2P/8 w - - 0 1`

```pgn
[Event "Hastings"]
[Site "Hastings"]
[Date "1926.??.??"]
[Round "?"]
[White "Alekhine, A"]
[Black "Yates, F"]
[Result "1-0"]
[Annotator "Johan Hellsten"]
[SetUp "1"]
[FEN "4b3/p3kp2/6p1/2ppP2p/5P2/3PK1P1/P3N2P/8 w - - 0 1"]

{Black has just played ...c6-c5 with the obvious intention of ...d5-d4+, after which his bishop would become great on c6. However, any such aspirations are effectively crushed by Alekhine's next, strong move.} 1. d4! {Fixing the d5-pawn as a future attacking object, while placing his own d-pawn on a dark square, out of reach for the enemy bishop. The fact that Black now obtains a protected passed pawn is irrelevant.} 1... c4 2. f5! {A nice follow-up which enables 3 Nf4, an idea that Yates hurries to prevent.} 2... g5 3. h4! {In the same spirit as two moves ago, fixing a weakness on h5 while softening up the dark squares on the kingside.} 3... f6 4. hxg5 {Alekhine hurries to create a powerful pair of connected passed pawns.} ( 4. Ng1 {The more restrained} gxh4 5. gxh4 Bd7 6. e6 Bc6 7. Ne2 Kd6 8. Nf4 Be8 {with some chances for a draw.} ) 4... fxg5 5. Ng1! {Heading for f3 or h3 in order to soften up the dark squares even more.} 5... Bd7? ( 5... h4 {The active move was called for, although after} 6. g4 Ba4 7. Ke2!? {preparing Nh3, White keeps good winning chances.} ) 6. f6+ Ke8 ( 6... Ke6? 7. Nh3 {winning – Primel.} ) 7. Nf3 {Now it turns out that Black has no other choice than to put one more pawn on a light square, and the rest is child's play for Alekhine.} 7... g4 8. Nh4 Be6 9. Ng6! {The knight finally reaches its desired destiny at f4.} 9... Bf7 10. Nf4 Kd7 11. Ke2! {Zugzwang.} 11... a5 12. Ke3 Bg8 13. Nxh5 Bf7 14. Nf4 Bg8 15. Ne2 {It is the king's turn to use the f4-square, in order to invade the enemy camp. Yates fights on until the bitter end.} 15... Be6 16. Kf4 Ke8 17. Kg5 Kf7 18. Nc3 Kf8 19. Kg6 Kg8 20. f7+! Kf8 21. Kf6 Bxf7 22. e6 Bh5 23. Nxd5 Be8 24. Nc3 {In view of the imminent advance of the d-pawn, Black resigned.} 1-0
```

## Smyslov – Derkach, Kiev 1937

**FEN:** `8/p5p1/5k2/Pp1p1p1p/1PbPpK1P/2N1PP2/6P1/8 w - - 0 1`

```pgn
[Event "Kiev"]
[Site "Kiev"]
[Date "1937.??.??"]
[Round "?"]
[White "Smyslov, V"]
[Black "Derkach"]
[Result "1-0"]
[Annotator "Johan Hellsten"]
[SetUp "1"]
[FEN "8/p5p1/5k2/Pp1p1p1p/1PbPpK1P/2N1PP2/6P1/8 w - - 0 1"]

{In such blocked positions the knight tends to be stronger than the bishop, and here White is favoured by the fact that several pawn pairs are fixed on the "right" colour, which means that the white pawns cannot be attacked by the bishop. But how to progress?} 1. a6! {A move with several virtues: a weakness is fixed on a7, a tempo is gained for a future passed pawn race, and the enemy bishop is tied to the defence of the b5-pawn, now that ...a7-a6 will no longer be possible.} 1... g6 ( 1... exf3 2. gxf3 g6 {to avoid the zugzwang that follows in the game, White has the strong} 3. e4! fxe4 4. fxe4 dxe4 5. Nxe4+ Ke6 6. Nc3 {and the fresh passed pawn takes its toll after} Kf6 7. d5 Bd3 8. Ne4+! Bxe4 ( 8... Ke7 9. Ke5 ) 9. Kxe4 g5 10. hxg5+ Kxg5 11. Ke5! Kg6 12. Ke6 h4 13. d6 {winning Black's queen in the end – Smyslov.} ) 2. fxe4 fxe4 ( 2... dxe4 3. g3 {followed by a timely d5-d6; e.g.} Bd3 4. d5 Bc4 5. d6! Ke6 6. Kg5 Kxd6 7. Kxg6 Ke5 8. Kxh5 Kf6 9. Kh6 Bd3 10. Nd5+ Ke5 11. Kg7! Kxd5 12. h5 {and wins – Smyslov.} ) 3. g3! {Zugzwang – it is easy to see that Black has no solid move at his disposal.} 3... Ke6 4. Kg5 Kf7 5. Nd1! {The knight's ability to touch almost any square on the board means that it should usually move around a lot in the endgame.} 5... Bf1 6. Nf2 Kg7 7. g4! {The pawn helps the knight enter Black's camp.} 7... hxg4 ( 7... Be2 8. gxh5 gxh5 9. Nh3 {heading for f4.} ) 8. Nxg4 Bh3 9. Nf6 Be6 10. Ne8+ {There follows 11 Nc7 or 11 Nd6 with devastating effect, so Black resigned.} 1-0
```

## Smeets – Carlsen, Nice (rapid) 2010

**FEN:** `5k2/1b3ppp/8/2P5/8/1p4PP/5P2/3N1K2 b - - 0 1`

```pgn
[Event "Nice (rapid)"]
[Site "Nice"]
[Date "2010.??.??"]
[Round "?"]
[White "Smeets, J"]
[Black "Carlsen, Ma"]
[Result "0-1"]
[Annotator "Johan Hellsten"]
[SetUp "1"]
[FEN "5k2/1b3ppp/8/2P5/8/1p4PP/5P2/3N1K2 b - - 0 1"]

{The open centre and the existence of pawns on both flanks evidently favour the bishop. Instead of the routine 1...Ke7, Carlsen found a more long-term plan.} 1... g5! {Realizing the idea of fixing enemy pawns in a slightly different fashion than in the previous examples. Here White's h-pawn is not fixed at h3, but a later attack with the bishop will force it to move forward, and after ...g5xh4, g3xh4 White's split kingside pawns will prove more vulnerable to Black's king.} ( 1... Ke7 {Less promising was} 2. Ke2 Ke6 3. Nc3! Ke5 ( 3... b2 4. Kd3 {followed by Kc2} ) 4. Kd3!? Ba6+ 5. Ke3 {with f2-f4 next} ) ( 1... Bf3 {or} 2. Nb2 Ke7 3. Ke1 Ke6 4. Kd2 Kd5 5. Kc3 Kxc5 6. Kxb3 Kd4 7. Kc2 {when the battle on one single flank is to the knight's taste.} ) 2. Ke2 Bg2 3. h4 gxh4 4. gxh4 Kg7 {Immediately heading for the kingside pawns;} ( 4... Ke7 {although} 5. Kd3 Bh3 {was worth considering too – Baburin.} ) 5. Kd3 Kg6 6. Kc4 Kh5 7. Kxb3 Kxh4 {Black has obtained the sort of position he was looking for, with mutual passed pawns, where the bishop tends to outperform the knight.} 8. Ne3 Bb7 9. Kc4 h5 10. Kd4? ( 10. Kb5! {preparing c5-c6, was called for; e.g.} Kg5 11. c6 Bc8 12. Kc5 h4 13. Nf1! Kg4 14. Nh2+ Kh3 15. Nf3! {and Black cannot make progress, since} Bg4 {is met by 16.c7 with a draw – Baburin. Of course such decisions are more difficult at the board, so you could say that, although 1...g5 might not win theoretically, it does make White's task a bit harder in practice.} ) 10... Kg5 11. Ke5 h4 12. f4+ Kg6 13. Ng4 {White hurries to block the h-pawn on a dark square.} 13... h3 14. Nh2 f6+ 15. Ke6 Bg2 16. Ng4 Kh5 ( 16... f5 {Correct was} 17. Nh2 Be4! {preparing ...Kh5-h4 – Baburin; e.g.} 18. Ke5 Kh5 19. c6 Bxc6 20. Kxf5 Kh4 21. Ke5 Kg3 22. Nf1+ Kg2 23. Ne3+ Kg1 24. Ng4 Bf3! {and wins.} ) 17. Nf2? ( 17. Nh2! {Here this was more tenacious, when Black would have to repeat moves with} Kg6 ( 17... Kh4? {the tempting move only draws after} 18. Kxf6 Kg3 19. f5 Kxh2 20. Ke5 {– Baburin} ) 18. Ng4 {and if 18.Ng4 then} f5 {transposing to the previous note.} ) 17... h2 18. Kxf6 Kh4 19. Ke5 Kg3 0-1
```

## Botvinnik – Bronstein, Dünya Şampiyonası, Moskova (23. parti) 1951

**FEN:** `8/1p6/npn1pk1p/3p4/P2PP3/2K3B1/7P/1B6 w - - 0 1`

```pgn
[Event "World Championship, Moscow (23)"]
[Site "Moscow"]
[Date "1951.??.??"]
[Round "23"]
[White "Botvinnik, M"]
[Black "Bronstein, D"]
[Result "1-0"]
[Annotator "Johan Hellsten"]
[SetUp "1"]
[FEN "8/1p6/npn1pk1p/3p4/P2PP3/2K3B1/7P/1B6 w - - 0 1"]

{In exchange for the pawn deficit White has a powerful bishop pair, while Black is struggling with his passive knights. Moreover, the fact that there is play on both flanks favours the bishops, as can be seen by Botvinnik's next, simple move.} 1. Bf4! {Provoking the advance of the h-pawn, so that it becomes more vulnerable.} 1... h5 2. exd5! {At the right moment, ruling out any attempts at ...d5xe4, followed by ...Ne7-d5 – Botvinnik.} 2... exd5 3. h4! {Fixing the h-pawn for the light-squared bishop, and creating a stronghold on g5 for its colleague.} 3... Nab8 4. Bg5+ Kf7 5. Bf5 {Preventing ...Nd7 and eyeing c8.} 5... Na7 ( 5... Ne7 {After} 6. Bh3! ( 6. Bxe7 Kxe7 7. Bg6 {is somewhat less technical due to the risk of a theoretical draw with the h-pawn and the wrong bishop} ) 6... Nbc6 7. Bg2 Kg7 8. Bxe7! Nxe7 9. Kb4 Nc6+ 10. Kb5 Nxd4+ 11. Kxb6 {the a-pawn soon decides.} ) 6. Bf4 Nbc6 7. Bd3 Nc8 8. Be2 Kg6 9. Bd3+ Kf6 10. Be2 Kg6 11. Bf3 N6e7 ( 11... N8e7 {On 11...N8e7 a good reply is} 12. Bc7 Nf5 13. Bxd5 Nfxd4 14. Bxb6 {– Botvinnik.} ) 12. Bg5! {Finding himself in a fatal zugzwang, Black resigned. [If 12...Nc6, then 13.Bxd5 Nd6 14.Bf3 Kf5 15.Bc1! (Smyslov) is very strong, avoiding a fork on e4; e.g. 15...b5 16.Bxc6 bxc6 17.a5 and White wins.]} 1-0
```

## Yermolinsky – Kasparov, Wijk aan Zee 1999

**FEN:** `1k6/pp5p/3r1np1/2pP1p2/2P2P2/1R2PB2/P6P/6K1 b - - 0 1`

```pgn
[Event "Wijk aan Zee"]
[Site "Wijk aan Zee"]
[Date "1999.??.??"]
[Round "?"]
[White "Yermolinsky, A"]
[Black "Kasparov, G"]
[Result "0-1"]
[Annotator "Johan Hellsten"]
[SetUp "1"]
[FEN "1k6/pp5p/3r1np1/2pP1p2/2P2P2/1R2PB2/P6P/6K1 b - - 0 1"]

{Thanks to his sounder pawn structure and superior minor piece, Black is better in the above position.} 1... Ra6! {The rook starts working on the weak white a- and c-pawns, while ceding the blocking square on d6 to its preferred user, the knight.} 2. a3 Ne8! 3. e4 {Thus White gets rid of his backward e-pawn and clears some space for the bishop.} 3... fxe4 4. Bxe4 Nd6 5. Bd3 Ra4 6. Rc3 Kc7 7. Kf2 {Black's pieces were considerably improved over the last moves, but how to progress further?} 7... b5! {It might appear illogical to open the position for the enemy bishop, but this advance has several virtues: the d5-pawn is weakened, a passed pawn is created on the c-file, and Black's king will be able to cross the sixth rank.} 8. cxb5 Kb6 ( 8... Rxf4+? {Of course not} 9. Ke3 {followed by Rxc5+, and Black loses his passed pawn.} ) 9. Ke3 c4! {Simplifying to a minor piece ending with an extra pawn.} ( 9... Rd4!? {Another good option was} {followed by ...Rxd5-h5.} ) 10. Bc2 Nxb5 11. Bxa4 Nxc3 12. Be8 ( 12. Bc2 Kc5 13. d6 Kxd6 {Or; when both} 14. f5 ( 14. Kd4 Nb5+ ) 14... g5! {favour Black – Hecht.} ) 12... Kc5! {King first!} ( 12... Nxd5+?! {After} 13. Kd4 c3 14. Ba4 {White would have more chances for survival, thanks to his active king.} ) 13. d6 Nd5+! ( 13... Kxd6?! {Less technical is} 14. Kd4 {with similar play to the previous note.} ) 14. Ke4 Nf6+ 15. Ke3 ( 15. Ke5 {Or} Nxe8 16. d7 Nd6 17. d8=N c3 18. Ne6+ Kc4 19. Nd4 Nb5 {winning – Hecht.} ) 15... Kxd6 16. Bf7 Kc5 {With a healthy extra pawn and more active king, the rest is a matter of technique for Black.} 17. h4 Ng4+ 18. Kd2 ( 18. Ke4 {The desirable} Nh6 {fails to} 19. Be6 Nf5! 20. h5 Ng3+ {etc.} ) 18... Kd4 19. h5 gxh5 20. Bxh5 Nf6 {In view of the imminent advance of the h-pawn, White resigned.} 0-1
```
