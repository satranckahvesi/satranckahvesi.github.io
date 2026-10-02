// A `{[D]}` comment marks a diagram position and nothing else, yet
// ChessPublica's comment box treats it as content worth pausing for. The
// diagram is hidden under the board anyway, so playback would stop for no
// visible reason. A position whose only content is a diagram is reported as
// having none; comments and variations still pause as before.

import { commentBoxOf, engineOf } from './engine.js';

const patched = new WeakSet();

function patch(engine) {
  const box = commentBoxOf(engine);
  if (!box || patched.has(box)) return;
  patched.add(box);

  const original = box.update;
  box.update = function (index, comments, variations, diagrams, ...rest) {
    const hasVariations = variations?.[index]?.length;
    if (diagrams?.[index] && !comments?.[index] && !hasVariations) {
      const copy = diagrams.slice();
      copy[index] = null;
      diagrams = copy;
    }
    return original.call(this, index, comments, variations, diagrams, ...rest);
  };
}

export function installDiagramNoPause(body) {
  body.querySelectorAll('pgn-player').forEach((player) => {
    const run = () => patch(engineOf(player));
    if (engineOf(player)) run();
    player.addEventListener('cp-ready', run);
  });
}
