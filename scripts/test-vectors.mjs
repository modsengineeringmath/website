// Reproducible vector mathematics checks. Run: node scripts/test-vectors.mjs
// No browser or test framework is required. The browser module also exposes its
// numerical API on globalThis when imported without a DOM.
import assert from 'node:assert/strict';
import '../assets/vector-lab.js';

const { compute, limit } = globalThis.VectorMath;
const geometricDot = (a, b) => a.reduce((sum, component, i) => sum + component * b[i], 0);
const length = (a) => Math.hypot(...a);
const scaled = (a, scalar) => a.map((component) => component * scalar);
const rotateAxes = ([x, y, z]) => [z, x, y]; // A rotation preserving orientation.

function near(actual, expected, context, relative = 1e-10, absolute = 1e-8) {
  assert.ok(Number.isFinite(actual), `${context}: result must be finite`);
  const tolerance = Math.max(absolute, relative * Math.max(Math.abs(actual), Math.abs(expected)));
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${context}: expected ${expected}, received ${actual}; tolerance ${tolerance}`);
}

function vectorNear(actual, expected, context) {
  assert.equal(actual.length, expected.length, `${context}: dimension`);
  actual.forEach((component, i) => near(component, expected[i], `${context}, component ${i}`));
}

function checkFiniteFields(result) {
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value), `${key} must be finite`);
    if (Array.isArray(value)) assert.ok(value.every(Number.isFinite), `${key} components must be finite`);
  }
}

// Known geometric/engineering examples independently establish orientation,
// scalar units, component signs, and the distinction between a vector and its length.
assert.deepEqual(compute([3, 4], [2, 1], 1, 2, 'add').result, [5, 5, 0]);
assert.deepEqual(compute([3, 4], [2, 1], 1, 2, 'subtract').result, [1, 3, 0]);
vectorNear(compute([3, 4], [2, 1], -2, 2, 'scale').result, [-6, -8, 0], 'negative scalar reverses direction');
near(compute([3, 4], [2, 1], 1, 2, 'dot').angle, 26.56505117707799, 'known 2D angle');

const work = compute([120, 0, 0], [3, 4, 0], 1, 3, 'dot');
assert.equal(work.result, 360, '120 N along x over 3 m along x does 360 J of work');
near(work.dot / (work.magnitudeA * work.magnitudeB), 0.6, 'direction cosine of the displacement');

const cable = compute([3, 4, 5], [0, 0, -2], 1, 3, 'projection');
assert.equal(cable.scalarComponent, -5, 'component is signed relative to the cable direction');
vectorNear(cable.projection, [0, 0, 5], 'vector projection points opposite to the cable direction');
assert.deepEqual(cable.perpendicular, [3, 4, 0], 'perpendicular remainder lies in the xy plane');
assert.equal(length(cable.projection), 5, 'projection length is nonnegative');

const torque = compute([0.4, 0.2, 0.1], [0, 50, 0], 1, 3, 'cross');
assert.deepEqual(torque.result, [-5, 0, 20], 'r in metres cross F in newtons gives torque in N·m');
assert.deepEqual(compute([1, 0, 0], [0, 1, 0], 1, 3, 'cross').result, [0, 0, 1], 'right hand orientation');
assert.deepEqual(compute([1, 0], [0, -1], 1, 2, 'cross').result, [0, 0, -1], '2D vectors embedded in xy have a signed z cross product');
assert.equal(compute([3, 4], [-4, 3], 1, 2, 'dot').relation, 'perpendicular');
assert.equal(compute([3, 4], [6, 8], 1, 2, 'dot').relation, 'parallel');
assert.equal(compute([3, 4], [-6, -8], 1, 2, 'dot').angle, 180);

// A zero vector has no direction, while its dot/cross products are well defined.
for (const dim of [2, 3]) {
  const zero = [0, 0, 0], nonzero = [3, 4, 0];
  const undefinedProjection = compute(nonzero, zero, 1, dim, 'projection');
  assert.equal(undefinedProjection.result, null);
  assert.equal(undefinedProjection.scalarComponent, null);
  assert.equal(undefinedProjection.angle, null);
  assert.equal(undefinedProjection.relation, 'undefined');
  assert.deepEqual(compute(zero, nonzero, 1, dim, 'projection').result, zero);
  assert.equal(compute(zero, nonzero, 1, dim, 'dot').result, 0);
  assert.deepEqual(compute(nonzero, zero, 1, dim, 'cross').result, zero);
  assert.deepEqual(compute(nonzero, nonzero, 0, dim, 'scale').result, zero);
  checkFiniteFields(undefinedProjection);
}

// Normalize before division: a squared norm or a reciprocal can underflow or
// overflow even when the original input and the mathematically valid result are finite.
for (const tiny of [1e-200, 1e-310, Number.MIN_VALUE]) {
  const projection = compute([tiny, 0], [tiny, 0], 1, 2, 'projection');
  assert.equal(projection.angle, 0);
  assert.equal(projection.projection[0], tiny, 'tiny nonzero projection must survive normalization');
  assert.equal(projection.perpendicular[0], 0);
  assert.equal(compute([tiny, 0], [-tiny, 0], 1, 2, 'dot').angle, 180);
  checkFiniteFields(projection);
}
const almostParallel = compute([0.1, 0.2, 0.3], [0.7, 1.4, 2.1], 1, 3, 'dot');
assert.ok(almostParallel.angle >= 0 && almostParallel.angle < 0.0001, 'cosine rounding must never produce NaN');

assert.equal(limit, 10000);
assert.deepEqual(compute([10000, -10000, 10000], [-10000, 10000, 10000], 10000, 3, 'cross').result,
  [-200000000, -200000000, 0], 'valid boundary input is preserved');
for (const invalid of [10000.1, -10000.1, Infinity, -Infinity, NaN, '3']) {
  assert.throws(() => compute([invalid, 0], [1, 0], 1, 2, 'add'));
  assert.throws(() => compute([1, 0], [invalid, 0], 1, 2, 'dot'));
  assert.throws(() => compute([1, 0], [1, 0], invalid, 2, 'scale'));
}
assert.throws(() => compute([1, 2], [3, 4], 1, 3, 'add'), 'missing active components must be rejected');
assert.throws(() => compute([1, 2], [3, 4], 1, 4, 'add'));
assert.throws(() => compute([1, 2], [3, 4], 1, 2, '__proto__'));
const originalA = [3, 4, 5], originalB = [2, -1, 3];
compute(originalA, originalB, 1, 3, 'projection');
assert.deepEqual(originalA, [3, 4, 5], 'calculations must not alter input A');
assert.deepEqual(originalB, [2, -1, 3], 'calculations must not alter input B');

// Deterministic samples test geometric identities rather than reimplementing
// coordinate formulas. The seed is printed so failures are reproducible.
const seed = 0x56ec700;
let randomState = seed;
function random() {
  randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
  return randomState / 0x100000000;
}
const sampleCount = 1000;
for (let sample = 0; sample < sampleCount; sample++) {
  const a = Array.from({ length: 3 }, () => random() * 200 - 100);
  const b = Array.from({ length: 3 }, () => random() * 200 - 100);
  const context = `seed ${seed}, sample ${sample}`;
  const projection = compute(a, b, 1, 3, 'projection');
  const reversed = compute(b, a, 1, 3, 'cross');
  checkFiniteFields(projection);
  vectorNear(projection.projection.map((value, i) => value + projection.perpendicular[i]), a,
    `${context}: parallel plus perpendicular recovers A`);
  near(geometricDot(projection.perpendicular, b), 0, `${context}: residual orthogonal to B`);
  near(length(projection.projection) ** 2 + length(projection.perpendicular) ** 2, length(a) ** 2,
    `${context}: Pythagorean decomposition`);
  vectorNear(compute(projection.projection, b, 1, 3, 'projection').result, projection.projection,
    `${context}: projection is idempotent`);
  vectorNear(compute(a, scaled(b, -2), 1, 3, 'projection').result, projection.projection,
    `${context}: reversing/scaling a line does not change its vector projection`);
  vectorNear(projection.cross, scaled(reversed.cross, -1), `${context}: cross changes sign when order reverses`);
  near(geometricDot(projection.cross, a), 0, `${context}: cross orthogonal to A`);
  near(geometricDot(projection.cross, b), 0, `${context}: cross orthogonal to B`);
  near(length(projection.cross) ** 2, length(a) ** 2 * length(b) ** 2 - projection.dot ** 2,
    `${context}: Lagrange identity links dot, cross, and area`);
  const rotated = compute(rotateAxes(a), rotateAxes(b), 1, 3, 'cross');
  vectorNear(rotated.cross, rotateAxes(projection.cross), `${context}: rotation preserves cross orientation`);
  near(rotated.dot, projection.dot, `${context}: dot invariant under rotation`);
  near(compute(scaled(a, -2), b, 1, 3, 'dot').dot, -2 * projection.dot,
    `${context}: work changes sign and scales with force`);
  assert.ok(projection.angle >= 0 && projection.angle <= 180, `${context}: angle is defined within [0, 180]`);
}

console.log(`PASS: geometric examples, zero/tiny/boundary inputs, validation, and ${sampleCount} deterministic samples (seed ${seed}).`);
