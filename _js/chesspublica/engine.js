// The only file that reaches into ChessPublica's undocumented internals.
// See docs/chesspublica-quirks.md for what each one is relied on for.

export const engineOf = (player) => player?._engine ?? null;

export const innerPlayer = (study) => study.querySelector('pgn-player');

export const studyEngine = (study) => engineOf(innerPlayer(study));

/** The variation the reader is currently inside, if any. */
export const variationOf = (engine) => engine?._variation ?? null;

/** Starts no continuous playback loop (play() still performs its single step). */
export const disableAutoplayLoop = (engine) => {
  engine._loopRAF = () => {};
};

/**
 * Variations have their own loop, started by clicking a move that has
 * sub-variations or by a variation's play icon. Keep the single step such a
 * click performs, but never keep stepping.
 */
export const disableVariationLoop = (engine) => {
  engine._variationPlayTick = (variation) => {
    if (engine._variation !== variation || !variation.playing) return;
    variation.playing = false;
    if (variation.index < variation.maxIndex) engine.variationGoTo(variation.index + 1);
  };
};

export const commentBoxOf = (engine) => engine?.commentBox ?? null;
