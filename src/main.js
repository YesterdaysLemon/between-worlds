import './style.css';
import { UniverseView } from './view.js';
import { PRESETS } from './presets.mjs';
import modelDocument from '../docs/MODEL.md?raw';

const icon = {
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6Z"/></svg>',
  reset: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8a6 6 0 1 1 0 5M4 3v5h5"/></svg>',
  mark: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 13h22v22H5zM13 5h22v22H13zM5 13l8-8M27 13l8-8M27 35l8-8M5 35l8-8"/></svg>'
};
const root = document.querySelector('#app');
root.innerHTML = `
<header class="masthead">
  <div class="brand">${icon.mark}<div><h1>Between worlds<span>.</span></h1><p>A geometry laboratory</p></div></div>
  <div class="header-actions"><span class="model-badge">Invented laws · real equations</span><button class="quiet" id="model-button">Model & sources <span>↗</span></button></div>
</header>
<main class="workspace">
  <aside class="controls" aria-label="Experiment controls">
    <div class="eyebrow">Choose an experiment</div>
    <div class="experiments">${Object.entries(PRESETS).map(([key, p], i) => `<button class="experiment ${i ? '' : 'active'}" data-preset="${key}" aria-pressed="${!i}"><span class="experiment-number">0${i + 1}</span><span><strong>${p.title}</strong><small>${p.subtitle}</small></span><span class="experiment-arrow">↗</span></button>`).join('')}</div>
    <div class="section-divider"></div>
    <label class="control-label" for="geometry">Neighbouring world <span>spatial dimensions</span></label>
    <select id="geometry"><option value="4d">4D volume</option><option value="3d">3D volume</option><option value="torus">2D curved torus</option></select>
    <p class="field-note">Changing geometry starts a fresh run.</p>
    <button id="contact" class="contact-button" aria-pressed="true"><span class="contact-dot"></span><span id="contact-label">Contact is open</span><span id="contact-action">Close ↗</span></button>
    <label class="range-label" for="coupling"><span>Field coupling</span><output id="coupling-value">1.20</output></label>
    <input type="range" id="coupling" min="0" max="3" step=".05" value="1.2">
    <label class="range-label" for="bias"><span>Neighbour’s vacuum bias</span><output id="bias-value">0.240</output></label>
    <input type="range" id="bias" min="0" max=".32" step=".005" value=".24">
    <div class="range-ends"><span>Equal energies</span><span>Conversion favoured</span></div>
    <div class="section-divider"></div>
    <div class="eyebrow">Disturb the system</div>
    <div class="seed-row"><button class="secondary warm" id="seed-a">＋ Seed A</button><button class="secondary cool" id="seed-b">＋ Seed B</button></div>
    <button class="secondary full" id="launch">Launch matter & light <span>→</span></button>
    <button class="secondary full" id="probe">Send a 4D probe <span>↗</span></button>
    <details class="advanced"><summary>Geometry, horizons & contact rules<span>＋</span></summary><div class="advanced-body">
      <label class="check"><input type="checkbox" id="compact" checked><span>Let the field contract one direction</span></label>
      <label class="range-label" for="depth"><span>Smallest remaining depth</span><output id="depth-value">0.25</output></label><input type="range" id="depth" min=".12" max="1" step=".01" value=".25">
      <label class="range-label" for="radius"><span>Seed radius</span><output id="radius-value">1.7</output></label><input type="range" id="radius" min=".5" max="3.2" step=".1" value="1.7">
      <label class="control-label" for="holes">Black-hole background</label><select id="holes"><option value="off">None</option><option value="a">In world A</option><option value="b">In world B</option><option value="both">In both volumes</option></select>
      <p class="field-note" id="hole-note">Uses a prescribed Schwarzschild or Tangherlini background. The torus has no black hole.</p>
      <label class="range-label" for="horizon"><span>Reference horizon radius</span><output id="horizon-value">0.90</output></label><input type="range" id="horizon" min=".4" max="1.5" step=".05" value=".9">
      <button class="secondary full" id="seed-hole">Seed beside A’s horizon</button>
      <label class="check"><input type="checkbox" id="matter-channel" checked><span>Allow matter through contact</span></label>
      <label class="range-label" for="threshold"><span>Transmission energy threshold</span><output id="threshold-value">0.00</output></label><input type="range" id="threshold" min="0" max="1.5" step=".05" value="0">
    </div></details>
    <p class="scope-note">A classical toy with prescribed geometry and test particles. No quantum tunnelling or self-consistent gravity.</p>
  </aside>
  <section class="laboratory" aria-label="Universe simulation">
    <div class="experiment-heading"><div><span class="eyebrow" id="experiment-index">Experiment 01</span><h2 id="experiment-title">First contact</h2></div><p id="experiment-question">${PRESETS.contact.question}</p><select id="mobile-preset" aria-label="Choose experiment">${Object.entries(PRESETS).map(([key, p]) => `<option value="${key}">${p.title}</option>`).join('')}</select></div>
    <div class="stage" id="stage">
      <div class="stage-top"><span class="stage-caption">Coordinate views / shared external time</span><span class="live-state" id="run-state"><i></i>Starting</span></div>
      <div class="world-label world-a" id="world-a"><strong>A <span>3 spatial + time</span></strong><small id="phase-a">Converted phase 0%</small></div>
      <div class="world-label world-b" id="world-b"><strong>B <span id="dimension-b">4 spatial + time</span></strong><small id="phase-b">Converted phase 0%</small></div>
      <div class="view-controls"><label class="check"><input type="checkbox" id="field-visible" checked><span>Field</span></label><label class="check"><input type="checkbox" id="trails-visible" checked><span>Trails</span></label><button class="quiet" id="home-view">Reset view</button></div>
      <div class="view-hint">Drag to orbit · scroll to explore</div>
      <div class="fourth-control" id="fourth-control"><label for="fourth">Rotate through <em>w</em><output id="fourth-value">25°</output></label><input type="range" id="fourth" min="-90" max="90" step="1" value="25"><span>4D → 3D projection</span></div>
      <div class="error-banner" id="error" role="alert" hidden></div>
      <div class="loading" id="loading">Preparing two spaces<span></span></div>
    </div>
    <div class="transport"><div class="transport-actions"><button id="play" class="play-button" aria-label="Pause simulation">${icon.pause}</button><button id="step" class="icon-button" aria-label="Advance one simulation step">▹│</button><button id="reset" class="icon-button" aria-label="Restart experiment">${icon.reset}</button><span class="time">τ <output id="time">0.00</output></span><select id="speed" aria-label="Simulation speed"><option value="1">1×</option><option value="2">2×</option><option value="3">3×</option></select></div><div class="legend"><span><i class="gold"></i>Origin A</span><span><i class="blue"></i>Origin B</span><span><i class="white"></i>Massless here</span></div><button class="quiet export" id="export">Save state ↗</button></div>
    <div class="readouts"><div class="phase-history"><div class="chart-heading"><span>Converted phase</span><span class="chart-key"><i class="gold"></i>A <i class="blue"></i>B</span></div><canvas id="history-chart" aria-label="History of the converted phase volume fraction in each world" role="img"></canvas></div><div class="numbers"><div><span>Crossings</span><strong id="crossings">0</strong></div><div><span>Captured at core</span><strong id="absorbed">0</strong></div><div><span>Live packets</span><strong id="live">0</strong></div></div><div class="crossing-detail"><span class="eyebrow">At the contact</span><p id="crossing-text">A shared field can couple two worlds without forcing either to change phase.</p><span id="crossing-sub">Particles keep their extra momentum as internal energy.</span></div></div>
    <footer class="lab-footer"><span id="model-status">Finite grids · positive metric · test particles</span><button class="quiet" id="notes-button">What am I looking at? ↗</button></footer>
  </section>
</main>
<dialog id="model-dialog"><div class="dialog-top"><span class="eyebrow">The mathematical agreement</span><button class="icon-button" id="close-model" aria-label="Close model explanation">×</button></div><div class="model-copy">
  <h2>Several spaces.<br>One set of contact rules.</h2>
  <p>Each world has its own intrinsic coordinates, a classical scalar field, and a metric used by matter and light. A finite set of oscillator degrees of freedom mediates their contact. All worlds share an external time τ. The gap between the pictures is a diagram, not another physical distance.</p>
  <h3>01 / The field can accept or reject a seed</h3>
  <p>The field evolves on the full intrinsic grid: three coordinates in A, four in the 4D neighbour, or two curved coordinates on the torus. A biased double-well potential and reciprocal contact springs determine the outcome. We insert classical seeds; no quantum tunnelling rate is calculated.</p>
  <div class="equation">φ̈ + γφ̇ = c² Δ<sub>g₀</sub>φ − V′(φ) + contact forces<br>V(φ) = φ²(1 − φ)² − δφ²(3 − 2φ)</div>
  <p>The field lives on a fixed substrate geometry g₀. It drives the matter metric one way. The curved neighbour uses the intrinsic metric of a torus; it is not a flat grid painted onto a doughnut.</p>
  <h3>02 / A direction becomes small, never zero</h3>
  <p>Converted regions reduce one metric scale to a positive floor ε. Matter follows this metric, but it does not feed back into the field. The deformed mesh is a coordinate illustration, not an isometric embedding. The 4D view projects all four simulated coordinates into three display coordinates.</p>
  <div class="equation">a = 1 − (1 − ε) smoothstep(clamp(φ))<br>ds² = −dτ² + Σ s<sub>i</sub>² (dq<sub>i</sub> − u<sub>i</sub>dτ)²</div>
  <h3>03 / Contact does not erase momentum</h3>
  <p>We match momentum in local orthonormal frames. Components absent in the receiving space become internal momentum. A massless 4D excitation with extra momentum can therefore behave as a massive excitation in 3D. This is an explicit junction rule, inspired by dimensional reduction.</p>
  <div class="equation">m<sub>effective</sub>² = m₀² + |p<sub>hidden</sub>|²<br>H = u · p + √(m<sub>effective</sub>² + Σ p<sub>i</sub>² / s<sub>i</sub>²)</div>
  <p>Gold and blue indicate packet origin. White means massless in its current world. Purple marks a deliberately prepared probe. Traces are test-particle paths, not atoms or a chemistry simulation. The interface can reflect a packet whose normal kinetic energy falls below the selected threshold.</p>
  <h3>04 / A horizon belongs to a causal structure</h3>
  <p>With undeformed flat spatial slices, the inward flow u gives a Schwarzschild background in 3D or a Tangherlini background in 4D. A local outward ray has radial speed 1 − (r<sub>h</sub>/r)<sup>(d−2)/2</sup>. The thin sphere is the undeformed reference radius; the small dark core is an absorbing numerical boundary.</p>
  <p>Deformation changes that background. The torus has no Schwarzschild black hole. We do not solve a global event horizon, Einstein backreaction, Hawking radiation, or black-hole-seeded tunnelling. A contact can supply an extra route in this chosen model, so a reference horizon need not be a horizon of the entire coupled system.</p>
  <h3>What the checks establish</h3><p>Tests cover reciprocal field energy exchange and timestep convergence, weighted flux on the torus, waves along the fourth coordinate, local contact energy and effective mass, radial null speeds, particle accounting and threshold reflection. These validate the stated toy equations; they do not establish a physical theory of interacting universes.</p>
  <h3>Mathematical starting points</h3><ul class="sources"><li><a href="https://arxiv.org/abs/hep-th/0612202" target="_blank" rel="noreferrer">Cardoso et al. · Coupled bulk and brane fields</a></li><li><a href="https://journals.aps.org/prd/abstract/10.1103/PhysRevD.15.2929" target="_blank" rel="noreferrer">Coleman · The fate of the false vacuum</a></li><li><a href="https://arxiv.org/abs/1401.0017" target="_blank" rel="noreferrer">Gregory, Moss & Withers · Black holes as bubble nucleation sites</a></li><li><a href="https://link.springer.com/article/10.12942/lrr-2008-6" target="_blank" rel="noreferrer">Emparan & Reall · Black holes in higher dimensions</a></li><li><a href="https://www.einstein-online.info/en/spotlight/hiding_extra_dimensions/" target="_blank" rel="noreferrer">Einstein Online · Compact dimensions</a></li></ul>
  <button class="secondary full" id="download-model">Download full model specification ↗</button>
</div></dialog>`;

const $ = id => document.getElementById(id);
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let state = null, running = false, view, history = [], lastHistoryTime = -1, activePreset = 'contact', pinnedProbe = null;
try { view = new UniverseView($('stage'), [$('world-a'), $('world-b')]); } catch (error) { showError(`The geometry view could not start: ${error.message}`); }
function send(type, extra = {}) { worker.postMessage({ type, ...extra }); }
function showError(message) { $('error').hidden = false; $('error').textContent = message; $('loading').hidden = true; }
function download(name, text, mime = 'application/json') { const url = URL.createObjectURL(new Blob([text], { type: mime })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function setValue(id, value) { if (document.activeElement !== $(id)) $(id).value = value; }
function updateUI(data) {
  state = data.state; running = data.running; window.__labState = state;
  if (data.reset) { history = []; lastHistoryTime = -1; pinnedProbe = null; activePreset = data.preset; $('error').hidden = true; }
  const preset = PRESETS[data.preset], index = Object.keys(PRESETS).indexOf(data.preset) + 1;
  setValue('mobile-preset', data.preset);
  $('experiment-index').textContent = `Experiment 0${index}`; $('experiment-title').textContent = preset.title; $('experiment-question').textContent = preset.question;
  for (const b of document.querySelectorAll('[data-preset]')) { const selected = b.dataset.preset === data.preset; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', selected); }
  $('time').textContent = state.time.toFixed(2); $('run-state').innerHTML = `<i class="${running ? '' : 'paused'}"></i>${running ? 'Evolving' : 'Paused'}`;
  $('play').innerHTML = running ? icon.pause : icon.play; $('play').setAttribute('aria-label', running ? 'Pause simulation' : 'Run simulation'); $('step').disabled = running;
  const o = state.options;
  setValue('geometry', o.geometryB); setValue('coupling', o.coupling); setValue('bias', o.biasB); setValue('depth', o.minimumScale); setValue('radius', o.seedRadius); setValue('holes', o.holes); setValue('horizon', o.horizon); setValue('threshold', o.threshold);
  $('coupling-value').textContent = o.coupling.toFixed(2); $('bias-value').textContent = o.biasB.toFixed(3); $('depth-value').textContent = o.minimumScale.toFixed(2); $('radius-value').textContent = o.seedRadius.toFixed(1); $('horizon-value').textContent = o.horizon.toFixed(2); $('threshold-value').textContent = o.threshold.toFixed(2);
  $('compact').checked = o.compact; $('matter-channel').checked = o.matterChannel;
  $('contact').setAttribute('aria-pressed', o.open); $('contact').classList.toggle('closed', !o.open); $('contact-label').textContent = o.open ? 'Contact is open' : 'Worlds are separated'; $('contact-action').textContent = o.open ? 'Close ↗' : 'Connect ↗';
  const b = state.worlds[1]; $('dimension-b').textContent = `${b.dim} spatial + time${b.geometry === 'torus' ? ' / torus' : ''}`; $('fourth-control').hidden = b.dim !== 4;
  for (const option of $('holes').options) option.disabled = b.dim === 2 && ['b', 'both'].includes(option.value);
  $('seed-hole').disabled = state.worlds[0].horizon === 0;
  $('probe').disabled = b.dim !== 4 || state.total >= 280; $('launch').disabled = state.total >= 280;
  $('phase-a').textContent = `Converted phase ${(100 * state.worlds[0].fraction).toFixed(1)}%`; $('phase-b').textContent = `Converted phase ${(100 * b.fraction).toFixed(1)}%`;
  $('crossings').textContent = state.transfers; $('absorbed').textContent = state.absorbed; $('live').textContent = state.particles.length;
  if (state.lastTransfer?.probe) pinnedProbe = state.lastTransfer;
  const crossing = pinnedProbe || state.lastTransfer;
  if (crossing) { $('crossing-text').textContent = `${crossing.probe ? 'Probe' : 'Packet'} ${crossing.id}: ${crossing.from}D → ${crossing.to}D`; $('crossing-sub').textContent = `Effective rest mass ${crossing.beforeMass.toFixed(3)} → ${crossing.afterMass.toFixed(3)} · τ ${crossing.time.toFixed(2)}`; }
  else { $('crossing-text').textContent = 'A shared field can couple two worlds without forcing either to change phase.'; $('crossing-sub').textContent = 'Particles keep their extra momentum as internal energy.'; }
  $('model-status').textContent = state.worlds.some(w => w.horizon) ? 'Ring = undeformed reference horizon · global horizon not solved' : `${state.worlds.reduce((n, w) => n + w.nodes, 0).toLocaleString()} field sites · positive metric · test particles`;
  if (state.time > lastHistoryTime + .12 || !history.length) { history.push({ t: state.time, a: state.worlds[0].fraction, b: b.fraction }); if (history.length > 260) history.shift(); lastHistoryTime = state.time; drawHistory(); }
  $('loading').hidden = true; view?.setState(state, data.reset);
}
worker.onmessage = ({ data }) => { if (data.type === 'state') updateUI(data); if (data.type === 'error') showError(data.message); if (data.type === 'export') download(`between-worlds-${activePreset}-${Math.floor(state.time)}.json`, JSON.stringify(data.data, null, 2)); };
worker.onerror = e => showError(e.message || 'The simulation worker stopped.');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; send('init', { running: !reduced, preset: new URLSearchParams(location.search).get('experiment') });
document.addEventListener('visibilitychange', () => send('visible', { value: !document.hidden }));
for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => send('preset', { name: button.dataset.preset }));
$('mobile-preset').onchange = e => send('preset', { name: e.target.value });
$('play').onclick = () => send('play', { value: !running }); $('step').onclick = () => send('step'); $('reset').onclick = () => send('reset'); $('export').onclick = () => send('export');
$('contact').onclick = () => state && send('options', { options: { open: !state.options.open } }); $('geometry').onchange = e => send('geometry', { value: e.target.value });
for (const [id, key] of [['coupling', 'coupling'], ['bias', 'biasB'], ['depth', 'minimumScale'], ['radius', 'seedRadius'], ['horizon', 'horizon'], ['threshold', 'threshold']]) $(id).addEventListener('input', e => send('options', { options: { [key]: Number(e.target.value) } }));
$('holes').onchange = e => send('options', { options: { holes: e.target.value } });
$('compact').onchange = e => send('options', { options: { compact: e.target.checked } }); $('matter-channel').onchange = e => send('options', { options: { matterChannel: e.target.checked } });
$('seed-a').onclick = () => send('seed', { world: 0 }); $('seed-b').onclick = () => send('seed', { world: 1 }); $('seed-hole').onclick = () => send('seed', { world: 0, location: 'hole' });
$('launch').onclick = () => send('launch'); $('probe').onclick = () => { pinnedProbe = null; send('probe'); }; $('speed').onchange = e => send('speed', { value: Number(e.target.value) });
$('fourth').oninput = e => { $('fourth-value').textContent = `${e.target.value}°`; view?.setAngle(Number(e.target.value) * Math.PI / 180); };
$('field-visible').onchange = e => view?.toggle('field', e.target.checked); $('trails-visible').onchange = e => view?.toggle('trails', e.target.checked); $('home-view').onclick = () => view?.home();
const openModel = () => $('model-dialog').showModal(); $('model-button').onclick = openModel; $('notes-button').onclick = openModel; $('close-model').onclick = () => $('model-dialog').close();
$('model-dialog').addEventListener('click', e => { if (e.target === $('model-dialog')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
$('download-model').onclick = () => download('between-worlds-model.md', modelDocument, 'text/markdown');

function drawHistory() {
  const canvas = $('history-chart'), bounds = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 1.65); if (!bounds.width) return;
  canvas.width = bounds.width * dpr; canvas.height = bounds.height * dpr; const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const width = bounds.width, height = bounds.height, left = 29, right = width - 8, top = 9, bottom = height - 23;
  ctx.font = '10px ui-monospace, monospace'; ctx.fillStyle = '#aab8bb'; ctx.strokeStyle = '#29363f'; ctx.lineWidth = 1;
  for (const f of [0, .5, 1]) { const y = bottom - (bottom - top) * f; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.fillText(String(f * 100), 0, y + 3); }
  if (!history.length) return;
  const first = history[0].t, last = Math.max(first + 1, history.at(-1).t);
  for (const [key, color] of [['a', '#f2b879'], ['b', '#93cfde']]) { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); history.forEach((p, i) => { const x = left + (right - left) * (p.t - first) / (last - first), y = bottom - (bottom - top) * p[key]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); }
  ctx.fillStyle = '#aab8bb'; ctx.fillText(first.toFixed(1), left, height - 4); ctx.textAlign = 'right'; ctx.fillText(`τ ${history.at(-1).t.toFixed(1)}`, right, height - 4);
}
new ResizeObserver(drawHistory).observe($('history-chart'));
