# Between worlds

An interactive mathematical laboratory for separate 3D/4D spaces and a curved 2D neighbour: nonlinear fields, reciprocal contact, a prescribed contracting metric, matter/light trajectories, and fixed black-hole backgrounds.

[Open the laboratory](https://between-worlds.alirezaafshan.com/?experiment=cascade)

Requires Node.js 22.12 or newer.

```powershell
npm ci
npm run dev
```

Open the address Vite prints. The four presets explore first contact, a favoured converted phase, a reference horizon with an additional contact route, and a curved neighbour. Pause, seed either world, close/open contact, send a 4D probe, and rotate the fourth coordinate's projection.

```powershell
npm test
npm run experiments
npm run build
```

The full equations, boundary conditions, discrete energy and limitations are in [docs/MODEL.md](docs/MODEL.md), also available through **Model & sources** in the app. This is a classical finite-grid toy with one-way field-to-metric response and test particles. It does not solve Einstein backreaction, quantum tunnelling, a global event horizon, literal dimension deletion, or realistic matter conversion.

Three.js renders coordinate illustrations. A worker solves the intrinsic fields and traces the test particles. Rendering does not determine the underlying dimension. All runtime dependencies are local after installation; the optional display fonts fall back to system fonts.

Production runs in a static Docker container through [Deploy Manager](https://github.com/YesterdaysLemon/deploy-manager). See [deployment/README.md](deployment/README.md) for checks, release identity, and rollout behavior.
