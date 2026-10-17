// Reproducible checks of the multivariable-calculus engine (assets/mvc-core.js). Run: node scripts/test-mvc.mjs
// No browser or test framework is required. Reference values come from sympy / closed forms.
import assert from 'node:assert/strict';
import '../assets/mvc-core.js';

const MVC = globalThis.MVC;
const near = (a, b, ctx, tol = 1e-8) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${ctx}: expected ${b}, received ${a}`);
const P = (src, vars) => MVC.parse(src, vars);
const xy = ['x', 'y'], xyz = ['x', 'y', 'z'];
let n = 0;
const ok = (name, fn) => { fn(); n++; };

// ---- symbolic partial derivatives agree with central differences at random points -------------------------------------------------
ok('derivatives', () => {
  const cases = ['x^2*y+sin(x*y)', 'exp(-(x^2+y^2))', 'sqrt(x^2+y^2+1)', 'ln(1+x^2*y^2)', 'x*y/(x^2+y^2+1)', 'atan(y/(x+3))', 'x^y'.replace('x^y', 'x^2*y^3')];
  for (const src of cases) {
    const ast = P(src, xy), f = MVC.compile(ast, xy);
    for (const v of xy) {
      const g = MVC.compile(MVC.d(ast, v), xy);
      for (const [x, y] of [[0.7, 1.3], [1.9, 0.4], [1.2, 2.1]]) {
        const h = 1e-6, num = v === 'x' ? (f(x + h, y) - f(x - h, y)) / (2 * h) : (f(x, y + h) - f(x, y - h)) / (2 * h);
        near(g(x, y), num, `∂${v} of ${src} at (${x}, ${y})`, 1e-6);
      }
    }
  }
});

// ---- vector identities hold symbolically: curl(grad f) = 0, div(curl F) = 0 ---------------------------------------------------------
ok('identities', () => {
  const f = P('x^2*y*z+sin(x*z)+exp(y)', xyz);
  const c = MVC.curl(MVC.grad(f, xyz), xyz).map((a) => MVC.compile(a, xyz));
  const F = [P('y*z^2', xyz), P('x*sin(z)+y^2', xyz), P('x*y*z', xyz)];
  const dv = MVC.compile(MVC.div(MVC.curl(F, xyz), xyz), xyz);
  for (const [x, y, z] of [[0.3, 1.1, 0.8], [1.4, -0.6, 2.0]]) {
    c.forEach((g, i) => near(g(x, y, z), 0, `curl grad component ${i}`, 1e-12));
    near(dv(x, y, z), 0, 'div curl', 1e-12);
  }
  const lap = MVC.compile(MVC.lap(P('1/sqrt(x^2+y^2+z^2)', xyz), xyz), xyz);
  near(lap(0.6, 0.8, 1.2), 0, '∇²(1/r) = 0 away from the origin', 1e-10);
});

// ---- double and triple integrals -----------------------------------------------------------------------------------------------------
ok('integrals', () => {
  const f = (s, v) => MVC.compile(P(s, v), v);
  near(MVC.quad2(f('x*y', xy), 0, 1, 0, 2, 12, 1), 1, '∫₀¹∫₀² xy dy dx');
  near(MVC.quad2(f('x^2+y^2', xy), 0, 1, 0, 2, 12, 1), 10 / 3, '∫₀¹∫₀² x²+y² dy dx');
  // polar disc of radius 2: ∬ e^{-(x²+y²)} dA = π(1 − e⁻⁴)
  near(MVC.quad2((th, r) => Math.exp(-r * r) * r, 0, 2 * Math.PI, 0, 2, 20, 2), Math.PI * (1 - Math.exp(-4)), 'polar Gaussian disc');
  // spherical ball: ∭ dV = 4π/3 and ∭ z dV over the upper unit hemisphere = π/4
  near(MVC.quad3((t, p, r) => r * r * Math.sin(p), 0, 2 * Math.PI, 0, Math.PI, 0, 1, 12, 2), 4 * Math.PI / 3, 'ball volume');
  near(MVC.quad3((t, p, r) => r * Math.cos(p) * r * r * Math.sin(p), 0, 2 * Math.PI, 0, Math.PI / 2, 0, 1, 12, 2), Math.PI / 4, '∭ z dV hemisphere');
});

// ---- critical points and the second-derivative test ------------------------------------------------------------------------------------
ok('critical points', () => {
  const pts = MVC.critical(P('x^4+y^4-4*x*y', xy), xy, [-2.5, 2.5, -2.5, 2.5]);
  assert.equal(pts.length, 3);
  const byType = Object.fromEntries(pts.map((p) => [p.type + (p.x > 0 ? '+' : p.x < 0 ? '-' : '0'), p]));
  near(byType['min+'].x, 1, 'min at (1,1)'); near(byType['min+'].z, -2, 'f(1,1) = −2');
  near(byType['min-'].x, -1, 'min at (−1,−1)');
  assert.equal(byType['saddle0'].x, 0);
  const sad = MVC.critical(P('x^3-3*x+y^2', xy), xy, [-3, 3, -3, 3]);
  assert.deepEqual(sad.map((p) => p.type).sort(), ['min', 'saddle']); // (1, 0) minimum, (−1, 0) saddle
  assert.equal(sad.length, 2);
});

// ---- space curves: helix r = (cos t, sin t, t) has κ = 1/2, τ = 1/2, speed √2, length 4π√2 over two turns ---------------------------------
ok('space curve', () => {
  const c = MVC.curve(P('cos(t)', ['t']), P('sin(t)', ['t']), P('t', ['t']));
  for (const t of [0.4, 2.2, 5.0]) {
    const q = c.at(t);
    near(q.kappa, 0.5, 'κ'); near(q.tau, 0.5, 'τ'); near(q.speed, Math.SQRT2, 'speed');
    near(q.T[0] * q.N[0] + q.T[1] * q.N[1] + q.T[2] * q.N[2], 0, 'T·N', 1e-10);
  }
  near(c.length(0, 4 * Math.PI), 4 * Math.PI * Math.SQRT2, 'arc length');
});

// ---- line integrals: work of ⟨y, x⟩ is path independent; Stokes' circulation ∮ ⟨z, x, y⟩·dr on the unit circle = π ----------------------
ok('line integrals', () => {
  const F = [MVC.compile(P('y', xy), xy), MVC.compile(P('x', xy), xy)];
  const c1 = MVC.curve(P('t', ['t']), P('t', ['t']), P('0', ['t']));
  const c2 = MVC.curve(P('t', ['t']), P('t^2', ['t']), P('0', ['t']));
  near(MVC.lineInt(F, c1, 0, 1), 1, 'work along y = x'); near(MVC.lineInt(F, c2, 0, 1), 1, 'work along y = x²');
  const G = [MVC.compile(P('z', xyz), xyz), MVC.compile(P('x', xyz), xyz), MVC.compile(P('y', xyz), xyz)];
  const circle = MVC.curve(P('cos(t)', ['t']), P('sin(t)', ['t']), P('0', ['t']));
  near(MVC.lineInt(G, circle, 0, 2 * Math.PI), Math.PI, 'Stokes line side');
});

// ---- surfaces: sphere area 4π, flux of ⟨x,y,z⟩ through the unit sphere = 4π (Gauss), curl flux through the hemisphere = π (Stokes) --------
ok('surface integrals', () => {
  const sph = MVC.surface(P('sin(u)*cos(v)', ['u', 'v']), P('sin(u)*sin(v)', ['u', 'v']), P('cos(u)', ['u', 'v']));
  near(sph.area(0, Math.PI, 0, 2 * Math.PI), 4 * Math.PI, 'sphere area', 1e-9);
  const F = [MVC.compile(P('x', xyz), xyz), MVC.compile(P('y', xyz), xyz), MVC.compile(P('z', xyz), xyz)];
  near(sph.flux(F, 0, Math.PI, 0, 2 * Math.PI), 4 * Math.PI, 'Gauss surface side', 1e-9);
  const curlF = MVC.curl([P('z', xyz), P('x', xyz), P('y', xyz)], xyz).map((a) => MVC.compile(a, xyz));
  near(sph.flux(curlF, 0, Math.PI / 2, 0, 2 * Math.PI), Math.PI, 'Stokes surface side', 1e-9);
});

// ---- TeX output ----------------------------------------------------------------------------------------------------------------------------
ok('tex', () => {
  assert.equal(MVC.tex(MVC.d(P('x^2*y', xy), 'x')), '2xy');
  assert.equal(MVC.tex(MVC.d(P('x^2*y', xy), 'y')), 'x^{2}');
});

console.log(`mvc-core: ${n} groups passed`);
