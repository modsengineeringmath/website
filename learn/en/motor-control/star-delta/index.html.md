---
title: "Star–Delta Starter in Detail: Power Circuit, Control Circuit, 0.58 In Contactor Sizing, Overload Setting, Timer and Changeover Timing"
url: https://modsengineeringmath.com/learn/en/motor-control/star-delta/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Design and wire a star–delta (Y-Δ) starter for 400/690 V motors on a 400 V 50 Hz supply, step by step: why current and torque fall to 1/3, the KM1 KM2 KM3 power circuit, overload position and the 0.58 In setting, contactor sizing, the control circuit with interlocks, timer and dead time, the current surge at changeover, the delta-side phase sequence, six-lead cabling, closed-transition star–delta and a troubleshooting table.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/star-delta/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Star–Delta Starter in Detail: Power Circuit, Control Circuit, 0.58 In Contactor Sizing, Overload Setting, Timer and Changeover Timing

THภาษาไทยENEnglish

// Chapter 21.8 · AC Motor Control · Star–Delta Starter


Star–delta is the most popular way to reduce starting current in the region, because it uses ordinary devices and no electronics. It is also the circuit that is wired wrongly most often. This page goes through everything that has to be right: which motors can use it, where the overload goes, contactor sizes, the wiring sequence, the timer, and what really happens during the changeover.

In 30 seconds

- Only for motors with a 400/690 V Δ/Y nameplate · remove the links in the terminal box and run 6 leads

- Star stage: KM1 + KM2 · run stage: KM1 + KM3 · KM2 and KM3 must never close together

- Current and torque in star = 1/3 of a direct-on-line start

- KM1 = KM3 ≥ 0.58 In · KM2 ≥ 0.33 In · overload in the phase-current path set to 0.58 In

- Change to delta at 85–90 % speed · with a 50–100 ms dead time · calculate the timer from τm in Star–delta analysis

## Principle: start with 1/√3 of the winding voltage Basic

Take a motor that normally runs in delta on 400 V. If its windings are connected in star for starting, each winding receives only 230 V, so the line current drops to 1/3 and the torque drops to 1/3 (derived in C4). When the motor has accelerated close to full speed, it is switched to delta to get full torque.

Y1 Starting current in star

$$I_{L,Y} = \frac{I_{L,\Delta}}{3} = \frac{k_{st}\,I_n}{3}$$

Y2 Starting torque in star

$$T_Y(n) = \frac{T_\Delta(n)}{3} \qquad T_{st,Y} = \frac{T_a/T_n}{3}\,T_n \approx 0.7\text{–}0.8\,T_n$$

Figure 1 · Computed curves for the example motor: in star (solid lines) the current starts at 2.2 In and the torque at 0.72 Tn. On changing to delta at ~1330 rpm the current jumps up along the yellow line

Important limitation: the torque in star is only ~0.7 Tn, so star–delta suits loads that start light (centrifugal pumps, fans, compressors with an unloading system). If the load needs high starting torque — a fully loaded conveyor, a crusher with material left inside — the motor cannot accelerate in star and then surges almost as much as a direct-on-line start at changeover. You lose time and gain no current reduction.

## Power circuit and overload position Intermediate

Figure 2 · (The drawing uses the codes -K1 -K2 -K3, corresponding to KM1 KM2 KM3 in the text.) KM1 (main) feeds U1 V1 W1 through F2 · KM3 (delta) connects W2 U2 V2 back to L1 L2 L3 · KM2 (star) shorts W2 U2 V2 together

| Contactor | Function | Closed during | Current carried |

| KM1 main | Feeds the winding starts U1 V1 W1 | Star + run | Phase current $I_n/\sqrt3$ (when running) |

| KM2 star | Shorts the winding ends W2 U2 V2 to form the star point | Star only | $k_{st}I_n/3$ for a short time; breaks only the current after acceleration |

| KM3 delta | Connects each winding end to the next phase | Run only | Phase current $I_n/\sqrt3$ |

Y3 Main and delta contactors

$$I_e(\text{KM1}) = I_e(\text{KM3}) \ge \frac{I_n}{\sqrt3} \approx 0.58\,I_n \quad (\text{AC-3})$$

Y4 Star contactor

$$I_e(\text{KM2}) \ge \frac{I_n}{3} \approx 0.33\,I_n \quad (\text{AC-3})$$

Y5 Overload setting (in the phase-current path)

$$I_r = \frac{I_n}{\sqrt3} \approx 0.58\,I_n$$

Why F2 goes after KM1: this position carries the winding current in both the star and run stages, so the relay protects the windings most directly. If the overload is placed before the split to KM1 and KM3 (in the line-current path), it must be set to In and the relay has to be larger. Some manufacturers place F2 after KM3 instead — always check the position on the drawing before setting it. If an MPCB is used ahead of the starter (line current), set the MPCB to In and use a separate overload in the phase-current path, or let the MPCB provide all the overload protection according to the manufacturer's tables.

### Delta-side wiring sequence

The standard arrangement wires KM3 to give the same result as the links in the terminal box: L1→W2, L2→U2, L3→V2 (winding U1–U2 receives the L1–L2 voltage). The direction of rotation in Y and in Δ then matches automatically. Some manufacturers recommend the “lagging” connection L1→V2, L2→W2, L3→U2, which brings the new winding voltage closer in phase to the residual voltage in the motor and so reduces the surge at changeover. Both turn the same way and both are correct. The key point is never to swap leads at will — swapping the wrong pair short-circuits some windings or gives them the wrong voltage.

## Control circuit: sequence and interlocks Intermediate

Figure 3 · KM2 closes before KM1 (through KM2 13-14), so no power reaches the motor until the star point is made. KM1 holds itself in through 43-44 · KM2 and KM3 are interlocked with each other through 21-22, and should also have a mechanical interlock

- Press S1 → K4T starts timing, and KM2 (star) closes through K4T 15-16 (delayed NC) and KM3 21-22

- KM2 13-14 closes → KM1 closes → the motor is energised in star · KM1 13-14 holds in the START button · 43-44 holds in its own coil

- When time t has elapsed: K4T 15-16 opens → KM2 drops out → KM2 21-22 recloses

- K4T 17-18 closes (a dedicated Y-Δ timer adds a further 50–100 ms delay) → KM3 closes → delta

- Press S0 or an overload trip → everything drops out and the timer resets

Figure 4 · The dead time between KM2 opening and KM3 closing is needed so that the arc in KM2's arc chute is fully extinguished first

Y6 Changeover dead time

$$t_{dead} \approx 40\text{–}100\ \text{ms} \;>\; t_{arc,KM2} + t_{close,KM3}\ \text{margin}$$

## NEMA/JIC version: the wye–delta starter and motor leads T1–T6 Intermediate

North America calls star–delta “wye–delta” (open transition = the motor is briefly disconnected at the change-over). The same three contactors are used, but motor leads are T1–T6 and the control is a ladder.

Figure 3a · NEMA wye–delta: 1M (line) feeds T1 T2 T3 through the OL heaters · 2M (delta) connects L1→T6, L2→T4, L3→T5 · 1S (wye) shorts T4 T5 T6 · timer TR changes over

| IEC | NEMA | Role |

| -K1 | 1M | Line (main) contactor |

| -K2 | 1S | Star (wye), shorts T4 T5 T6 |

| -K3 | 2M | Delta (run) |

| -K4T | TR | Timer: contacts NCTO (15-16) and NOTC (17-18) |

| U1 V1 W1 / U2 V2 W2 | T1 T2 T3 / T4 T5 T6 | Delta: T1–T6 · T2–T4 · T3–T5 (IEC: U1–W2 · V1–U2 · W1–V2) |

The names 1M / 2M / 1S vary by manufacturer (some swap the roles of 1M and 2M) — follow the machine’s own drawing · get the delta-side phasing right: wrong T4/T5/T6 order gives a change-over surge worse than a direct start · closed-transition starters add resistors so the supply is never interrupted.

## Setting the timer and the current at changeover Advanced

The run-up time depends on the inertia and the accelerating torque (motor torque minus load torque), from Newton's second law for rotation.

Y7 Acceleration time

$$J\frac{d\omega}{dt} = T_m - T_L \;\Rightarrow\; t_{acc} \approx \frac{J\,\Delta\omega}{\overline{T_m - T_L}}$$

Y8 Condition before changing to delta

$$T_Y(n) > T_L(n)\ \ \forall\, n During the dead time the motor has no supply, but flux remains in the rotor, producing a residual voltage at the terminals whose frequency falls with the speed. When KM3 connects, if the phase of this residual voltage does not match the supply, a momentary surge is added on top of the normal current at that speed. The lower the changeover speed, the higher the normal delta current at that speed (see Figure 1).

Example Y-1

### 37 kW pump, 400 V Δ, In = 66 A, Ia/In = 7, Ta/Tn = 2.3 — design the star–delta starter

- Y1: direct-on-line $7 \times 66 = 462$ A → in star $462/3 = 154$ A

- Y3: KM1 = KM3 ≥ $0.58 \times 66 = 38.3$ A → 40 A AC-3 · Y4: KM2 ≥ $0.33 \times 66 = 21.8$ A → 25 A AC-3

- Y5: overload (after KM1) set to 38.3 A → a 30–40 A class 10 relay

- Y2: starting torque in star $2.3/3 = 0.77$ Tn > pump breakaway torque ~0.15 Tn ✓

- Six leads from the panel to the motor, each carrying the phase current of 38.3 A → size the cable for 38.3 A, not 66 A (see Y9)

Example Y-2

### Estimate the timer setting for the 37 kW pump

- $T_n = 9550(37)/1480 = 239$ N·m · motor + pump inertia $J \approx 0.3 + 0.6 = 0.9$ kg·m²

- Average torque in star ~0.8 Tn · average pump torque over 0–90 % speed ~0.35 Tn → accelerating torque ~0.45 Tn = 108 N·m

- Y7: $\Delta\omega = 0.9 \times 155 = 140$ rad/s → $t \approx 0.9(140)/108 = 1.2$ s

- Set the timer to 3 s (allowing for voltage dip and wear), then confirm with a clamp meter that the current in star has settled before the changeover

📊 In depth: the right timer can be written as $t_{set} = c\,\tau_m$ with $\tau_m = J\omega_s/T_n$ and c ≈ 2–4. Dynamic simulations show that the 1–3-cycle changeover peak of pumps and fans is close to DOL for any timer setting — see the c table, dead time, KM3 phase order and the simulation lab in Star–delta analysis: timer, currents, energy and research.

## Try it in the simulator

Try three scenarios: (1) load 0.7 Tn, timer 6 s — a smooth changeover · (2) cut the timer to 0.5 s — the current at changeover rises sharply · (3) a conveyor load of 1.0 Tn — the motor cannot accelerate in star, then surges almost as much as DOL

JavaScript is needed for the simulator

## Six leads to the motor Intermediate

Y9 Cable sizing for six leads

$$I_z \ge \frac{I_n}{\sqrt3} \ \text{per conductor} \qquad \Delta V \text{ from the phase current and the actual length}$$

- Two sets of conductors must be run (U1 V1 W1 and W2 U2 V2), which raises cable cost over long distances — one reason new installations are moving to soft starters or VFDs

- Both sets must run in the same conduit or tray to avoid induced heating in metal conduit

- Mark the cable ends to match the motor terminals at both ends — a mistake here connects the delta in the wrong pattern

## Closed-transition star–delta Advanced

The closed-transition version adds a fourth contactor and three resistors. Before KM2 opens, the fourth contactor connects the windings to the supply through the resistors, so the motor is never disconnected during the changeover and the surge is much smaller. It suits large motors and high-inertia loads, but it is more complex and more expensive. Today this kind of duty is usually handled by a soft starter instead.

## Star–delta troubleshooting table

| Symptom | Possible causes | Check / fix |

| Breaker trips the moment it changes to delta | KM2/KM3 overlap · links not removed · wrong delta wiring sequence | Check the dead time, interlocks, terminal box and the W2 U2 V2 lead numbers |

| Motor turns slowly in star and does not come up to speed | Starting load too heavy · voltage dip · a 230/400 V motor connected | Measure the current in star, check the nameplate, reduce the load at starting or change the starting method |

| Very high surge at changeover | Timer too short · dead time too long (motor slows down a lot) | Set the timer from the actual speed; use a dedicated Y-Δ timer |

| Overload trips during normal running | Set to 0.58 In but the relay is in the line-current path (or the other way round) | Check the F2 position on the drawing and set it to match |

| Motor reverses direction when it changes to delta | Phases swapped on only the winding-start set or only the winding-end set | Wire the W2 U2 V2 set as drawn; swap phases only at the supply |

| KM2 chatters or hums during starting | Coil voltage dips under the high starting current · cracked shading ring | Measure the coil voltage during starting; check the control transformer size |

## Frequently asked questions

Why are the contactors in a star–delta starter smaller than the motor rating?
Because the main contactor (KM1) and the delta contactor (KM3) each carry the winding phase current, which is In/√3 = 0.58 In. The star contactor (KM2) carries current only during starting, 1/3 of the direct-on-line starting current, and breaks a low current, so ≥ 0.33 In is enough. Example: a 66 A motor uses 40 A + 40 A + 25 A.

How many seconds should the star–delta timer be set to?
Set it to change to delta when the motor reaches about 85–90 % of speed, which you can see as the current falling and settling during the star stage. Small pumps and fans often use 3–8 s; high-inertia loads may need 10–20 s. The best method is to clamp a meter on the line and watch the current in star, then set the timer slightly longer than the point where the current settles. Too short and the surge is almost as large as a direct-on-line start; too long and the motor runs in star for no reason.

The motor runs in star, then the breaker trips when it changes to delta. Why?
Common causes: no dead time or too short a dead time, so KM2 and KM3 overlap through the arc; a wrong delta-side wiring sequence that connects the windings in the wrong pattern; a timer so short that the motor has not accelerated; or the copper links in the terminal box were not removed.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why are the contactors in a star–delta starter smaller than the motor rating?**
Because the main contactor (KM1) and the delta contactor (KM3) each carry the winding phase current, which is In/√3 = 0.58 In. The star contactor (KM2) carries current only during starting, 1/3 of the direct-on-line starting current, and breaks a low current, so ≥ 0.33 In is enough. Example: a 66 A motor uses 40 A + 40 A + 25 A.

**How many seconds should the star–delta timer be set to?**
Set it to change to delta when the motor reaches about 85–90 % of speed, which you can see as the current falling and settling during the star stage. Small pumps and fans often use 3–8 s; high-inertia loads may need 10–20 s. The best method is to clamp a meter on the line and watch the current in star, then set the timer slightly longer than the point where the current settles. Too short and the surge is almost as large as a direct-on-line start; too long and the motor runs in star for no reason.

**The motor runs in star, then the breaker trips when it changes to delta. Why?**
Common causes: no dead time or too short a dead time, so KM2 and KM3 overlap through the arc; a wrong delta-side wiring sequence that connects the windings in the wrong pattern; a timer so short that the motor has not accelerated; or the copper links in the terminal box were not removed.
