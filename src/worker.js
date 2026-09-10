import { UniverseSimulation } from './core.mjs';
import { PRESETS } from './presets.mjs';

let sim, running = false, visible = true, speed = 1, presetName = 'contact', actions = [], frame = 0;
const dt = .02;
function send(reset = false) {
  if (!sim) return;
  const state = sim.snapshot();
  postMessage({ type: 'state', state, running, reset, preset: presetName }, state.worlds.map(w => w.phi.buffer));
}
function reset(name = presetName, overrides = {}) {
  presetName = name;
  const preset = PRESETS[name], options = { ...preset.options, ...overrides };
  if (options.geometryB === 'torus') { if (options.holes === 'b') options.holes = 'off'; if (options.holes === 'both') options.holes = 'a'; }
  sim = new UniverseSimulation(options); actions = [];
  if (preset.seed) sim.seed(0);
  sim.launch(48, preset.special); send(true);
}
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'init') { running = data.running; reset(PRESETS[data.preset] ? data.preset : 'contact'); return; }
    if (data.type === 'visible') { visible = data.value; return; }
    if (data.type === 'preset') { reset(data.name); return; }
    if (data.type === 'reset') { reset(presetName, sim.options); return; }
    if (data.type === 'geometry') { reset(presetName, { ...sim.options, geometryB: data.value }); return; }
    if (data.type === 'play') running = data.value;
    if (data.type === 'speed') speed = data.value;
    if (data.type === 'options') sim.setOptions(data.options);
    if (data.type === 'seed') sim.seed(data.world, data.location);
    if (data.type === 'launch') sim.launch(32, PRESETS[presetName].special);
    if (data.type === 'probe') sim.probe();
    if (data.type === 'step') sim.step(dt);
    if (data.type === 'export') {
      const snapshot = sim.snapshot();
      for (const w of snapshot.worlds) w.phi = Array.from(w.phi);
      postMessage({ type: 'export', data: { model: 'between-worlds-0.1', dt, preset: presetName, scope: 'Prescribed geometry, classical field, test particles; no Einstein backreaction.', actions, snapshot } });
      return;
    }
    actions.push({ time: sim.fields.time, action: data }); if (actions.length > 2000) actions.shift();
    send();
  } catch (error) { running = false; postMessage({ type: 'error', message: error.message }); }
};
setInterval(() => {
  if (!sim || !running || !visible) return;
  try {
    const start = performance.now();
    for (let i = 0; i < 2 * speed; i++) sim.step(dt);
    if (++frame % 2 === 0) { const state = sim.snapshot(); postMessage({ type: 'state', state, running, preset: presetName, cost: performance.now() - start }, state.worlds.map(w => w.phi.buffer)); }
  } catch (error) { running = false; postMessage({ type: 'error', message: error.message }); }
}, 40);
