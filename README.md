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

`/embed` is a compact view of the same simulation with experiment selection, seeding, contact, and pause. It fits a 480×480 card and narrower frames; **Open lab** carries the selected experiment to the full interface. Rendering and worker evolution suspend when the frame leaves view, and reduced-motion preferences start it paused. The preview image is captured from the app. The root page supplies experimental X Player Card metadata; crawler acceptance and actual in-feed playback are separate checks. Nginx permits framing on `/embed` from X/Twitter and the two personal homepage origins, with relative redirects for alternate spellings.

Production runs in a static Docker container through [Deploy Manager](https://github.com/YesterdaysLemon/deploy-manager). See [deployment/README.md](deployment/README.md) for checks, release identity, and rollout behavior.
