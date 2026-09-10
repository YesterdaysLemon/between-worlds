<!-- al-stack:project:start -->
## Al-stack project

Project: Between worlds. Profile: research. Status: experimental.

Explore mixed-dimensional spaces, reciprocal fields, prescribed geometry and matter/light at contacts.

`al-stack.toml` records this project's setup and dependencies. Work from the checkout selected for the task; other branches/worktrees are optional history. Use `al-stack register .` once when starting work here. Local registration does not change the project's lifecycle.

Project commands:
- dev: `npm run dev`
- build: `npm run build`
- test: `npm test`
- experiments: `npm run experiments`
- check: `npm run check`
- smoke: `npm run smoke -- <base-url> <expected-sha>`

Declared tools (verify availability in the intended agent):
- node (cli): `node`.

Edit project guidance outside this managed section. Use `al-stack configure` for its fields and `al-stack check .` for setup checks. Run the actual project checks for behavioral validation.
<!-- al-stack:project:end -->

## Between worlds

This is an experimental local mathematical simulator, not a physical theory. Read `docs/MODEL.md` before modifying the equations or making scientific claims. It records the action for the discrete scalar/mediator system, the prescribed matter metric and the contact assumptions.

- `src/core.mjs` is deterministic and independent of browser APIs. Preserve reciprocal field forces, volume weights, positive metric scales, and particle accounting.
- `src/worker.js` performs fixed-step evolution. `src/view.js` uses Three.js only for coordinate illustrations; a 4D world has a full 4D intrinsic field grid.
- Matter and light are noninteracting Hamiltonian test particles. Local contact energy is preserved by storing missing momentum as internal energy. This does not establish a quantum-unitary or fully reversible junction.
- Black holes are fixed Schwarzschild/Tangherlini backgrounds only when the matter spatial metric is undeformed. Plotted radii are reference markers. Do not call them global horizons of the coupled system.
- Run `npm test` and `npm run build` for equation or implementation changes. `npm run experiments` records bounded finite-grid outcomes. Add spatial or timestep checks when a new scientific claim needs them.
- Use the user-level `frontend-quality` skill for UI changes and `playwright` for browser checks. Keep the canvas central and detailed model notes available without filling the controls with implementation prose.
- Releases use the public `YesterdaysLemon/between-worlds` repository on `main` and the existing Deploy Manager at `between-worlds.alirezaafshan.com`. See `deployment/README.md`. Keep local checks, signed receipt completion, and live evidence distinct; publishing authority still comes from the current request.
