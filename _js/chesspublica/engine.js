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

export const commentBoxOf = (engine) => engine?.commentBox ?? null;
