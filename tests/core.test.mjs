import test from 'node:test';
import assert from 'node:assert/strict';
import { World, FieldSystem, potentialPrime, effectiveMass, transferParticle, hamiltonian, derivatives, UniverseSimulation } from '../src/core.mjs';

const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b} by ${Math.abs(a - b)}`);

test('the curved-grid Laplacian preserves weighted total flux', () => {
  const w = new World({ dim: 2, n: 24, geometry: 'torus' });
  for (let i = 0; i < w.count; i++) w.phi[i] = .17 * Math.sin(i * .43);
  w.computeForce();
  const total = w.force.reduce((sum, f, i) => sum + w.volume[i] * (f + potentialPrime(w.phi[i], w.bias)), 0);
  near(total, 0);
  assert.notEqual(w.baseScales([0, 0])[1], w.baseScales([4, 0])[1]);
});

test('a wave varying only along w propagates in the fourth intrinsic direction', () => {
  const w = new World({ dim: 4, n: 8, bias: 0 });
  for (let i = 0; i < w.count; i++) w.phi[i] = Math.sin(2 * Math.PI * w.point(i)[3] / w.length) * .001;
  w.computeForce();
  const eigenvalue = -4 / w.h ** 2 * Math.sin(Math.PI / w.n) ** 2;
  for (let i = 0; i < w.count; i += 57) near(w.force[i] + potentialPrime(w.phi[i], 0), w.waveSpeed ** 2 * eigenvalue * w.phi[i], 2e-9);
});

function fieldEnergyRun(dt, damping = 0) {
  const a = new World({ dim: 3, n: 6, damping }), b = new World({ dim: 4, n: 5, damping, id: 1 });
  const system = new FieldSystem(a, b, { coupling: .8, damping });
  a.seed([a.gate, 0, 0], .8, .12);
  const e0 = system.energy();
  for (let t = 0; t < Math.round(1 / dt); t++) system.step(dt);
  return { error: Math.abs(system.energy() + system.dissipated - e0) / Math.abs(e0), dissipated: system.dissipated };
}
test('coupled field energy converges quadratically as the timestep is halved', () => {
  const coarse = fieldEnergyRun(.02).error, fine = fieldEnergyRun(.01).error;
  assert.ok(fine < coarse * .32, `coarse=${coarse}, fine=${fine}`);
  assert.ok(fine < .0002);
});
test('damping loss is recorded separately from integration error', () => {
  const result = fieldEnergyRun(.008, .1);
  assert.ok(result.dissipated > 0); assert.ok(result.error < .0002);
});

test('closed contact leaves B unchanged; an open mediator excites B', () => {
  const run = open => {
    const a = new World({ dim: 3, n: 7 }), b = new World({ dim: 4, n: 5, id: 1 });
    const s = new FieldSystem(a, b, { coupling: 1.5, open }); a.seed([a.gate, 0, 0], 1.5, .8);
    for (let i = 0; i < 150; i++) s.step(.01);
    return Math.max(...b.phi);
  };
  near(run(false), 0); assert.ok(run(true) > .005);
});

test('4D to 3D contact stores transverse momentum in effective rest mass', () => {
  const a = new World({ dim: 4, n: 4, id: 0 }), b = new World({ dim: 3, n: 5, id: 1 });
  const p = { q: [2, .3, .2, .1], p: [1.2, .4, .3, 2], hidden: [0, 0, 0, 0], world: 0, mass: 1, transfers: 0 };
  const e = hamiltonian(a, p.q, p.p, 1);
  near(transferParticle(p, a, b), 0);
  near(effectiveMass(p, 3), Math.sqrt(5)); near(hamiltonian(b, p.q, p.p, effectiveMass(p, 3)), e);
  near(transferParticle(p, b, a), 0); near(effectiveMass(p, 4), 1); near(p.p[3], 2);
});

test('a massless 4D excitation can be massive from the 3D world perspective', () => {
  const a = new World({ dim: 4, n: 4, id: 0 }), b = new World({ dim: 3, n: 4, id: 1 });
  const p = { q: [2, 0, 0, 0], p: [1, 0, 0, .6], hidden: [0, 0, 0, 0], world: 0, mass: 0, transfers: 0 };
  transferParticle(p, a, b); near(effectiveMass(p, 3), .6);
  assert.ok(derivatives(b, p.q.slice(0, 3), p.p.slice(0, 3), .6).dq[0] < 1);
});

test('Schwarzschild and Tangherlini radial null speeds have the correct horizon', () => {
  for (const dim of [3, 4]) {
    const w = new World({ dim, n: 5 }); w.compact = false; w.horizon = 1;
    for (const r of [.45, 1, 2]) {
      const q = w.blackHoleCenter.slice(0, dim); q[0] += r;
      const p = Array(dim).fill(0); p[0] = 1;
      near(derivatives(w, q, p, 0).dq[0], 1 - (1 / r) ** ((dim - 2) / 2));
    }
  }
});

test('the contracting metric never reaches a degenerate direction', () => {
  const w = new World({ n: 6 }); w.phi.fill(1); w.minimumScale = .18;
  near(w.scales([0, 0, 0])[2], .18); w.compact = false; near(w.scales([0, 0, 0])[2], 1);
});

test('matter crosses contacts without creating or deleting test particles', () => {
  const sim = new UniverseSimulation({ lowResolution: true }); sim.launch(24);
  for (let i = 0; i < 160; i++) sim.step(.02, { fields: false });
  const s = sim.snapshot(); assert.ok(s.transfers > 0); assert.equal(s.particles.length + s.absorbed, s.total);
  assert.ok(s.particles.every(p => p.q.every(Number.isFinite)));
});

test('a transmission threshold reflects an otherwise transmissible packet', () => {
  const sim = new UniverseSimulation({ lowResolution: true, threshold: 100 }); sim.launch(16);
  for (let i = 0; i < 160; i++) sim.step(.02, { fields: false });
  assert.equal(sim.transfers, 0); assert.ok(sim.reflections > 0);
});

test('an added contact route changes access without claiming a global horizon', () => {
  const run = open => {
    const sim = new UniverseSimulation({ lowResolution: true, holes: 'a', horizon: 1.15, compact: false, open }); sim.launch(24, true);
    for (let i = 0; i < 250; i++) sim.step(.02, { fields: false });
    return { captured: sim.particles.filter(p => p.origin === 0 && !p.alive).length, escaped: sim.particles.filter(p => p.origin === 0 && p.alive && p.world === 1).length };
  };
  const closed = run(false), open = run(true);
  assert.equal(closed.escaped, 0); assert.ok(closed.captured > 0, JSON.stringify(closed));
  assert.ok(open.escaped > 0, JSON.stringify(open)); assert.ok(open.captured < closed.captured);
});
