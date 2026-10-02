import { studyEngine } from '../engine.js';

// The branch-point picker is hidden: the study always continues on the
// mainline. ChessPublica's goTo() still refuses a plain "next" step at a
// branch point until the picker's mainline row is clicked, and nothing outside
// its bundle can flip the flag that click sets.
//
// Called only for a reader's own explicit single step. Returns whether it
// resolved a branch (that click already is the step forward).
export function resolveBranch(study) {
  const mainlineRow = study.querySelector('.pgn-study-picker-row.mainline');
  if (!mainlineRow) return false;
  const engine = studyEngine(study);
  mainlineRow.click();
  // The click starts playback; this study has no autoplay.
  if (engine?.state?.playing && typeof engine.togglePlay === 'function') engine.togglePlay();
  return true;
}
