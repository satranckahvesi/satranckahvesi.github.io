import assert from 'node:assert/strict';
import { test } from 'node:test';
import { puzzleMoverColor, stripPuzzleMarkers } from '../_js/pgn/puzzle.js';

test('white is on move at a marker after an even number of plies', () => {
  assert.equal(puzzleMoverColor([], '1. e4 e5 { [P] } 2. Nf3'), 'white');
});

test('black is on move after an odd number of plies', () => {
  assert.equal(puzzleMoverColor([], '1. e4 { [P] } e5'), 'black');
});

test('a FEN with black to move flips the parity', () => {
  const header = ['[FEN "8/8/8/8/8/8/8/K6k b - - 0 1"]'];
  assert.equal(puzzleMoverColor(header, '{ [P] } 1... Kg2'), 'black');
});

test('markers inside variations are ignored; no marker gives null', () => {
  assert.equal(puzzleMoverColor([], '1. e4 (1. d4 { [P] } d5) e5'), null);
  assert.equal(puzzleMoverColor([], '1. e4 e5'), null);
});

test('stripPuzzleMarkers removes every [P] / [P n] marker', () => {
  assert.equal(stripPuzzleMarkers('{ [P] a } { [P 2] b }'), '{  a } {  b }');
});
