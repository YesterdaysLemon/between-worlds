import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const PALETTE = [new THREE.Color('#f2b879'), new THREE.Color('#93cfde')];
const TAU = Math.PI * 2;
function indexAt(w, q) {
  let index = 0, stride = 1;
  for (let a = 0; a < w.dim; a++) { const i = Math.max(0, Math.min(w.n - 1, Math.floor(((q[a] || 0) / w.length + .5) * w.n))); index += i * stride; stride *= w.n; }
  return index;
}
function fieldAt(w, q) { return Math.max(0, Math.min(1, w.phi[indexAt(w, q)] || 0)); }
function setBuffer(geometry, name, values, itemSize = 3) {
  let attribute = geometry.getAttribute(name);
  if (!attribute || attribute.array.length < values.length) {
    // Grow geometrically and reuse GPU buffers during ordinary snapshots.
    const count = 2 ** Math.ceil(Math.log2(Math.max(1, Math.ceil(values.length / itemSize))));
    geometry.dispose();
    attribute = new THREE.BufferAttribute(new Float32Array(count * itemSize), itemSize).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, attribute);
  }
  attribute.array.set(values); attribute.needsUpdate = true;
  if (name === 'position') geometry.setDrawRange(0, values.length / itemSize);
}

export class UniverseView {
  constructor(container, labels) {
    this.container = container; this.labels = labels; this.worlds = []; this.state = null; this.angle = .43; this.showField = true; this.showTrails = true; this.trails = new Map(); this.dirty = true;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65)); this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.setAttribute('aria-label', 'Interactive views of two mathematical spaces. Drag to orbit and scroll to zoom.');
    container.prepend(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(39, 1, .1, 180); this.camera.position.set(12, 10, 29);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); this.controls.enableDamping = false; this.controls.enablePan = false; this.controls.minDistance = 12; this.controls.maxDistance = 65;
    this.controls.addEventListener('change', () => this.dirty = true);
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailMesh = new THREE.LineSegments(this.trailGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .6, depthWrite: false })); this.scene.add(this.trailMesh);
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMesh = new THREE.Points(this.particleGeometry, this.pointMaterial(.18, .98)); this.scene.add(this.particleMesh);
    this.bridgeGeometry = new THREE.BufferGeometry();
    this.bridge = new THREE.LineSegments(this.bridgeGeometry, new THREE.LineBasicMaterial({ color: '#c6d8ce', transparent: true, opacity: .5 })); this.scene.add(this.bridge);
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(container);
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  pointMaterial(size, opacity) {
    return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexColors: true,
      uniforms: { size: { value: size }, opacity: { value: opacity }, pixel: { value: this.renderer.getPixelRatio() } },
      vertexShader: 'uniform float size; uniform float pixel; varying vec3 pointColor; void main(){ pointColor=color; vec4 p=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*p; gl_PointSize=clamp(size*600.0*pixel/(-p.z),1.2,18.0); }',
      fragmentShader: 'uniform float opacity; varying vec3 pointColor; void main(){float d=length(gl_PointCoord-.5)*2.0; if(d>1.0)discard; gl_FragColor=vec4(pointColor,opacity*smoothstep(1.0,.25,d));\n#include <colorspace_fragment>\n}' });
  }
  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight; if (!width || !height) return;
    this.renderer.setSize(width, height); this.camera.aspect = width / height;
    const mobile = width < 610;
    if (this.mobile !== mobile) { this.mobile = mobile; this.camera.position.set(...(mobile ? [15, 7, 43] : [12, 10, 29])); this.controls.target.set(0, 0, 0); this.controls.update(); }
    this.camera.updateProjectionMatrix(); this.arrange(); this.dirty = true;
  }
  arrange() {
    for (let i = 0; i < this.worlds.length; i++) this.worlds[i].group.position.set(...(this.mobile ? [0, i === 0 ? 5.5 : -5.5, 0] : [i === 0 ? -6.1 : 6.1, 0, 0]));
    this.refreshGeometry();
  }
  map(w, q, deform = true) {
    if (w.geometry === 'torus') {
      const a = q[0] / w.length * TAU, b = q[1] / w.length * TAU;
      return [(1.9 + .85 * Math.cos(a)) * Math.cos(b), .85 * Math.sin(a), (1.9 + .85 * Math.cos(a)) * Math.sin(b)];
    }
    const v = q.slice(0, w.dim), fraction = fieldAt(w, q), phase = fraction * fraction * (3 - 2 * fraction);
    if (deform && this.state.options.compact && w.dim >= 3) v[w.dim - 1] *= 1 - (1 - this.state.options.minimumScale) * phase;
    if (w.dim === 4) {
      const c = Math.cos(this.angle), s = Math.sin(this.angle), x = c * v[0] - s * v[3], extra = s * v[0] + c * v[3];
      const f = .78 / (1 - extra / 12);
      return [x * f, v[1] * f, v[2] * f];
    }
    return [v[0], v[1], v[2] || 0];
  }
  buildWorld(w) {
    const group = new THREE.Group(), dotGeometry = new THREE.BufferGeometry(), lineGeometry = new THREE.BufferGeometry();
    const points = new THREE.Points(dotGeometry, this.pointMaterial(w.dim === 4 ? .072 : .065, .75)); group.add(points);
    const line = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: PALETTE[w.id], transparent: true, opacity: .3 })); group.add(line);
    const portal = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#d9e5cd', transparent: true, opacity: .9 })); group.add(portal);
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: '#05090d' })); group.add(core);
    const horizon = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 20, 12)), new THREE.LineBasicMaterial({ color: '#e1b298', transparent: true, opacity: .26 })); group.add(horizon);
    const sampleIndices = [], samplePoints = [], maxPoints = w.dim === 4 ? 2400 : w.geometry === 'torus' ? w.n ** 2 : 1600, count = w.n ** w.dim;
    const step = Math.max(1, Math.ceil(count / maxPoints));
    for (let i = 0; i < count; i += step) {
      sampleIndices.push(i); const q = [];
      for (let a = 0; a < w.dim; a++) q.push((((i / w.n ** a) | 0) % w.n + .5) / w.n * w.length - w.length / 2);
      samplePoints.push(q);
    }
    const gridPaths = [];
    if (w.geometry === 'torus') {
      for (let a = 0; a < 2; a++) for (let k = 0; k < (a ? 10 : 20); k++) {
        const path = []; for (let j = 0; j <= 64; j++) { const q = [0, 0]; q[a] = j / 64 * w.length - w.length / 2; q[1 - a] = k / (a ? 10 : 20) * w.length - w.length / 2; path.push(q); } gridPaths.push(path);
      }
    } else {
      const radius = w.length / 2;
      for (let vertex = 0; vertex < 1 << w.dim; vertex++) for (let axis = 0; axis < w.dim; axis++) if (!(vertex >> axis & 1)) {
        const path = []; for (let j = 0; j <= 20; j++) { const q = Array.from({ length: w.dim }, (_, a) => vertex >> a & 1 ? radius : -radius); q[axis] = -radius + j / 20 * radius * 2; path.push(q); } gridPaths.push(path);
      }
      // Three internal coordinate planes provide a reference for local deformation.
      if (w.dim === 3) for (let axis = 0; axis < 3; axis++) for (let k = -3; k <= 3; k++) {
        const path = []; for (let j = 0; j <= 20; j++) { const q = [0, 0, 0]; q[axis] = -radius + j / 20 * radius * 2; q[(axis + 1) % 3] = k; path.push(q); } gridPaths.push(path);
      }
    }
    this.scene.add(group);
    return { group, points, dotGeometry, lineGeometry, line, portal, core, horizon, sampleIndices, samplePoints, gridPaths, meta: w };
  }
  clearWorlds() {
    for (const world of this.worlds) { world.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); this.scene.remove(world.group); }
    this.worlds = []; this.trails.clear();
  }
  setState(state, reset = false) {
    this.state = state;
    if (reset || !this.worlds.length || this.worlds[1].meta.dim !== state.worlds[1].dim || this.worlds[1].meta.geometry !== state.worlds[1].geometry) {
      this.clearWorlds(); this.worlds = state.worlds.map(w => this.buildWorld(w)); this.arrange();
    }
    for (const p of state.particles) {
      let record = this.trails.get(p.id);
      if (!record || record.world !== p.world) { record = { world: p.world, points: [], origin: p.origin, ray: p.ray }; this.trails.set(p.id, record); }
      if (record.points.length && Math.hypot(...p.q.map((v, i) => v - record.points.at(-1)[i])) > 2) record.points = [];
      record.points.push([...p.q]); if (record.points.length > 25) record.points.shift();
    }
    const live = new Set(state.particles.map(p => p.id)); for (const id of this.trails.keys()) if (!live.has(id)) this.trails.delete(id);
    this.refreshGeometry(); this.dirty = true;
  }
  refreshGeometry() {
    if (!this.state || !this.worlds.length) return;
    for (const entry of this.worlds) {
      const w = this.state.worlds[entry.meta.id]; entry.meta = w;
      const position = [], color = [], grid = [];
      for (let j = 0; j < entry.sampleIndices.length; j++) {
        const phi = Math.max(0, Math.min(1, w.phi[entry.sampleIndices[j]])), brightness = .09 + .85 * phi;
        position.push(...this.map(w, entry.samplePoints[j]));
        const c = PALETTE[w.id].clone().multiplyScalar(brightness);
        color.push(c.r, c.g, c.b);
      }
      setBuffer(entry.dotGeometry, 'position', position); setBuffer(entry.dotGeometry, 'color', color);
      entry.dotGeometry.computeBoundingSphere(); entry.points.visible = this.showField;
      for (const path of entry.gridPaths) for (let i = 1; i < path.length; i++) grid.push(...this.map(w, path[i - 1]), ...this.map(w, path[i]));
      setBuffer(entry.lineGeometry, 'position', grid); entry.lineGeometry.computeBoundingSphere();
      const pp = [];
      for (let j = 0; j <= 80; j++) { const t = j / 80 * TAU, q = Array(w.dim).fill(0); q[0] = w.gate; q[1] = 1.5 * Math.cos(t); if (w.dim > 2) q[2] = 1.5 * Math.sin(t); pp.push(...this.map(w, q)); }
      setBuffer(entry.portal.geometry, 'position', pp); entry.portal.geometry.computeBoundingSphere(); entry.portal.material.opacity = this.state.options.open ? .85 : .18;
      entry.core.visible = entry.horizon.visible = w.horizon > 0;
      if (w.horizon) { const p = this.map(w, w.holeCenter, false); entry.core.position.set(...p); entry.horizon.position.set(...p); entry.core.scale.setScalar(w.horizon * .2); entry.horizon.scale.setScalar(w.horizon * (w.dim === 4 ? .78 : 1)); }
    }
    this.updatePackets(); this.updateBridge();
  }
  globalPoint(world, q) { const entry = this.worlds[world], a = this.map(entry.meta, q); return [a[0] + entry.group.position.x, a[1] + entry.group.position.y, a[2]]; }
  updatePackets() {
    const positions = [], colors = [], trails = [], trailColors = [];
    for (const p of this.state.particles) {
      positions.push(...this.globalPoint(p.world, p.q));
      const c = p.probe ? new THREE.Color('#d9a8ee') : p.mass < .00001 ? new THREE.Color('#f5f5da') : PALETTE[p.origin]; colors.push(c.r, c.g, c.b);
      const history = this.trails.get(p.id)?.points || [];
      for (let i = 1; i < history.length; i++) { trails.push(...this.globalPoint(p.world, history[i - 1]), ...this.globalPoint(p.world, history[i])); const strength = .08 + .65 * i / history.length; for (let j = 0; j < 2; j++) trailColors.push(c.r * strength, c.g * strength, c.b * strength); }
    }
    setBuffer(this.particleGeometry, 'position', positions); setBuffer(this.particleGeometry, 'color', colors); this.particleGeometry.computeBoundingSphere();
    setBuffer(this.trailGeometry, 'position', trails); setBuffer(this.trailGeometry, 'color', trailColors); this.trailGeometry.computeBoundingSphere(); this.trailMesh.visible = this.showTrails;
  }
  updateBridge() {
    const start = new THREE.Vector3(...this.globalPoint(0, [this.state.worlds[0].gate, 0, 0, 0])), end = new THREE.Vector3(...this.globalPoint(1, [this.state.worlds[1].gate, 0, 0, 0]));
    const positions = [];
    for (let i = 0; i < 7; i++) {
      const eta = this.state.mediator[i % this.state.mediator.length] || 0;
      const a = start.clone(), b = end.clone(); a.y += (i - 3) * .1; b.y += (i - 3) * .1;
      const midpoint = a.clone().lerp(b, .5); midpoint.z += 1.2 + .7 * Math.sin(eta * 3 + i * .3);
      const curve = new THREE.QuadraticBezierCurve3(a, midpoint, b), points = curve.getPoints(35);
      for (let j = 1; j < points.length; j++) positions.push(...points[j - 1].toArray(), ...points[j].toArray());
    }
    setBuffer(this.bridgeGeometry, 'position', positions); this.bridgeGeometry.computeBoundingSphere();
    this.bridge.material.opacity = this.state.options.open && this.state.options.coupling > 0 ? .2 + Math.min(.4, Math.abs(this.state.mediator[0] || 0)) : .045;
  }
  setAngle(value) { this.angle = value; this.refreshGeometry(); this.dirty = true; }
  toggle(layer, value) { if (layer === 'field') this.showField = value; if (layer === 'trails') this.showTrails = value; this.refreshGeometry(); this.dirty = true; }
  home() { this.camera.position.set(...(this.mobile ? [15, 7, 43] : [12, 10, 29])); this.controls.target.set(0, 0, 0); this.controls.update(); this.dirty = true; }
  loop() {
    requestAnimationFrame(this.loop);
    if (document.hidden || !this.dirty) return;
    this.renderer.render(this.scene, this.camera); this.dirty = false;
    for (let i = 0; i < this.worlds.length; i++) {
      const p = this.worlds[i].group.position.clone(); p.y += this.worlds[i].meta.geometry === 'torus' ? 3.1 : 4.7; p.project(this.camera);
      this.labels[i].style.left = `${Math.max(13, Math.min(87, (p.x * .5 + .5) * 100))}%`; this.labels[i].style.top = `${Math.max(9, Math.min(87, (-p.y * .5 + .5) * 100))}%`;
    }
  }
}
