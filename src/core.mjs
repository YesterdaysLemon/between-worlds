// A discrete, mixed-dimensional toy. The complete model contract is docs/MODEL.md.
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const wrap = (x, length) => ((x + length / 2) % length + length) % length - length / 2;
export const potential = (p, bias, barrier = 1) => barrier * p * p * (1 - p) ** 2 - bias * p * p * (3 - 2 * p);
export const potentialPrime = (p, bias, barrier = 1) => 2 * barrier * p * (1 - p) * (1 - 2 * p) - 6 * bias * p * (1 - p);
export function randomGenerator(seed = 11471) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export class World {
  constructor({ dim = 3, n = 18, length = 8, geometry = 'flat', bias = .24, waveSpeed = .85, damping = .055, id = 0 } = {}) {
    Object.assign(this, { dim, n, length, geometry, bias, waveSpeed, damping, id });
    this.h = length / n; this.count = n ** dim; this.gate = id === 0 ? 2.0 : -2.0;
    this.phi = new Float64Array(this.count); this.velocity = new Float64Array(this.count); this.force = new Float64Array(this.count);
    this.volume = new Float64Array(this.count); this.coords = new Float32Array(this.count * dim);
    this.strides = Array.from({ length: dim }, (_, a) => n ** a);
    this.neighbors = new Int32Array(this.count * dim * 2); this.conductance = new Float64Array(this.neighbors.length);
    this.horizon = 0; this.compact = true; this.minimumScale = .25;
    this.blackHoleCenter = [this.gate + (id === 0 ? -.45 : .45), 0, 0, 0];
    for (let i = 0; i < this.count; i++) {
      const q = [];
      for (let a = 0; a < dim; a++) this.coords[i * dim + a] = q[a] = (((i / this.strides[a]) | 0) % n + .5) * this.h - length / 2;
      this.volume[i] = this.baseScales(q).reduce((a, b) => a * b, 1) * this.h ** dim;
    }
    for (let i = 0; i < this.count; i++) {
      const q = this.point(i), scales = this.baseScales(q);
      for (let a = 0; a < dim; a++) for (let side = 0; side < 2; side++) {
        const digit = ((i / this.strides[a]) | 0) % n, step = side ? 1 : -1;
        let target = digit + step;
        if (a === 0 && geometry !== 'torus') target = clamp(target, 0, n - 1);
        else target = (target + n) % n;
        const j = i + (target - digit) * this.strides[a], k = (i * dim + a) * 2 + side;
        this.neighbors[k] = j;
        if (j === i) continue;
        const s = (scales[a] + this.baseScales(this.point(j))[a]) * .5;
        this.conductance[k] = .5 * (this.volume[i] + this.volume[j]) / (s * s * this.h * this.h);
      }
    }
  }
  point(i) { return Array.from(this.coords.subarray(i * this.dim, (i + 1) * this.dim)); }
  baseScales(q) {
    if (this.geometry !== 'torus') return Array(this.dim).fill(1);
    const theta = 2 * Math.PI * q[0] / this.length;
    return [.85 * 2 * Math.PI / this.length, (1.9 + .85 * Math.cos(theta)) * 2 * Math.PI / this.length];
  }
  nearest(q) {
    let i = 0;
    for (let a = 0; a < this.dim; a++) {
      const x = a === 0 && this.geometry !== 'torus' ? clamp(q[a] ?? 0, -this.length / 2, this.length / 2 - 1e-8) : wrap(q[a] ?? 0, this.length);
      i += clamp(Math.floor((x + this.length / 2) / this.h), 0, this.n - 1) * this.strides[a];
    }
    return i;
  }
  sample(q, field = this.phi) {
    const left = [], right = [], fraction = [];
    for (let a = 0; a < this.dim; a++) {
      const x = (q[a] ?? 0) / this.h + this.n / 2 - .5, b = Math.floor(x);
      fraction[a] = x - b;
      if (a === 0 && this.geometry !== 'torus') { left[a] = clamp(b, 0, this.n - 1); right[a] = clamp(b + 1, 0, this.n - 1); }
      else { left[a] = (b % this.n + this.n) % this.n; right[a] = (left[a] + 1) % this.n; }
    }
    let value = 0;
    for (let bits = 0; bits < 1 << this.dim; bits++) {
      let i = 0, weight = 1;
      for (let a = 0; a < this.dim; a++) { const r = bits >> a & 1; i += (r ? right[a] : left[a]) * this.strides[a]; weight *= r ? fraction[a] : 1 - fraction[a]; }
      value += weight * field[i];
    }
    return value;
  }
  scales(q) {
    const s = this.baseScales(q);
    if (this.compact && this.dim >= 3) s[this.dim - 1] *= 1 - (1 - this.minimumScale) * smooth(this.sample(q));
    return s;
  }
  flow(q) {
    const result = Array(this.dim).fill(0);
    if (!this.horizon || this.dim < 3 || this.geometry !== 'flat') return result;
    const d = q.map((x, a) => x - this.blackHoleCenter[a]), r = Math.hypot(...d);
    const speed = (this.horizon / Math.max(r, this.horizon * .12)) ** ((this.dim - 2) / 2);
    for (let a = 0; a < this.dim; a++) result[a] = -speed * d[a] / Math.max(r, 1e-8);
    return result;
  }
  computeForce() {
    const nn = this.dim * 2, c2 = this.waveSpeed ** 2;
    for (let i = 0; i < this.count; i++) {
      let sum = 0;
      for (let a = 0; a < nn; a++) { const k = i * nn + a; sum += this.conductance[k] * (this.phi[this.neighbors[k]] - this.phi[i]); }
      this.force[i] = c2 * sum / this.volume[i] - potentialPrime(this.phi[i], this.bias);
    }
  }
  seed(q, radius = 1.7, amplitude = 1) {
    for (let i = 0; i < this.count; i++) {
      let r2 = 0;
      for (let a = 0; a < this.dim; a++) {
        let d = this.coords[i * this.dim + a] - (q[a] ?? 0);
        if (a > 0 || this.geometry === 'torus') d = wrap(d, this.length);
        r2 += d * d;
      }
      const value = amplitude * .5 * (1 - Math.tanh((Math.sqrt(r2) - radius) / .45));
      this.phi[i] = Math.max(this.phi[i], value);
    }
  }
  energy() {
    let e = 0;
    for (let i = 0; i < this.count; i++) {
      e += this.volume[i] * (.5 * this.velocity[i] ** 2 + potential(this.phi[i], this.bias));
      for (let a = 0; a < this.dim * 2; a++) {
        const k = i * this.dim * 2 + a, j = this.neighbors[k];
        if (j > i) e += .5 * this.waveSpeed ** 2 * this.conductance[k] * (this.phi[j] - this.phi[i]) ** 2;
      }
    }
    return e;
  }
  statistics() {
    let converted = 0, volume = 0, min = Infinity, max = -Infinity;
    for (let i = 0; i < this.count; i++) { volume += this.volume[i]; if (this.phi[i] > .5) converted += this.volume[i]; min = Math.min(min, this.phi[i]); max = Math.max(max, this.phi[i]); }
    return { fraction: converted / volume, min, max, dimensions: this.dim, nodes: this.count };
  }
}

export class ContactField {
  constructor(a, b, { coupling = 1.2, aperture = 1.5, open = true, omega = .3, damping = .055 } = {}) {
    Object.assign(this, { a, b, coupling, aperture, open, omega, damping });
    this.links = [];
    const shared = Math.min(a.dim, b.dim), side = shared === 3 ? 5 : 9, total = side ** (shared - 1);
    for (let j = 0; j < total; j++) {
      const qa = Array(a.dim).fill(0), qb = Array(b.dim).fill(0); qa[0] = a.gate; qb[0] = b.gate;
      for (let axis = 1; axis < shared; axis++) qa[axis] = qb[axis] = (((j / side ** (axis - 1)) | 0) % side + .5) / side * aperture * 2 - aperture;
      this.links.push({ ia: a.nearest(qa), ib: b.nearest(qb), eta: 0, velocity: 0, force: 0, weight: (2 * aperture) ** (shared - 1) / total });
    }
  }
  computeForce() {
    const k = this.open ? this.coupling : 0;
    for (const p of this.links) {
      const da = this.a.phi[p.ia] - p.eta, db = this.b.phi[p.ib] - p.eta;
      this.a.force[p.ia] -= k * p.weight * da / this.a.volume[p.ia];
      this.b.force[p.ib] -= k * p.weight * db / this.b.volume[p.ib];
      p.force = k * (da + db) - this.omega ** 2 * p.eta;
    }
  }
  energy() {
    const k = this.open ? this.coupling : 0;
    return this.links.reduce((e, p) => e + p.weight * (.5 * p.velocity ** 2 + .5 * this.omega ** 2 * p.eta ** 2 + .5 * k * ((this.a.phi[p.ia] - p.eta) ** 2 + (this.b.phi[p.ib] - p.eta) ** 2)), 0);
  }
}

export class FieldSystem {
  constructor(a, b, options = {}) { this.worlds = [a, b]; this.contact = new ContactField(a, b, options); this.time = 0; this.dissipated = 0; }
  forces() { for (const w of this.worlds) w.computeForce(); this.contact.computeForce(); }
  step(dt) {
    // Strang damping + velocity Verlet: reciprocal contact forces share one step.
    for (const w of this.worlds) {
      const d = Math.exp(-w.damping * dt / 2);
      for (let i = 0; i < w.count; i++) { const old = w.velocity[i]; w.velocity[i] *= d; this.dissipated += .5 * w.volume[i] * old ** 2 * (1 - d * d); }
    }
    const bridgeDamping = Math.exp(-this.contact.damping * dt / 2);
    for (const l of this.contact.links) { this.dissipated += .5 * l.weight * l.velocity ** 2 * (1 - bridgeDamping ** 2); l.velocity *= bridgeDamping; }
    this.forces();
    for (const w of this.worlds) for (let i = 0; i < w.count; i++) { w.velocity[i] += dt * .5 * w.force[i]; w.phi[i] += dt * w.velocity[i]; }
    for (const l of this.contact.links) { l.velocity += dt * .5 * l.force; l.eta += dt * l.velocity; }
    this.forces();
    for (const w of this.worlds) {
      const d = Math.exp(-w.damping * dt / 2);
      for (let i = 0; i < w.count; i++) { w.velocity[i] += dt * .5 * w.force[i]; const old = w.velocity[i]; w.velocity[i] *= d; this.dissipated += .5 * w.volume[i] * old ** 2 * (1 - d * d); }
    }
    for (const l of this.contact.links) { l.velocity += dt * .5 * l.force; this.dissipated += .5 * l.weight * l.velocity ** 2 * (1 - bridgeDamping ** 2); l.velocity *= bridgeDamping; }
    this.time += dt;
  }
  energy() { return this.worlds.reduce((s, w) => s + w.energy(), 0) + this.contact.energy(); }
}

export function effectiveMass(particle, dim) {
  let m2 = particle.mass ** 2;
  for (let a = dim; a < 4; a++) m2 += particle.hidden[a] ** 2;
  return Math.sqrt(m2);
}
export function hamiltonian(w, q, p, mass) {
  const scales = w.scales(q), flow = w.flow(q);
  let e2 = mass ** 2, shift = 0;
  for (let a = 0; a < w.dim; a++) { e2 += (p[a] / scales[a]) ** 2; shift += flow[a] * p[a]; }
  return Math.sqrt(e2) + shift;
}
export function derivatives(w, q, p, mass) {
  const scales = w.scales(q), flow = w.flow(q), dq = [], dp = [];
  let e2 = mass ** 2;
  for (let a = 0; a < w.dim; a++) e2 += (p[a] / scales[a]) ** 2;
  const e = Math.max(Math.sqrt(e2), 1e-10), epsilon = .015;
  for (let a = 0; a < w.dim; a++) {
    dq[a] = flow[a] + p[a] / (scales[a] ** 2 * e);
    const plus = q.slice(), minus = q.slice(); plus[a] += epsilon; minus[a] -= epsilon;
    dp[a] = -(hamiltonian(w, plus, p, mass) - hamiltonian(w, minus, p, mass)) / (2 * epsilon);
  }
  return { dq, dp };
}
export function transferParticle(p, source, target) {
  const before = hamiltonian(source, p.q, p.p, effectiveMass(p, source.dim));
  const sourceScales = source.scales(p.q), local = p.hidden.slice();
  for (let a = 0; a < source.dim; a++) local[a] = p.p[a] / sourceScales[a];
  const q = p.q.slice(); q[0] = target.gate + (Math.sign(local[0]) || 1) * .07;
  for (let a = source.dim; a < target.dim; a++) q[a] = 0;
  const targetScales = target.scales(q);
  for (let a = 0; a < 4; a++) { p.hidden[a] = a >= target.dim ? local[a] : 0; p.p[a] = a < target.dim ? local[a] * targetScales[a] : 0; }
  p.q = q; p.world = target.id; p.cooldown = .7; p.transfers++;
  return hamiltonian(target, p.q, p.p, effectiveMass(p, target.dim)) - before;
}

export class UniverseSimulation {
  constructor(options = {}) {
    this.options = { geometryB: '4d', coupling: 1.2, biasB: .24, minimumScale: .25, compact: true, open: true, matterChannel: true, threshold: 0, holes: 'off', horizon: .9, seedRadius: 1.7, ...options };
    const low = options.lowResolution, geometry = this.options.geometryB;
    this.worlds = [new World({ id: 0, n: low ? 10 : 18 }), new World({ id: 1, dim: geometry === '4d' ? 4 : geometry === 'torus' ? 2 : 3, n: low ? (geometry === '4d' ? 6 : 12) : geometry === '4d' ? 12 : geometry === 'torus' ? 36 : 18, geometry: geometry === 'torus' ? 'torus' : 'flat', bias: this.options.biasB })];
    this.fields = new FieldSystem(...this.worlds, { coupling: this.options.coupling, open: this.options.open });
    this.particles = []; this.nextId = 1; this.random = randomGenerator(17111); this.transfers = 0; this.reflections = 0; this.absorbed = 0; this.contactWork = 0; this.integratorCost = 0; this.lastTransfer = null;
    this.setOptions(this.options);
  }
  setOptions(options) {
    Object.assign(this.options, options);
    this.fields.contact.coupling = this.options.coupling; this.fields.contact.open = this.options.open;
    this.worlds[1].bias = this.options.biasB;
    for (const w of this.worlds) {
      w.compact = this.options.compact; w.minimumScale = this.options.minimumScale;
      w.horizon = w.dim >= 3 && (this.options.holes === 'both' || this.options.holes === (w.id === 0 ? 'a' : 'b')) ? this.options.horizon : 0;
    }
  }
  seed(world = 0, location = 'contact') {
    const w = this.worlds[world], q = Array(w.dim).fill(0);
    q[0] = location === 'hole' ? w.blackHoleCenter[0] : w.gate + (world === 0 ? -.55 : .55);
    w.seed(q, this.options.seedRadius);
  }
  launch(count = 40, special = false) {
    const capacity = Math.max(0, 280 - this.particles.length); count = Math.min(count, capacity);
    for (let i = 0; i < count; i++) {
      const id = i % 2, w = this.worlds[id], ray = i % 4 < 2, q = [0, 0, 0, 0], local = [0, 0, 0, 0];
      const sign = id === 0 ? 1 : -1;
      q[0] = w.gate - sign * (special && w.horizon ? -.22 : .35 + 1.5 * this.random());
      for (let a = 1; a < w.dim; a++) q[a] = (this.random() - .5) * (a === 3 ? .24 : 2.3);
      if (special && w.horizon) for (let a = 1; a < w.dim; a++) q[a] *= .18;
      local[0] = sign * (ray ? 1.4 : .8 + this.random());
      for (let a = 1; a < w.dim; a++) local[a] = (this.random() - .5) * (a === 3 ? .65 : .45);
      const scales = w.scales(q), p = [0, 0, 0, 0];
      for (let a = 0; a < w.dim; a++) p[a] = local[a] * scales[a];
      this.particles.push({ id: this.nextId++, origin: id, world: id, mass: ray ? 0 : 1, ray, q, p, hidden: [0, 0, 0, 0], cooldown: 0, age: 0, transfers: 0, alive: true });
    }
  }
  probe() {
    if (this.particles.length >= 280) return;
    const w = this.worlds[1], q = [w.gate + .055, 0, 0, 0], scales = w.scales(q), local = [-1.4, .05, .05, 1.5], p = [0, 0, 0, 0];
    for (let a = 0; a < w.dim; a++) p[a] = local[a] * scales[a];
    this.particles.push({ id: this.nextId++, origin: 1, world: 1, mass: 1, ray: false, probe: true, q, p, hidden: [0, 0, 0, 0], cooldown: 0, age: 0, transfers: 0, alive: true });
  }
  step(dt = .02, { fields = true, particles = true } = {}) {
    if (fields) this.fields.step(dt); else this.fields.time += dt;
    if (!particles) return;
    for (const particle of this.particles) {
      if (!particle.alive) continue;
      const w = this.worlds[particle.world], oldX = particle.q[0], mass = effectiveMass(particle, w.dim);
      const q = particle.q.slice(0, w.dim), p = particle.p.slice(0, w.dim), first = derivatives(w, q, p, mass);
      const qm = q.map((x, a) => x + dt * .5 * first.dq[a]), pm = p.map((x, a) => x + dt * .5 * first.dp[a]);
      const second = derivatives(w, qm, pm, mass);
      for (let a = 0; a < w.dim; a++) { particle.q[a] += dt * second.dq[a]; particle.p[a] += dt * second.dp[a]; }
      particle.cooldown = Math.max(0, particle.cooldown - dt); particle.age += dt;
      if (w.horizon && Math.hypot(...particle.q.slice(0, w.dim).map((x, a) => x - w.blackHoleCenter[a])) < .20 * w.horizon) { particle.alive = false; this.absorbed++; continue; }
      const crosses = (oldX - w.gate) * (particle.q[0] - w.gate) < 0;
      if (crosses && particle.cooldown === 0 && this.options.open && this.options.matterChannel && this.options.coupling > 0) {
        let fits = true;
        const other = this.worlds[1 - w.id], shared = Math.min(w.dim, other.dim);
        for (let a = 1; a < w.dim; a++) if (Math.abs(particle.q[a]) > (a < shared ? 1.5 : .7)) fits = false;
        if (fits) {
          const s = w.scales(particle.q); let tangential = mass * mass;
          for (let a = 1; a < w.dim; a++) tangential += (particle.p[a] / s[a]) ** 2;
          const available = Math.sqrt(tangential + (particle.p[0] / s[0]) ** 2) - Math.sqrt(tangential);
          if (available >= this.options.threshold) {
            const beforeMass = effectiveMass(particle, w.dim);
            this.contactWork += transferParticle(particle, w, other); this.transfers++;
            this.lastTransfer = { id: particle.id, from: w.dim, to: other.dim, beforeMass, afterMass: effectiveMass(particle, other.dim), probe: Boolean(particle.probe), time: this.fields.time };
            continue;
          }
          particle.p[0] *= -1; particle.q[0] = oldX; particle.cooldown = .4; this.reflections++;
        }
      }
      for (let a = 0; a < w.dim; a++) {
        if (a === 0 && w.geometry !== 'torus') {
          if (Math.abs(particle.q[a]) > w.length / 2) { particle.q[a] = Math.sign(particle.q[a]) * (w.length / 2 - .001); particle.p[a] *= -1; }
        } else particle.q[a] = wrap(particle.q[a], w.length);
      }
      if (!particle.q.every(Number.isFinite) || !particle.p.every(Number.isFinite)) throw new Error('Non-finite particle state');
    }
  }
  snapshot() {
    const particles = this.particles.filter(p => p.alive).map(p => ({ id: p.id, world: p.world, origin: p.origin, q: p.q, mass: effectiveMass(p, this.worlds[p.world].dim), ray: p.ray, probe: Boolean(p.probe), transfers: p.transfers, energy: hamiltonian(this.worlds[p.world], p.q, p.p, effectiveMass(p, this.worlds[p.world].dim)) }));
    return { time: this.fields.time, worlds: this.worlds.map(w => ({ id: w.id, n: w.n, dim: w.dim, length: w.length, geometry: w.geometry, phi: new Float32Array(w.phi), horizon: w.horizon, gate: w.gate, holeCenter: w.blackHoleCenter, ...w.statistics() })), particles, transfers: this.transfers, absorbed: this.absorbed, reflections: this.reflections, total: this.particles.length, contactWork: this.contactWork, mediator: this.fields.contact.links.map(p => p.eta), lastTransfer: this.lastTransfer, options: this.options };
  }
}
