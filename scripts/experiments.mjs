import { World, FieldSystem, UniverseSimulation } from '../src/core.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { PRESETS } from '../src/presets.mjs';

const results = { date: new Date().toISOString(), scope: 'Finite-grid classical toy. No Einstein backreaction or quantum tunnelling.', experiments: [] };
for (const [name, bias] of [['degenerate vacua', 0], ['favoured converted phase', .32]]) {
  const a = new World({ dim: 2, n: 48, length: 12, bias, damping: .12 }), b = new World({ dim: 2, n: 4, id: 1 });
  const f = new FieldSystem(a, b, { open: false }); a.seed([0, 0], 1.5);
  const initial = a.statistics();
  for (let i = 0; i < 600; i++) f.step(.015);
  results.experiments.push({ name, bias, time: f.time, initial, final: a.statistics() });
}
for (const geometryB of ['4d', 'torus']) {
  const sim = new UniverseSimulation({ geometryB, biasB: .32 }); sim.seed(0); sim.launch(40);
  const t = performance.now();
  for (let i = 0; i < 200; i++) sim.step(.02);
  const s = sim.snapshot();
  results.experiments.push({ name: 'contact with ' + geometryB, time: s.time, millisecondsPerStep: (performance.now() - t) / 200, worlds: s.worlds.map(({ phi, ...w }) => w), transfers: s.transfers, live: s.particles.length, absorbed: s.absorbed, total: s.total });
}
for (const open of [false, true]) {
  const sim = new UniverseSimulation({ ...PRESETS.horizon.options, open }); sim.launch(24, true);
  for (let i = 0; i < 250; i++) sim.step(.02, { fields: false });
  results.experiments.push({ name: 'horizon contact ' + (open ? 'open' : 'closed'), time: sim.fields.time, sourceCaptured: sim.particles.filter(p => p.origin === 0 && !p.alive).length, sourceInNeighbour: sim.particles.filter(p => p.origin === 0 && p.world === 1 && p.alive).length });
}
const cascade = new UniverseSimulation(PRESETS.cascade.options); cascade.seed(0);
for (let i = 0; i < 800; i++) cascade.step(.02, { particles: false });
results.experiments.push({ name: 'cascade at tau 16', time: cascade.fields.time, worlds: cascade.worlds.map(w => w.statistics()) });
mkdirSync('output', { recursive: true }); writeFileSync('output/experiments.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
