# Between worlds: mathematical contract

Version 0.1. All quantities use chosen dimensionless units with the local limiting speed of the matter metric set to 1. This is a classical, deterministic, finite-grid model. It is not a proposed physical theory of our universe.

## The choice of ontology

We choose **separate spaces with explicit contacts**, rather than asserting that every universe floats inside our own space. World A has three spatial coordinates. World B has either four spatial coordinates, three spatial coordinates, or the two intrinsic coordinates of a curved torus. Each world also has time. A common external clock, tau, parametrizes every update. The pictures are coordinate views, not a metric embedding of an external bulk.

A finite family of real oscillator variables eta represents an extra-universal mediating field at the contact. This is a finite-dimensional mediator, not a solved five-dimensional bulk field. Its state has its own inertia and restoring force. It receives disturbances from both sides and acts back on both sides. It is not an animation of a prescribed collapse front.

The starting literature includes coupled bulk/brane fields, dimensional reduction, classical phase-field dynamics, and fixed black-hole metrics. Our particular potential, interface matching, geometry response and clock agreement are modelling assumptions.

## 1. Intrinsic spaces and numerical boundaries

Flat worlds use cell-centred Cartesian grids on a coordinate patch of side length L = 8. World A has 18^3 cells; a four-dimensional B has 12^4 cells; a three-dimensional B has 18^3 cells. The fourth coordinate is simulated, including both neighbours in that direction. The renderer projects it into three dimensions.

The flat patches have reflecting/zero-flux boundaries in x and periodic boundaries in their other coordinates. They are finite laboratory patches, not complete asymptotically flat universes. Matter reflects at the x walls and wraps in the other coordinates. A trail is broken at a wrap or contact to avoid displaying a spurious path across the diagram.

The curved neighbour is a 36 by 36 intrinsic torus grid, periodic in both coordinates. Let theta = 2 pi q0 / L and psi = 2 pi q1 / L. Its base metric is

    dl0^2 = r^2 dtheta^2 + (R + r cos(theta))^2 dpsi^2
    r = 0.85, R = 1.9.

Both the scalar grid weights and test-particle Hamiltonian use these intrinsic scale factors. A flat grid drawn as a torus would not reproduce this operator. The torus is held fixed in this version; its converted field does not make it one-dimensional.

## 2. Scalar field and a reciprocal contact

On each world's fixed substrate geometry g0, phi is a classical scalar with potential

    V(phi; delta) = phi^2 (1 - phi)^2 - delta phi^2 (3 - 2 phi).

For 0 <= delta < 1/3, phi = 0 and phi = 1 are local minima. Their potential difference is V(1) - V(0) = -delta. At delta = 0 the two minima have equal energy. Phi is a real field, not a probability, and can overshoot either minimum. Its numerical evolution is not clamped. The rendered phase fraction is the base-volume fraction of cells satisfying phi > 0.5; it is not a continuously varying topological dimension.

The intended continuum field equation away from contacts is

    phi_tt + gamma phi_t = c_phi^2 Delta_g0 phi - dV/dphi,
    c_phi = 0.85, gamma = 0.055.

The substrate field is separate from the geometry seen by matter: the scalar operator is based on fixed g0, including when phi drives a contraction. Black-hole flow does not advect this external field. This deliberate separation is part of the extra-universal-field hypothesis.

The discrete field system is specified by its energy. Vertex i has proper base-cell volume v_i. Each undirected grid edge has positive symmetric conductance K_ij:

    E_world = sum_i v_i [velocity_i^2 / 2 + V(phi_i)]
              + c_phi^2 / 2 sum_{undirected edges ij} K_ij (phi_i - phi_j)^2.

For flat space v_i = h^d and K_ij = h^(d-2). For the torus we average cell volumes and coordinate scale factors at faces. The resulting graph Laplacian is self-adjoint with respect to the volume-weighted inner product, and the weighted sum of internal fluxes is zero. It is a finite-volume approximation, not an exact continuum solution.

Contact samples are located near x_A = 2 and x_B = -2. The common coordinates span an aperture of half-width 1.5. A 3D/4D contact has two tangential coordinates with w_B = 0. A 3D/2D contact has one tangential coordinate with z_A = 0. These are explicitly selected interfaces, not a general collision finder for embedded manifolds. Grid samples can share a cell; their contributions add.

For each contact sample l, with interface quadrature weight A_l, the mediator energy is

    E_l = A_l [eta_dot^2 / 2 + omega^2 eta^2 / 2
          + kappa/2 (phi_A - eta)^2 + kappa/2 (phi_B - eta)^2],
    omega = 0.3.

Forces are derivatives of this same energy, including the receiving vertex-volume factors. There is no one-sided copying of the source phase. The mediator evolves as

    eta_tt + gamma eta_t = kappa(phi_A + phi_B - 2 eta) - omega^2 eta.

Closing the contact sets kappa to zero. The scalar energy is conserved up to integration error when damping is zero and parameters are fixed. With damping, energy lost to the implicit bath is recorded. Opening a contact, changing parameters or injecting a seed performs external work; there is no conservation claim across those interventions.

The integrator uses Strang-split exponential damping and velocity Verlet with fixed dt = 0.02. The worker performs two steps per 40 ms at 1x; faster settings perform more fixed steps. The UI does not silently enlarge dt to catch up. The field grid is relatively coarse, particularly in 4D. Tests establish selected discrete invariants and timestep convergence, not general spatial convergence or a certified continuum phase boundary.

### Nucleation versus a classical seed

The seed button inserts a smooth, approximately spherical bubble using a tanh profile. Its radius is measured in substrate coordinates; on the torus this is a coordinate-space seed, not an exact geodesic ball. The equations decide its subsequent evolution. No quantum tunnelling or thermal nucleation rate is computed. A bias makes conversion energetically advantageous, but wall/gradient energy and contact drainage can still defeat a seed.

## 3. Geometry response: a strictly positive small direction

Matter sees a separate prescribed metric. Define

    s = clamp(phi, 0, 1), f(s) = s^2 (3 - 2s),
    a(phi) = 1 - (1 - epsilon) f(s), epsilon > 0.

When geometry response is enabled in a flat d >= 3 world, its last spatial scale is multiplied by a. The other spatial scales stay at 1. Thus A contracts z and a 4D B contracts w. Epsilon ranges from 0.12 to 1. The intrinsic dimension never actually drops: this is a small periodic direction, not an implemented singular quotient. Epsilon is a geometric floor, not a derived Planck scale.

For a nonuniform a, the rendering q_last -> a(q) q_last is a coordinate illustration. It is not an isometric embedding of the diagonal prescribed metric: a spatially varying drawing map would introduce cross terms in its induced metric. Particle trajectories use the stated diagonal metric, not distances inferred from the picture. Turning through w changes only the projection camera and has no physical effect.

## 4. Matter and light

Packets are noninteracting test particles, with rest parameter m0 = 1 for matter or m0 = 0 for initially massless excitations. They do not form atoms, collide with each other, gravitate, or backreact on the scalar. With hidden momentum components k, the effective rest mass is

    m_eff^2 = m0^2 + sum k^2.

The prescribed spacetime metric and Hamiltonian are

    ds^2 = -dtau^2 + sum_i s_i(q,tau)^2 (dq_i - u_i dtau)^2,
    H = u dot p + sqrt(m_eff^2 + sum_i p_i^2 / s_i^2).

Hamilton's equations are q_dot = dH/dp and p_dot = -dH/dq. The first is evaluated analytically. The second uses symmetric spatial differences with coordinate step 0.015. Particle stepping uses explicit midpoint/RK2. The scalar is stepped first and its snapshot is held during the particle substep; no claim of second-order accuracy for the full time-dependent coupled evolution is made.

In a static background H is the candidate conserved Killing energy; integration error remains. With a changing metric, particles can gain or lose energy through work by the prescribed geometry. Their energy is not subtracted from the scalar because this is a one-way test-particle approximation. Matter, scalar and metric are therefore not a self-consistent closed gravity theory.

### Contact matching

Particles are eligible when crossing the selected contact plane, within its common-coordinate aperture, and within 0.7 coordinate units of the selected zero value in source-only coordinates. The finite width is a toy regularization. Closing the matter channel leaves the scalar contact available.

At a successful transfer:

1. Convert covariant momenta to the local orthonormal frame, p_hat_i = p_i / s_i.
2. Match shared components between worlds.
3. Store source-only momentum as internal k in the receiving world.
4. Restore stored momentum when an active dimension becomes available again; a newly available coordinate starts at zero.
5. Convert active orthonormal components to the receiving covariant momenta.

This preserves local particle energy sqrt(m0^2 + active p_hat^2 + hidden k^2). For example, a massive particle with p_w = 1.5 has m_eff = sqrt(1 + 1.5^2) = 1.8027756 after 4D -> 3D transfer. A massless higher-dimensional excitation with p_w != 0 becomes effectively massive in 3D and travels below the local 3D light speed.

Positions in removed coordinates are not fully retained in this junction model. This is not a reversible symplectic map between different-dimensional full phase spaces, a quantum-unitary interface, or a derivation of matter conversion from an underlying action. The extra internal momentum is one explicit information-preserving choice for momentum, not a complete solution of dimensional reduction.

If the optional threshold exceeds the particle's available local normal kinetic energy, the normal covariant momentum is reflected. Accepted transfers preserve local energy rather than subtracting the threshold. It is a transmission condition, not a dissipative toll. Opening a channel at different background flows may change H; that change is recorded as contact work supplied or absorbed by an external reservoir, not fed into eta.

Contacts identify events at the same external tau. We impose no time-shifted portals, so there is no mechanism for a trajectory to run backward in that chosen clock. This does not establish relativistic covariance of the junction or solve the full causal structure.

## 5. Black holes and their precise scope

Only flat worlds with d >= 3 have the black-hole option. Define distance r from a chosen center and inward flow

    u = -(r_h/r)^((d-2)/2) r_hat.

For s_i = 1 this is the Painleve-Gullstrand form of the Schwarzschild metric for d = 3 or Schwarzschild-Tangherlini for d = 4, on the simulated patch. Outgoing radial null rays obey

    dr/dtau = 1 - (r_h/r)^((d-2)/2).

They have zero outgoing coordinate speed at r_h and negative outgoing radial speed below it. The 4D-spatial case has a steeper radial flow law. This is an analytic fixed background, not numerical evolution of Einstein's equations.

The plotted thin sphere marks the **undeformed reference radius**. In the 4D projection it is a schematic marker, not a rendered exact S^3 horizon. The dark core absorbs particles at r < 0.2 r_h. It is numerical excision, not the event horizon. The flow is regularized below 0.12 r_h. Captured packets remain in the accounting total.

With phi-driven anisotropy, the metric is a prescribed deformation of that background and generally is not an Einstein solution. Neither the plotted sphere nor the change in a is proof of a global event horizon. Reflecting patch boundaries and contact exits also change the global causal problem.

The horizon experiment places the contact inside the reference radius. Once open, a packet able to reach the contact can enter the neighbouring world. This does not make a counterexample to black-hole causality: an event horizon is defined using all allowed future paths. If the extra route permits escape, the source reference surface was not a horizon of the entire coupled model. The model does not compute that global boundary.

The torus has no Schwarzschild/Tangherlini background in this lab. Black holes in 2+1 spacetime require different setups; BTZ black holes, for example, use a negative cosmological constant and different global geometry. A 2D surface in our diagram is not automatically a black-hole horizon or a holographic encoding of the volume.

### Vacuum decay near a black hole

Specific semiclassical theories allow a black hole to enhance bubble nucleation. That conclusion depends on the potential, gravitational solution, instanton action and parameter regime. This lab does not calculate any such rate and does not automatically seed a bubble when a hole is enabled. "Seed beside A's horizon" is a manual classical intervention. Hawking radiation, black-hole recoil off a brane, bubble-induced gravitational collapse and baby-universe formation are not simulated.

## 6. What can actually be investigated here?

- Whether a chosen classical seed dies, oscillates or grows on a finite intrinsic grid.
- Whether reciprocal contact transmits a small field disturbance or helps the neighbouring field leave its metastable basin.
- How the fourth coordinate changes propagation and how curvature changes torus fluxes.
- How geometry response changes prescribed-metric test-particle paths.
- Whether an interface reflects particles or maps extra spatial momentum to effective rest mass.
- How intrinsic null trapping differs from access to an additional contact route.

The scientifically stronger next version would include spatial-resolution studies of selected outcomes, a variational dynamical compactification modulus, backreaction of matter and field, consistent junction stress-energy, and a global causal analysis. A literal a = 0 transition would additionally need a theory of metric degeneracy/topology change, not a slider extended to zero.

## 7. Other mathematical directions

An alternative ontology puts selected worlds into an explicit higher-dimensional bulk with embedding maps X_i. Generic transverse intersections of spatial manifolds have expected dimension d_i + d_j - D in a D-dimensional ambient space, when they intersect. A 3D and a 4D world in a 5D bulk can meet along a 2D set. Special alignment, tangency or finite thickness changes the contact problem. Our current interfaces are declared directly; their drawing is not a solution for such embeddings.

This suggests a later embedding/impact simulation, or a graph of worlds whose contacts open and close as embeddings move. Arbitrary geometries need not admit the particular low-dimensional embedding one draws. A disjoint union plus explicit contact operators, as used here, avoids assuming a universal ambient geometry before one has chosen it.

## Sources and relationship to this model

- S. Coleman, *Fate of the false vacuum: Semiclassical theory* (1977). https://journals.aps.org/prd/abstract/10.1103/PhysRevD.15.2929 — theoretical nucleation machinery; our inserted classical seed is not a tunnelling computation.
- A. Cardoso et al., *Coupled bulk and brane fields about a de Sitter brane* (2006). https://arxiv.org/abs/hep-th/0612202 — examples of fields with reciprocal coupling across different dimensions; our oscillator interface is separately defined.
- R. Gregory, I. G. Moss, B. Withers, *Black holes as bubble nucleation sites* (2014). https://arxiv.org/abs/1401.0017 — conditional semiclassical black-hole catalysis, not a universal trigger rule.
- R. Emparan, H. S. Reall, *Black Holes in Higher Dimensions* (2008). https://link.springer.com/article/10.12942/lrr-2008-6 — Schwarzschild-Tangherlini metrics and richer higher-dimensional horizon geometries.
- W. Israel, *Singular hypersurfaces and thin shells in general relativity* (1966). https://link.springer.com/article/10.1007/BF02710419 — why a thin interface needs stress-energy and junction conditions; these are not solved by our declared transfer rule.
- Einstein Online, *Extra dimensions — and how to hide them*. https://www.einstein-online.info/en/spotlight/hiding_extra_dimensions/ — the difference between a small compact dimension and deleting a coordinate.
- D. Tong, *General Relativity: Introducing Riemannian Geometry*. https://davidtong.org/teaching/general-relativity/grhtml/S3 — nondegenerate metrics; the positive floor avoids a singular endpoint.
- M. Banados, C. Teitelboim, J. Zanelli, *The Black Hole in Three Dimensional Space Time* (1992). https://arxiv.org/abs/hep-th/9204099 — a distinct 2+1-dimensional black-hole setup, not simulated in the torus preset.
- B. Conrad, *Submersions and transverse intersections*. https://math.stanford.edu/~conrad/diffgeomPage/handouts/subtransverse.pdf — the dimension count for transverse contacts of embedded manifolds.

## Validation and reproduction

`npm test` checks weighted flux, waves varying only in w, scalar-plus-mediator energy convergence under timestep halving, damping accounting, open versus closed field contact, contact effective mass/local energy, exact radial null speed formulas, positive metric scales, particle counting, and threshold reflection.

`npm run experiments` writes `output/experiments.json`, including finite-grid seed growth/retraction and two contact runs. Its outcomes are discrete experimental results, not continuum certificates. The simulation random seed for initial packets is fixed. Save state exports parameters, scalar snapshots, recent intervention history and visible particle diagnostics. This export is an inspection snapshot, not a checkpoint importer or complete replay format: particle covariant momenta and mediator velocities are not exported there.
