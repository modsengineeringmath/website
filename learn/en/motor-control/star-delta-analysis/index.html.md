---
title: "Star–Delta Analysis: How Many Seconds to Set the Timer, Star or Delta Operation, Currents, Energy and Numerical Research on Squirrel-Cage Motors"
url: https://modsengineeringmath.com/learn/en/motor-control/star-delta-analysis/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-19
---

> How many seconds to set a star–delta timer, from τm = J·ωs/Tn, with dynamic simulations of a squirrel-cage induction motor: dead time, residual voltage, KM3 phase order, closed transition, I²t, rotor heat, voltage dip, running in star at light load, case studies, past, present and future, and a lab.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/star-delta-analysis/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Star–Delta Analysis: How Many Seconds to Set the Timer, Star or Delta Operation, Currents, Energy and Numerical Research on Squirrel-Cage Motors

THภาษาไทยENEnglish

// Chapter 21.9 · AC Motor Control · Star–Delta Analysis & Research


The page Star–delta starter in detail teaches how to wire the circuit correctly. This page answers the questions electricians and engineers ask most but rarely find numbers for: how many seconds to set the timer, what the dead time should be, why the breaker trips at the change to delta, which KM3 phase order to use, and whether to run a motor in star (wye) or in delta. Every answer comes from mathematical experiments on a verified dynamic model of a squirrel-cage induction motor, and you can repeat them in the lab at the end of the page.

In 30 seconds

- Timer = the time the motor needs to reach ~98 % of its “star equilibrium speed” × 1.2, and not shorter than the time to 95 % at 90 % voltage → $t_{set} = c\,\tau_m$, $\tau_m = J\omega_s/T_n$, $c \approx 2\text{–}4$

- Pumps and fans: the 1–3-cycle open-transition peak is ≈ 0.85–1.2 × the DOL peak for any timer setting — the timer only controls how long the high current lasts (fan: 0.96 s at 8 s versus 0.05 s at 20 s)

- Wire KM3 in the lagging order (L1→V2 L2→W2 L3→U2) and use the shortest safe dead time · closed transition with Rt ≈ 0.1–0.3·Zb cuts the peak to 2.9–6.7·In

- Star–delta cuts the supply I²t by 25–50 % but heats the rotor 30–55 % more · on a generator set the changeover peak can dip the voltage by 41 %

- Running permanently in star saves energy only below 35–40 % load (7.5 kW at 25 %: 188 W saved, cos φ 0.46 → 0.79)

## How to read this page: research questions, model and main results Basic

Star, wye (Y) and delta (Δ) are the ways of connecting the three windings of a three-phase induction motor. Star and wye are the same connection (Europe and Asia say star, North America says wye), so the starter is called either a star–delta starter or a wye–delta starter. This page asks six research questions and answers them with 14 sets of numerical experiments (E1–E14).

- How many seconds should the star timer be set to, and how can it be found from catalogue data?

- What sets the current and torque surge at the change from star to delta, and how much do the dead time and the phase order matter?

- What does star–delta really reduce: current, energy, heating or voltage dip?

- Which loads can be started in star–delta, and what does a low supply voltage do?

- Does running a motor permanently in star at light load really save energy, and below which load?

- How were past problems solved, and what is the future of motor starting?

Model: a 7.5 kW 4-pole 400 V Δ 50 Hz motor with a double-cage rotor, the same motor used throughout the series and in the AC induction motor guide (in Thai) at /learn/ac-induction-motor/ (In 14.0 A, Tn 49.3 N·m, 1471 rpm, Is/In 6.53, Ts/Tn 2.15, Tk/Tn 3.0). It is simulated with a space-vector (αβ) dynamic model with five electrical states plus speed, solved with fourth-order Runge–Kutta every 0.1 ms. During the dead time the stator current is zero and only the fluxes of the two rotor cages are integrated. The steady state agrees with the equivalent circuit to 10⁻¹⁶ and the changeover transient agrees with scipy's LSODA solver within 0.3 %. Three example loads: a centrifugal pump at 80 % (total J 0.105 kg·m²), a large fan (total J 2.245 kg·m²) and a constant-torque conveyor at 50 % (total J 0.395 kg·m²).

Timerc·τmc ≈ 2.1–3.4 for pumps/fans · 3.7 for a conveyor at 50 % (table E13)

Changeover peak (open)5.6–10.5·InDOL 8.9·In · 1–3 cycles · depends on the residual-voltage angle (pumps/fans 7.6–10.5)

Closed transition2.9–6.7·InRt = 0.1–0.3·Zb · < 1 kJ in the resistors

Supply I²t (fan)51 %of DOL · but rotor heat 130 %

Voltage dip on a 100 kVA genset41 %changeover peak of a 37 kW pump (DOL 32 %, star stage 13.5 %)

Running in star at 25 %−188 Wper 7.5 kW · cos φ 0.46 → 0.79 · break-even ≈ 53 %

Every number on this page was computed with the same code as the lab on the page. Reproduce them with node scripts/yd_research.mjs and check the model with python3 scripts/yd_check.py (see research summary). For a continuous write-up in research-article form, read the article How many seconds to set a star–delta timer — results of numerical experiments.

## Choosing star, delta or star–delta from the nameplate and the supply Basic

Before thinking about the timer, make sure the motor runs in delta at the supply voltage, because star–delta means “start in star, run in delta”. If delta is not the normal running connection, the method cannot be used (terminal-box details in Star and delta connections).

E1 Winding voltage in Y and Δ

$$V_{w,Y} = \frac{V_L}{\sqrt3} \qquad V_{w,\Delta} = V_L \qquad I_{L,\Delta} = \sqrt3\,I_{w,\Delta}$$

E2 Line-current ratio at the same speed

$$\frac{I_{L,Y}}{I_{L,\Delta}} = \frac{V_L/(\sqrt3\,Z_w)}{\sqrt3\,V_L/Z_w} = \frac13 \qquad Z_w = \text{winding impedance at that slip}$$

E3 Torque ratio (torque ∝ V²)

$$\frac{T_Y(s)}{T_\Delta(s)} = \left(\frac{V_{w,Y}}{V_{w,\Delta}}\right)^{2} = \frac13 \qquad \frac{T_{k,Y}}{T_k} = \frac13,\ \ s_k \text{ unchanged}$$

E4 Input power and starting kVA

$$P_{in} = \sqrt3\,V_L I_L\cos\varphi \qquad S_{st} = \sqrt3\,V_L\,I_{st} \qquad S_{st,Y} = \tfrac13\,S_{st,\Delta}$$

| Nameplate (Δ/Y) | Supply | Running connection | Star–delta? | Notes |

| 230/400 V | 400 V | Star (Y) | No | In delta at 400 V the winding gets 173 % of its rating, saturates and burns · use DOL, a soft starter or a VFD |

| 400/690 V | 400 V | Delta (Δ) | Yes | The type used for star–delta in the region · six leads |

| 380/660 V | 400 V | Delta | Yes | 5.3 % above the nameplate, inside zone B of IEC 60034-1 (±10 %) · usable, slightly warmer |

| 400/690 V | 690 V (mining, heavy industry) | Star | No | At 690 V the motor already runs in star |

| 400 V Δ only (6 terminals) | 400 V | Delta | Yes | Some larger motors are built for Y-Δ (IEC 60034-12 designs NY/HY) |

| 230/460 V 9-lead wye (NEMA, 60 Hz) | 460 V | Series wye (high wye) | No (needs 12 leads) | Low voltage = parallel wye (low wye) · wye–delta needs a 12-lead motor |

Figure 1 · Choosing the connection from the nameplate and the supply: the Δ figure must equal the supply line voltage for star–delta to be possible

Example E-1

### Three motors in a 400 V plant: which can use star–delta, and what device sizes?

- 3 kW, nameplate 230/400 V Δ/Y: E1 at 400 V needs Y so the winding gets 231 V · Δ would give the winding 400 V = $\sqrt3$ times → no star–delta, use DOL

- 37 kW, nameplate 400/690 V Δ/Y, In ≈ 66 A: delta at 400 V → usable · KM1 = KM3 ≥ $66/\sqrt3 = 38.1$ A → 40 A AC-3 · KM2 ≥ 66/3 = 22 A → 25 A · overload set to 38.1 A in the winding-current path

- E2: DOL starting current $6.5 \times 66 = 429$ A → star stage $429/3 = 143$ A · E4: $S_{st,Y} = \sqrt3(400)(143) = 99$ kVA instead of 297 kVA

- 22 kW, nameplate 380/660 V: delta at 400 V is 5.3 % above the nameplate, still in zone B of IEC 60034-1 → usable, but check the temperature and current after installation

## The mathematics of the star stage: torque, slip and equilibrium speed Intermediate

When the winding voltage falls to $1/\sqrt3$, every point of the torque–speed curve falls to 1/3 (E3), including the breakdown torque $T_k$, but the speed at which the breakdown torque occurs does not change. For the example motor $T_{k,Y} = 3.0/3 = 1.0\,T_n$, which means that in star the motor cannot carry full rated load, and the speed at which it carries a load is lower than in delta.

E5 Kloss approximation

$$\frac{T}{T_k} = \frac{2}{s/s_k + s_k/s} \qquad T_{k,Y} = \frac{T_k}{3}$$

E6 Slip in star near rated speed

$$T \approx \frac{3V_w^2}{\omega_s R_2'}\,s \;\Rightarrow\; s_Y \approx 3\,s_\Delta \ \text{(same load torque)}$$

E7 Star equilibrium and feasibility

$$T_Y(n_Y) = T_L(n_Y),\ \ \frac{d(T_Y - T_L)}{dn}\Big|_{n_Y} T_L(0),\ \ n_Y \ge 0.9\,n_N$$

The star equilibrium speed $n_Y$ is where the star torque curve crosses the load curve. The motor accelerates to this point and then “hangs” there until it is switched to delta. Results of experiment E1 for the three loads:

| Load | nY (% nN) | Slip Y · Δ | Y line current at nY | Δ current at nY (jump) | t98 in Y | DOL t98 |

| Pump 80 % | 96.5 % | 5.41 % · 1.54 % | 0.76·In | 2.27·In | 0.63 s | 0.15 s |

| Fan J 2.245 | 94.2 % | 7.61 % · 1.94 % | 0.97·In | 2.90·In | 15.0 s | 3.27 s |

| Conveyor 50 % | 98.8 % | 3.09 % · 0.93 % | 0.48·In | 1.45·In | 3.89 s | 0.63 s |

Look at the current column: at the equilibrium speed the fan draws a line current of 0.97·In in star, which is also the winding current, but the rated winding current is $I_n/\sqrt3 = 0.58\,I_n$. The winding therefore carries 1.68 times its rated current for as long as the motor stays in star — this is why a timer that is too long is also bad.

Figure 2 · The star-stage run-up with time measured in units of τm: the pump and the fan almost coincide (98 % of nY at ≈ 2 τm), the constant-torque conveyor is slower (≈ 3 τm)

### Which loads star–delta can start (experiment E7)

| Load type | Max k for nY ≥ 85 % | ≥ 90 % | ≥ 95 % | Limited by |

| Pumps, fans (T ∝ n²) | 1.31·Tn | 1.19·Tn | 0.93·Tn | torque at high speed |

| Mixers, viscous (T ∝ n) | 1.15·Tn | 1.10·Tn | 0.90·Tn | torque at high speed |

| Constant torque (conveyors, hoists, loaded piston compressors) | 0.60·Tn for every target | breakaway 1.2·k·Tn must be below TY(0) = 0.72·Tn |

k is the load torque at rated speed relative to Tn. Correctly sized pumps and fans (k ≈ 0.7–1.0) suit star–delta very well, whereas conveyors or compressors that start loaded above ~60 % should not use it, and with a 10 % voltage dip the limit falls to $0.6 \times 0.81 \approx 0.48$ Tn (torque ∝ V²).

## How many seconds: equations, table and on-site measurement Intermediate

The run-up time in star follows from Newton's second law for rotation. Measured in units of the mechanical time constant τm (the time rated torque would need to accelerate the rotating mass from rest to synchronous speed), the result hardly depends on the motor size, so a general table can be made.

E8 Run-up time in star

$$J\frac{d\omega}{dt} = T_Y(\omega) - T_L(\omega) \;\Rightarrow\; t(\omega_1) = J\int_0^{\omega_1}\frac{d\omega}{T_Y(\omega) - T_L(\omega)}$$

E9 Mechanical time constant

$$\tau_m = \frac{J\,\omega_s}{T_n} \qquad \omega_s = \frac{2\pi n_s}{60} \qquad T_n = \frac{9550\,P_n}{n_N}$$

E10 Timer setting rule

$$t_{set} = \max\!\big(1.2\,t_{98}(V_n),\ t_{95}(0.9V_n)\big) = c\,\tau_m$$

E11 Average-torque estimate

$$t \approx \frac{J\,\Delta\omega}{\overline{T_Y - T_L}}$$

E12 No-load run-up with Kloss (closed form)

$$t = \frac{J\omega_s}{T_k}\left[\frac{1-s_e^2}{4s_k} + \frac{s_k}{2}\ln\frac1{s_e}\right] \qquad t_Y = 3\,t_\Delta$$

Formula E12 is elegant but overestimates the time of double-cage and deep-bar motors by about 74 % (experiment E8: for J = 1 kg·m² it gives 6.74 s against 3.88 s from the integral), because Kloss gives a starting torque of only 0.79·Tn while the real motor has 2.15·Tn. The average-torque method E11 is within 2 %, so use E11 or E8 with the manufacturer's torque curve.

### Timer coefficient c (experiment E13)

| Load · k | nY/nN | DOL t98/τm | Y t95/τm | Y t98/τm | Y t95/τm at 90 % V | c = tset/τm |

| Pump/fan T ∝ n² · 0.6 | 98.2 % | 0.44 | 1.53 | 1.63 | 2.08 | 2.1 |

| Pump T ∝ n² · 0.8 | 96.5 % | 0.45 | 1.76 | 1.89 | 2.56 | 2.6 |

| Pump T ∝ n² · 1.0 | 94.1 % | 0.47 | 2.10 | 2.31 | 3.44 | 3.4 |

| Fan (5 % base) · 1.0 | 94.2 % | 0.46 | 1.91 | 2.10 | 2.94 | 2.9 |

| T ∝ n · 0.6 | 98.1 % | 0.45 | 1.76 | 1.86 | 2.54 | 2.5 |

| T ∝ n · 0.8 | 96.2 % | 0.47 | 2.23 | 2.37 | 3.96 | 4.0 |

| Constant torque · 0.3 | 100 % | 0.46 | 1.81 | 1.88 | 2.59 | 2.6 |

| Constant torque · 0.5 | 98.8 % | 0.50 | 3.01 | 3.10 | no breakaway | 3.7 (not if the voltage can dip) |

Generality check: with J four times larger, t98/τm is the same in every row to the third decimal place, so the table applies to other motor sizes as long as the torque curve has a similar shape (Ts/Tn ≈ 2–2.5, Tk/Tn ≈ 2.7–3.2).

Example E-2

### 7.5 kW exhaust fan, total J 2.245 kg·m² — what timer, and what happens with 8 s “like the pumps”?

- E9: $\tau_m = 2.245 \times 157.08 / 49.35 = 7.15$ s

- Table E13, fan row: $t_{98} = 2.10\tau_m = 15.0$ s · at 90 % voltage: $t_{95} = 2.94\tau_m = 21.0$ s

- E10: $t_{set} = \max(1.2 \times 15.0,\ 21.0) = 21$ s

- Simulated at 8 s: changeover at 971 rpm (66 %), peak 7.6·In, but the current stays above 3·In for 0.96 s (almost a third of DOL's 3.1 s) · at 20 s: changeover at 1385 rpm, peak 8.5·In, above 3·In for only 0.05 s

- A class 10 overload uses 28 % of its thermal budget per start (nominal voltage) and 37 % (90 % voltage, 25 s) — for hot restarts or frequent starts use class 20

Example E-3

### 37 kW water pump, 1480 rpm, motor J 0.37 + pump J 0.50 kg·m² — the right timer

- $T_n = 9550(37)/1480 = 238.8$ N·m · $J = 0.87$ kg·m² · $\tau_m = 0.87(157.08)/238.8 = 0.572$ s

- Table E13, pump 0.8: $t_{98} = 1.89(0.572) = 1.08$ s · at 90 % voltage: $t_{95} = 2.56(0.572) = 1.46$ s

- E10: $t_{set} = \max(1.30,\ 1.46) \approx 1.5$ s — set 2–3 s to allow for valve and pipework conditions; 10 s is not needed

- 5 s is not dangerous but wasteful: the I²t of the start rises from 810 to 1,202 A²s (+48 % in the 7.5 kW model) and the winding carries 1.31 times its rated current while the motor hangs in star

Figure 3 · Experiment E2, timer sweep for the fan: the peak swings between about 7.6 and 10.4·In for every setting, but the time above 3·In after the changeover falls from 2.8 s to 0.05 s once the timer reaches the equilibrium speed, while the rotor heat grows with the time spent in star

Figure 4 · Current and speed through the fan start: an 8 s timer (early changeover, lasting high current) versus 20 s (changeover at the equilibrium speed) and DOL

### Timer, current relay or speed switch (experiment E5)

A fixed timer does not know how far the motor has accelerated. If the voltage dips or the load gets heavier, it always switches too early. Experiment E5 compares three methods (50 ms dead time throughout):

| Situation | Fixed timer (10 s) | Current relay < 1.25·In | Speed switch ≥ 90 % |

| Fan, nominal voltage | changeover at 76 % · above 3·In 0.65 s | 13.8 s · 90 % · 0.22 s | 13.9 s · 90 % · 0.22 s |

| Fan, 90 % voltage | changeover at 62 % · 1.33 s | 23.4 s · 87 % · 0.34 s | never reaches 90 % → 40 s time-out · 0.23 s |

| Fan, damper fully open (k 1.15) | changeover at 72 % · 0.81 s | 18.2 s · 90 % · 0.24 s | 18.4 s · 90 % · 0.23 s |

| Pump, nominal voltage (timer 1.5 s) | 96.5 % · 0.06 s | 0.63 s · 91 % · 0.08 s | 0.61 s · 90 % · 0.08 s |

Conclusion: methods that “know the motor's state” (current or speed) adapt to voltage and load by themselves and cut the high-current time after the changeover by 3–4 times when conditions differ from the day the timer was set. They need a back-up maximum time (e.g. 1.5–2 times the normal time) in case the motor hangs in star, and a current relay should be set just above the star equilibrium current (table E1: 0.48–0.97·In).

Figure 5 · A low supply voltage slows the star stage a lot: the fan needs 25 s instead of 15 s at 90 % voltage and settles at a lower speed

### Measuring the real timer value on site

- Set the timer long first (e.g. twice the calculated value) and start. Record the line current with a clamp meter that has an inrush/trend mode, or a power-quality meter.

- Read the time at which the star current “falls and settles” — that is roughly t98. With a tachometer, read the time when the speed stops rising.

- Set the timer to 1.2 × that time, and not below the value calculated for a 10 % voltage dip.

- Test again and record the peak and the time above 3·In after the changeover. It should be a few tenths of a second; longer means the changeover is still too early.

## The changeover: residual voltage, dead time and KM3 phase order Advanced

An open-transition star–delta starter has a dead time in which KM2 has opened but KM3 has not yet closed. The motor has no supply, but currents keep circulating in the rotor cages and hold the flux. This flux turns with the rotor and induces a residual voltage at the motor terminals, which decays with the open-circuit rotor time constant and turns slower than the supply because the rotor is below synchronous speed and decelerating.

E13 Residual voltage after opening

$$\underline e(t) \approx \underline e_0\,e^{-t/T_0'}\,e^{\,j\int_0^t (p\,\omega_r - \omega_s)\,d\tau} \qquad T_0' = \frac{L_r}{R_r}$$

E14 Phase drift during the dead time

$$\delta(t_d) \approx s_{ch}\,\omega_s\,t_d + \frac{p\,T_L}{2J}\,t_d^{2} \quad \text{(electrical rad)}$$

E15 Transient driving voltage

$$|\Delta\underline V| = |\underline V_\Delta - \underline e| = \sqrt{V_\Delta^2 + e^2 - 2V_\Delta e\cos\theta} \qquad \theta = \pm30^\circ - \varphi_0 - \delta$$

E16 Changeover peak estimate

$$I_{pk} \approx k_a\,\frac{|\Delta\underline V|}{V_\Delta}\,I_{LR} \qquad k_a \approx 1.35\text{–}1.45$$

In E15, +30° applies to the lagging KM3 order (the new voltage lags the star voltage by 30°) and −30° to the standard order. φ0 is the angle by which the residual voltage lags the star voltage just after opening (≈ 15–20° in the model), and ka is the first-cycle asymmetry factor (DOL for this motor: 8.9/6.53 = 1.36).

Example E-4

### Predict the changeover peak of the 7.5 kW pump (50 ms dead time) by hand and compare with the simulation

- Before opening n = 1419 rpm → $s_{ch} = 0.054$ · $T_L = 0.8(49.35)(0.12 + 0.88(1419/1471)^2) = 37.1$ N·m · J = 0.105 · p = 2

- E14: $\delta = 0.054(314.16)(0.05) + \frac{2(37.1)}{2(0.105)}(0.05)^2 = 0.848 + 0.883 = 1.73$ rad = 99° — half of it from deceleration, because the low-inertia pump loses 153 rpm in 50 ms

- Lagging order: θ = 30 − 18 − 99 = −87° · residual voltage from the model e = 134 V

- E15:
$$|\Delta V| = \sqrt{400^2 + 134^2 - 2(400)(134)\cos 87^\circ} = 415\ \text{V}$$
= 1.04 times DOL → E16: $I_{pk} \approx 1.36(1.04)(6.53) = 9.2\,I_n$ (simulated 9.7·In)

- Standard order: θ = −30 − 18 − 99 = −147° → $|\Delta V| = 518$ V = 1.29 times → $I_{pk} \approx 11.5\,I_n$ (simulated 11.5·In)

- With a 20 ms dead time: δ = 27.5°, θ = −15.5°, e = 156 V → $|\Delta V| = 253$ V → $I_{pk} \approx 5.6\,I_n$ (simulated 5.7·In)

Figure 6 · Phasors of the transient driving voltage: the lagging order gives |VΔ − e| = 1.04 times DOL, the standard order 1.29 times

### How long a dead time (experiment E3)

The angle θ keeps rotating with time, so the peak rises and falls in waves as the dead time changes (a “phase lottery”). No longer dead time is good for every load, but two trends are clear: shorter is better between 5 and 40 ms, and the lagging order beats the standard order over the practical 0–60 ms range.

| Dead time | Pump lagging | Pump standard | Fan lagging | Fan standard | Conveyor lagging | Conveyor standard |

| 10 ms | 5.0 | 8.1 | 6.1 | 9.1 | 4.7 | 6.9 |

| 20 ms | 5.7 | 9.2 | 6.9 | 9.9 | 4.7 | 7.5 |

| 30 ms | 6.8 | 10.2 | 7.8 | 10.6 | 4.9 | 8.0 |

| 50 ms | 9.7 | 11.5 | 9.5 | 11.3 | 5.6 | 9.1 |

| 80 ms | 10.9 | 9.1 | 11.0 | 10.7 | 7.3 | 10.6 |

| 150 ms | 10.4 | 9.5 | 8.0 | 6.7 | 11.1 | 10.9 |

| 300 ms | 9.4 | 9.2 | 8.8 | 7.6 | 9.6 | 10.2 |

Units: peak rms line current relative to In · DOL = 8.9·In. Very short dead times are not possible in practice, because KM2's contacts must open and the arc must go out first; otherwise KM3 connects to a star point that is still arcing = a phase-to-phase short circuit. Ready-made star–delta timers therefore fix the dead time at about 30–80 ms. Use the shortest value the contactor maker approves, and do not lengthen the dead time in the belief that it reduces the surge: at 100–300 ms the residual voltage has not gone (T0′ is several hundred ms) and the pump has lost 280–630 rpm.

Figure 7 · Peak after the changeover and residual-voltage angle versus dead time (pump and conveyor): rising between 5 and 60 ms and the waves of the “phase lottery” after that

### KM3 phase order: standard versus lagging

KM1 always connects L1→U1 L2→V1 L3→W1. KM3 can connect the winding ends to the lines in two ways that rotate the same way: the standard order L1→W2 L2→U2 L3→V2 (the same as the terminal-box links; winding U across L1–L2, voltage leading by 30°) and the lagging order L1→V2 L2→W2 L3→U2 (winding U across L1–L3, voltage lagging by 30°). Because the residual voltage always lags, the lagging order closes nearer in phase. Simulated pump (50 ms dead time): peak 9.7 against 11.5·In and minimum torque −0.55 against −4.4·Tn. A negative torque of that size hammers the coupling, the gearbox and the motor base at every start.

Figure 8 · Instantaneous L1 current and torque of the pump at the changeover: open transition with the lagging order, with the standard order, and closed transition

### Closed-transition star–delta — experiment E4

E17 Transition resistor

$$R_t = r\,Z_b \qquad Z_b = \frac{V_L}{I_n/\sqrt3} \qquad r \approx 0.1\text{–}0.3$$

Before KM2 opens, a fourth contactor (KM4) connects the winding ends U2 V2 W2 to the lines in the delta order through resistors Rt. While the star point is still closed, the three resistors are just a balanced star load. When KM2 opens, each winding is immediately in delta through Rt, with no moment without supply. KM3 then shorts the resistors. For the 7.5 kW motor Zb = 49.5 Ω. Results:

| Rt/Zb | Rt (Ω) | Pump: peak · torque | Fan: peak · torque | Energy in the resistors (fan) |

| open, 50 ms | — | 9.7·In · −0.5…3.0·Tn | 10.4·In · −4.8…3.8·Tn | — |

| 0.1 | 5.0 | 2.9·In · 0.2…1.6·Tn | 5.6·In · 1.0…3.2·Tn | 0.60 kJ |

| 0.2 | 9.9 | 2.9·In · −0.1…1.8·Tn | 6.2·In · 0.6…3.4·Tn | 0.76 kJ |

| 0.3 | 14.9 | 3.8·In · −0.4…2.1·Tn | 6.7·In · −0.2…3.5·Tn | 0.78 kJ |

| 0.5 | 24.8 | 5.8·In | 7.4·In | 0.70 kJ |

| 1.0 | 49.5 | 8.2·In | 8.4·In | 0.49 kJ |

Closed transition is the only “contactor-only” method that really cuts the changeover peak (by 35–70 %) and removes the negative torque. The price is a fourth contactor, three resistors and a more complex control circuit, so it pays for large motors, generator sets and microgrids. The resistors absorb less than 1 kJ per start in this example, but rate them for the number of starts per hour.

Figure 9 · Peak after a closed-transition changeover versus Rt/Zb: small values (0.1–0.3) reduce the peak the most

## Current, energy and heat: what star–delta really reduces Advanced

A common misconception is that “star–delta saves energy”. In fact one start uses tens of kilojoules (40 kJ = 0.011 kWh), which does not show on the bill, and a few seconds of starting current hardly affects the maximum demand averaged over 15 minutes. What really matters is heat (in the cable, the transformer, the windings and the rotor) and voltage dip.

E18 Rotor heat, no load

$$E_r = \tfrac12 J\omega_s^2\,(s_1^2 - s_2^2) \quad \Rightarrow \quad E_r(1\to0) = \tfrac12 J\omega_s^2 \ \text{independent of voltage}$$

E19 Rotor heat with load

$$E_r = J\omega_s^2\int_{s_2}^{s_1}\frac{s\,T_m(s)}{T_m(s) - T_L(s)}\,ds$$

E20 I²t and overload thermal budget

$$Q = \int i_{rms}^2\,dt \qquad B = \frac{\int (I/I_r)^2\,dt}{7.2^2\,t_{class}}$$

E21 Voltage dip at the PCC

$$\Delta V\% \approx \frac{S_m}{S_{sc} + S_m}\times100 \qquad S_{sc} = \frac{S_T}{u_k}\ \ \text{or}\ \ \frac{S_G}{x_d''} \qquad S_m = \sqrt3\,V_L I$$

E18 says that without load the rotor heat over the whole start always equals the final kinetic energy, whatever the starting voltage. With load, E19 has $T_m - T_L$ in the denominator: the lower the voltage, the smaller the accelerating torque and the larger this factor — a reduced-voltage start always heats the rotor more when there is load. Results of experiment E10:

| Method (fan, J 2.245) | Peak current | Start time | Supply I²t | Rotor heat | Class 10 overload budget |

| Direct on line (DOL) | 8.9·In | 3.3 s | 19,299 A²s (100 %) | 30.8 kJ (100 %) | 19 % |

| Star–delta 12 s | 3.0 → 10.4·In | 12.7 s | 9,804 A²s (51 %) | 40.2 kJ (130 %) | 28 % (15 s) |

| Soft starter, 3·In limit | 3.0·In | 16.3 s | 26,943 A²s (140 %) | 41.6 kJ (135 %) | — |

| VFD (30 s ramp) | 1.2·In | 29.2 s | 3,327 A²s (17 %) | 1.8 kJ (6 %) | — |

For the 7.5 kW pump (low J) star–delta cuts the I²t to 75 % of DOL but the rotor heat is 155 %. The fan's kinetic energy ½Jω² is 26.6 kJ, so the DOL start's 30.8 kJ of rotor heat is close to theory E18, the excess coming from the load torque.

Figure 10 · Supply I²t and rotor heat of each starting method (fan) as a percentage of DOL

### Voltage dip: transformer versus generator set (experiment E12)

Example E-5

### 37 kW pump, In ≈ 69 A, on a 100 kVA generator set (x″d = 0.15) versus a 250 kVA transformer (uk 4 %)

- Genset: $S_{sc} = 100/0.15 = 667$ kVA · transformer: $S_{sc} = 250/0.04 = 6{,}250$ kVA

- DOL: $I = 6.53(69) = 451$ A → $S_m = \sqrt3(400)(451) = 312$ kVA → E21 genset $312/(667+312) = 31.9$ % · transformer 4.8 %

- Star stage: 1/3 → genset 13.5 % · transformer 1.6 %

- Changeover peak 9.7·In (1–2 cycles): $S_m = 464$ kVA → genset 41 % · transformer 6.9 % — the genset's AVR cannot respond within one cycle, and other contactors and relays may drop out

- Fixes on a genset: closed transition (2.9·In → ≈ 17 %), soft starter 3·In (≈ 18 %) or VFD 1.3·In (≈ 9 %)

Figure 11 · Voltage dip at the point of common coupling: DOL, star stage and changeover peak, on transformers and generator sets

Engineering conclusion: on a stiff transformer, star–delta hardly has a voltage-dip problem, but on a generator set, a battery inverter or at the end of a long feeder, the short changeover peak is the main problem — the opposite of the belief that “star–delta suits weak supplies” (cable and breaker design in Design, installation & troubleshooting).

## Running permanently in star at light load: does it really save energy? Advanced

Many plant motors are oversized so that they actually run at only 20–40 % of rating. At light load most of the loss is core loss and copper loss from the magnetising current, both of which depend on voltage. Connecting the windings in star (1/√3 winding voltage) reduces this loss, at the cost of more slip and more copper loss from the load current.

E22 Losses in Y versus Δ

$$P_{loss} = P_{Cu1} + P_{Cu2} + P_{Fe} + P_{fw} \qquad P_{Fe,Y} \approx \tfrac13 P_{Fe,\Delta} \qquad s_Y \approx 3\,s_\Delta$$

E23 Saving and break-even

$$\Delta P = P_{in,\Delta} - P_{in,Y} \qquad \Delta P(x_{be}) = 0 \qquad E_{year} = \Delta P\cdot h \qquad \text{cost} = E_{year}\times\text{tariff}$$

E24 Torque margin in star

$$\frac{T_{k,Y}}{T_L} = \frac{T_k}{3\,T_L} \ge 2.5 \;\Rightarrow\; T_L \le \frac{T_k}{7.5} \approx 0.4\,T_n \ (T_k = 3T_n)$$

| Shaft load | Δ: I · cos φ · η · loss | Y: I · cos φ · η · loss | Saving | Tk,Y/TL | kvar saved |

| 10 % (0.75 kW) | 6.65 A · 0.26 · 62.2 % · 455 W | 2.59 A · 0.55 · 76.6 % · 229 W | 226 W | 9.1 | 2.94 |

| 25 % (1.9 kW) | 7.30 A · 0.46 · 79.9 % · 472 W | 3.95 A · 0.79 · 86.8 % · 284 W | 188 W | 3.9 | 2.81 |

| 40 % (3 kW) | 8.31 A · 0.61 · 85.6 % · 504 W | 5.71 A · 0.86 · 88.4 % · 394 W | 110 W | 2.4 | 2.53 |

| 50 % (3.75 kW) | 9.13 A · 0.68 · 87.6 % · 533 W | 7.06 A · 0.87 · 88.1 % · 506 W | 27 W | 2.0 | 2.24 |

| 60 % (4.5 kW) | 10.05 A · 0.73 · 88.8 % · 570 W | 8.57 A · 0.87 · 87.2 % · 660 W | −90 W | 1.6 | 1.84 |

The model breaks even at 52.7 % of rating (47 % at 95 % voltage, 58 % at 105 %), but the torque margin E24 limits real use to about 35–40 %. This is a linear magnetic model; a real motor whose core saturates at full voltage usually has a higher magnetising current, so running in star usually saves slightly more, while IE3/IE4 motors with low core loss save less.

Example E-6

### Ten 7.5 kW ventilation fans running at 25 % for 6,000 hours a year, tariff 4.5 THB/kWh

- Table: 188 W saved per fan · E23: $0.188 \times 6000 = 1{,}127$ kWh/year/fan → $1{,}127 \times 4.5 = 5{,}072$ THB/year/fan

- Ten fans: 11,270 kWh/year ≈ 50,720 THB/year, and 28 kvar less reactive power (which helps with power-factor charges)

- E24: $T_{k,Y}/T_L = 3.9 \ge 2.5$ ✓ · the speed falls from 1493 to 1478 rpm (the fan delivers about 1 % less air and draws slightly less power)

- Automatic switching is needed: measure real power (kW), not current, because in delta the light-load current hardly changes (6.53 → 7.6 A from 5 to 30 %). Switch to Δ when P > 40 % and back to Y when P < 30 %, with a delay against hunting.

- Compare alternatives: with a strongly varying load a VFD saves much more (affinity law P ∝ n³ in VFD setup & applications); with a constant light load, a smaller motor or an IE4 motor may pay best in the long run.

Figure 12 · Efficiency, power factor and power saved running in star versus delta, with the break-even point and the no-star zone

## Mathematics lab: dynamic simulation of a star–delta start Lab

This lab solves the space-vector equations of the double-cage motor every 0.2 ms through the whole start (not a quasi-static approximation). You can change the motor rating, the number of poles, the load, the inertia, the voltage, the changeover trigger, the dead time, the KM3 phase order and closed transition. The upper chart shows the rms line current and the speed through the start compared with DOL; the lower chart zooms in on the changeover to show the instantaneous currents of all three phases and the torque.

### Run your own parameter sweep (make your own research data)

Choose the swept variable (timer, dead time or closed-transition resistor) and press run. The lab simulates every point in full and plots the results; download them as CSV for a report or a project.

### Worksheet (for students)

- Use “Fan · 8 s timer” and raise the timer 2 s at a time until the time above 3·In falls below 0.1 s. Record the changeover speed and compare with table E13.

- Pump: sweep the dead time from 5 to 300 ms for both phase orders. Explain the wave shape with E14–E15 and find the dead times at which the peak is below DOL.

- Make the pump's J three times larger and repeat task 2. Explain why δ gets smaller (the $T_L t_d^2/2J$ term in E14).

- Conveyor at 50 %: lower the voltage from 100 % in 2 % steps, find where the star stage can no longer break away, and check it against condition E7.

- “Running in star” calculator: find the load with the largest yearly saving subject to Tk,Y/TL ≥ 2.5 for a 15 kW motor running 7,000 hours a year.

The control-circuit simulator (START/STOP buttons, contactors, timer) is in Starter simulator, the torque–speed lab with loads is in the AC motor guide (in Thai) at /learn/ac-induction-motor/#lab, and programming star–delta on a PLC is in PLC motor control.

## Case studies: common field problems analysed with the model Intermediate

The cases below are simulated cases built from symptoms that electricians and engineers meet often. All numbers come from the model on this page (scaled from the 7.5 kW motor); they are not data from any particular plant. Use them as a guide to analysis, and always measure on site before changing anything.

| # | Symptom | Analysis (numbers from the model) | Fix |

| 1 | Large exhaust fan: the plant lights flicker for almost a second at every start; the timer is set to 8 s “like the other pumps” | τm = 7.15 s; changeover at 66 % speed; current above 3·In for 0.96 s | Set per E10 = 21 s or use a current relay → 0.05–0.22 s |

| 2 | Water pump: the breaker trips now and then at the change to delta although the timer is “long enough” | 1–3-cycle rms peak 9.7·In (lagging) to 11.5·In (standard), instantaneous peak about 13·In — inside the instantaneous band of a type C MCB (5–10·In) | Use an MPCB/MCCB with instantaneous trip ≥ 12–13·In · lagging KM3 order · shortest safe dead time · or closed transition |

| 3 | After maintenance the pump's rubber coupling wears out fast and there is a knock at the changeover | KM3 was rewired in the standard order: minimum torque −4.4·Tn (lagging order −0.55·Tn) | Wire L1→V2 L2→W2 L3→U2 and check rotation in both Y and Δ |

| 4 | 37 kW pump on a 100 kVA generator set: other contactors drop out every time the pump changes over | Voltage dip DOL 32 %, star stage 13.5 %, but changeover peak 41 % | Closed transition (≈ 17 %), soft starter 3·In (≈ 18 %) or VFD (≈ 9 %) |

| 5 | Conveyor at the end of a long feeder (88–90 % voltage): in star the motor hums without turning, then jerks hard at the changeover | TY(0) = 0.72 × 0.81 = 0.58·Tn < breakaway 0.6·Tn → the changeover is a DOL start from standstill | Soft starter with torque control, VFD, or DOL if the supply allows · fix the feeder voltage drop |

| 6 | Ten fans run at 25 % all year; high bill and low power factor | Delta cos φ 0.46; in star −188 W per fan, cos φ 0.79, torque margin 3.9 | Automatic Y/Δ switching on real power ≈ 50,720 THB/year (Example E-6), or VFDs |

| 7 | A fan that starts often trips its overload now and then, although the running current is below the setting | 30 s timer; hangs in star at 0.97·In = 1.68 times the rated winding current; uses 36 % of the class 10 budget per start | Set the timer per E10, use a class 20 relay, limit starts per hour |

| 8 | A new 15 kW motor wired star–delta runs hot with high current in delta | Nameplate 230/400 V: in delta at 400 V the winding gets 173 % of its rating | This motor runs in star only: use DOL/soft starter, or change to a 400/690 V motor |

Note on case 2: a breaker's instantaneous band is usually stated as an rms symmetrical current, but the first-cycle peak has a DC component, so the instantaneous value exceeds $\sqrt2\,I_{rms}$. Motor-protection circuit breakers (MPCBs) are designed to ride through this peak; general-purpose MCBs are not (see Contactors & overloads).

## Past, present and future of motor starting Basic

- 1885–1888Galileo Ferraris demonstrates the rotating magnetic field and Nikola Tesla patents the polyphase induction motor (US 381,968, 1888).

- 1889–1891Mikhail Dolivo-Dobrovolsky (AEG) builds a three-phase squirrel-cage induction motor and a three-phase system using star and delta connections; 175 km three-phase transmission from Lauffen to Frankfurt is demonstrated in 1891.

- late 1890sThe double-cage rotor (Boucherot) raises starting torque without slip rings — the torque curve that still lets star–delta start a load with 1/3 of the torque.

- early 20th centuryHand-operated star–delta switches: the operator had to judge the moment to switch. Switching too early and surges were problems from the start.

- mid 20th centuryAutomatic contactor starters with pneumatic or mechanical timers. Utilities in many countries limit motor starting currents on low-voltage networks; star–delta becomes standard in Europe and Asia, while North America prefers autotransformer and part-winding starters.

- 1970–1990Electronic timers and dedicated star–delta relays with a fixed dead time · thyristor soft starters · IGBT PWM inverters spread from the late 1980s to the 1990s.

- 2008–2023IEC 60034-30 (2008) and 60034-30-1 (2014) define classes IE1–IE4 · the EU requires IE3 for 0.75–1000 kW from 2021 and IE4 for 75–200 kW from 2023 (Regulation 2019/1781) · IEC 60947-4-1 (2018) adds utilisation category AC-3e for high-efficiency motors with higher starting currents.

- TodayIE3/IE4 motors have higher Is/In (often 7–8 or more), so the changeover peaks are higher too · star–delta relays with a fixed dead time, current-monitoring relays, smart starters with IO-Link/Modbus · soft starters and VFDs are cheap enough to be the first choice for many new installations · simulation labs like the one on this page can be used to design before installing.

- Future (projections)IE4/IE5 synchronous reluctance and permanent-magnet motors (most need a VFD or DOL as the maker specifies) · microgrids and battery inverters with current limits make the changeover peak more important · star–delta that changes over from the motor's state and measures the residual voltage to choose the closing moment (synchronous) · digital twins for on-site setting · star–delta is expected to stay in fixed-speed pumps, fans and retrofits for a long time, but with a falling share of new installations.

| Past problem | Cause | Solved today with | Future direction |

| Changeover too early, lasting high current | Timer set by habit, no knowledge of the motor state | Calculate c·τm · current/speed relays | Automatic changeover from speed and flux estimation |

| Changeover surge, breaker trips, coupling damage | Residual voltage out of phase, long dead time, standard KM3 order | Lagging KM3 order · fixed-dead-time timers · closed transition | Synchronous closing from residual-voltage measurement · hybrid solid-state starters |

| KM2/KM3 overlap, short circuit | Faulty interlocks, timers without a dead time | Mechanical + electrical interlocks · ready-made Y-Δ contactor assemblies | Self-diagnosis and network alarms |

| Voltage dip on generator sets | 1–3-cycle changeover peak | Soft starters, VFDs, closed transition | Energy-management systems that sequence starts in microgrids |

| Oversized motors, high losses, low cos φ | Sizing with large margins | VFDs · IE3/IE4 motors · capacitors | Motor selection from measured load data · smart Y/Δ switching for constant light loads |

## Research summary: findings, limitations and further research Advanced

Abstract — This work studies star–delta starting of a 7.5 kW 400 V 50 Hz double-cage induction motor with a space-vector dynamic model verified against the equivalent circuit and a reference solver. Fourteen sets of numerical experiments with pump, fan and conveyor loads show that the right timer setting can be written as $c\,\tau_m$ with c ≈ 2–4, almost independent of motor size. The open-transition changeover peak is about 0.6–1.2 times the direct-on-line peak (0.85–1.2 for pumps and fans whatever the timer setting) and is explained by the vector difference between the delta voltage and the residual voltage, which a closed-form formula predicts within about 5 %. The lagging KM3 order and a short dead time reduce the peak, and closed transition reduces it by 35–70 %. Star–delta cuts the supply I²t by 25–50 % but increases rotor heating by 30–55 %, and running permanently in star saves energy below ~50 % load, with practical use limited to 35–40 %.

Keywords: star–delta, wye–delta, timer, mechanical time constant, residual voltage, dead time, closed transition, I²t, voltage dip, star operation at light load

### Main findings

- Timer = c·τm, c ≈ 2.1–3.4 for pumps/fans (including a 10 % voltage-dip margin) and ≈ 3.7 for a constant-torque load at 50 % (E13).

- For pumps and fans the 1–3-cycle changeover peak does not fall with the timer (7.6–10.5·In at every setting); the timer only shortens the high-current time. A load with low star slip (conveyor at 50 %) changing over at its equilibrium speed peaks at only 5.6·In (E2).

- The peak is set by |VΔ − e| and predicted by E14–E16 (within about 1–5 % in Example E-4).

- The dead time acts as a “phase lottery”; shorter is better within the practical range, and lengthening the dead time is not a way to reduce the surge (E3).

- The lagging KM3 order reduces the peak by 10–40 % for dead times of 0–60 ms and the negative torque from −4.4 to −0.55·Tn for the pump (E3).

- Closed transition with Rt ≈ 0.1–0.2·Zb cuts the peak to 2.9–6.2·In without negative torque (E4).

- State-aware methods (current/speed) cut the high-current time 3–4 times when the voltage or load changes (E5).

- Star–delta reduces the supply I²t to 51 % (fan) and 75 % (pump) of DOL, but the rotor heat is 130 % and 155 % (E10).

- On a generator set the changeover peak dips the voltage more than DOL does (41 % against 32 %) (E12).

- Running permanently in star saves 188 W per 7.5 kW at 25 % load; break-even ≈ 53 %; the torque margin limits it to ≈ 40 % (E9).

- The Kloss formula overestimates the run-up time of a double-cage motor by about 74 %; the average-torque method is within 2 % (E8).

### Limitations of the model

- Linear magnetics; saturation and core loss are not in the dynamics (they are in the steady state of E9).

- Ideal contactors opening all three phases at once; real ones break at each phase's current zero, several milliseconds apart, and their contacts bounce on closing.

- Ideal (zero-impedance) supply in the dynamic simulation; the voltage dip is computed separately with E21 at a common angle.

- Other motor sizes are covered per unit through τm and In ∝ kW; real motors of other sizes and makers have different torque curves and time constants.

- The overload thermal budget (E14) is an adiabatic estimate, not the curve of a particular relay.

### Further research (for projects and theses)

- Synchronous changeover: measure the residual voltage and close KM3 when |VΔ − e| is smallest (the same idea as motor bus transfer in power stations, which limits the resultant to about 1.33 pu V/Hz).

- Changeover from sensorless speed estimation using the star-stage current and voltage.

- Laboratory tests on a 2–15 kW test bench compared with this model, including current-zero breaking and contact bounce.

- Smart Y/Δ switching for light loads: decision rules, hysteresis and contactor life.

- Star–delta on solar-battery microgrids: inverter current limits and start sequencing.

### Reproducing the experiments

All code is in the site repository: assets/yd-core.js (the model, used by both the lab and the research), scripts/yd_research.mjs (experiments E1–E14; prints the tables and writes scripts/yd_results.json), scripts/yd_check.py (checks against the equivalent circuit and scipy LSODA) and scripts/yd_figs.py (draws every figure from the results). The motor parameters are in scripts/acm_model.py.

## Site checklist

- Nameplate: the Δ figure = the supply line voltage (400/690 V on 400 V) · remove the links, run six leads.

- Load: pumps/fans k ≤ 1.2 · constant torque ≤ 0.6·Tn (≤ 0.5 if the voltage may dip 10 %).

- Calculate τm = J·ωs/Tn from the catalogue, set the timer = c·τm (table E13) and confirm with a clamp meter.

- KM3 in the lagging order L1→V2 L2→W2 L3→U2 · use a star–delta relay with a fixed dead time; do not lengthen the dead time yourself.

- Breaker/MPCB instantaneous ≥ 12–13·In · overload in the winding-current path set to 0.58·In · starts > 10 s use class 20.

- On a generator set or weak supply: consider closed transition, a soft starter or a VFD.

- Motors running a constant light load < 35–40 %: evaluate permanent star operation with the calculator on this page.

Review the power circuit, control circuit and device sizes in Star–delta starter in detail, and compare other starting methods in Soft starters & autotransformers and VFD principles.

### Standards and references

- IEC 60034-1 Rotating electrical machines — Rating and performance (voltage zones A/B)

- IEC 60034-12 Starting performance of single-speed three-phase cage induction motors (designs N, H, NY, HY)

- IEC 60034-30-1 Efficiency classes of line-operated AC motors (IE code)

- IEC 60947-4-1 Contactors and motor-starters (AC-3, AC-3e, star–delta starters)

- IEC 60204-1 Safety of machinery — Electrical equipment of machines

- IEC 61000-3-3 / 61000-3-11 Voltage changes, voltage fluctuations and flicker

- IEEE Std 3002.7 Recommended Practice for Conducting Motor-Starting Studies in Industrial and Commercial Power Systems

- NEMA MG 1 Motors and Generators

- Regulation (EU) 2019/1781 ecodesign requirements for electric motors and variable speed drives

- Electrical Installation Standard for Thailand (Engineering Institute of Thailand) and the connection requirements of the local utility

- S. D. Umans, Fitzgerald & Kingsley's Electric Machinery, 7th ed., McGraw-Hill, 2014

- S. J. Chapman, Electric Machinery Fundamentals, 5th ed., McGraw-Hill, 2012

- P. C. Krause, O. Wasynczuk, S. D. Sudhoff, S. Pekarek, Analysis of Electric Machinery and Drive Systems, 3rd ed., Wiley-IEEE Press, 2013

- I. Boldea, S. A. Nasar, The Induction Machine Handbook, CRC Press, 2002

## Frequently asked questions

How many seconds should a star–delta timer be set to?
Set it so that the motor changes to delta after it has reached about 98 % of its equilibrium speed in star. You can calculate it from the mechanical time constant τm = J·ωs/Tn multiplied by a coefficient c ≈ 2–4 (centrifugal pump at 80 % ≈ 2.6, fan ≈ 2.9, including a 10 % voltage-dip margin). For example a 37 kW pump with a total J of 0.87 kg·m² needs about 1.5–3 s, while a 7.5 kW fan with a total J of 2.245 kg·m² needs about 21 s. Confirm on site with a clamp meter that the star current has settled before the changeover.

Why is the current surge at the change from star to delta almost as high as, or higher than, a direct-on-line start?
During the dead time the motor is disconnected, but the flux trapped in the rotor produces a residual voltage at the terminals that turns slower than the supply and keeps slipping in phase. When KM3 closes, the transient is driven by the vector difference |V_Δ − e|, which can be 1.0–1.3 times the voltage that drives a DOL start. Simulations of a 7.5 kW motor driving a pump or a fan therefore give a 1–3-cycle peak of about 0.85–1.2 times the DOL peak, but very short. It is reduced by the shortest dead time the contactors allow, the lagging KM3 order or a closed-transition starter.

What should the dead time between KM2 opening and KM3 closing be?
It must be longer than the opening time plus the arcing time of KM2, otherwise the phases are short-circuited. Ready-made star–delta timers typically use about 30–80 ms. Lengthening the dead time does not always reduce the peak, because the angle of the residual voltage keeps rotating. The simulations show that the shortest safe dead time is better, especially for low-inertia pumps that slow down quickly.

Should the delta contactor KM3 be wired L1→W2 or L1→V2?
Both rotate the same way and both are correct. The standard order L1→W2 L2→U2 L3→V2 makes the winding voltage after the changeover lead by 30°; the lagging order L1→V2 L2→W2 L3→U2 makes it lag by 30°, closer to the residual voltage, which already lags. The simulated pump gives a peak of 9.7·In instead of 11.5·In and a negative torque of −0.5·Tn instead of −4.4·Tn, so the lagging order is recommended.

Can a motor run permanently in star to save energy?
Only at light load. In star the winding voltage falls to 1/√3, so core loss and magnetising current fall, but the breakdown torque falls to 1/3 and the slip roughly triples. The 7.5 kW model saves 188 W at 25 % load (cos φ 0.46 → 0.79) and breaks even at about 50 %, but in practice keep it below 35–40 % of rating for a torque margin of at least 2.5, with a power relay that switches back to delta automatically.

Is star the same as wye?
Yes. It is the same connection: the three winding ends are joined into a neutral point. Europe and Asia call it star (Y), North America calls it wye, so the starter is called either a star–delta starter or a wye–delta starter. Delta (Δ) is sometimes called mesh.

Does a star–delta starter save energy compared with DOL?
No. The energy used by one start is tiny (tens of kJ, i.e. hundredths of a kWh). What star–delta reduces is the current and the voltage dip during the run-up, and for high-inertia loads about half of the supply I²t. The rotor, however, gets 30–55 % hotter than with DOL because it accelerates at high slip for longer.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**How many seconds should a star–delta timer be set to?**
Set it so that the motor changes to delta after it has reached about 98 % of its equilibrium speed in star. You can calculate it from the mechanical time constant τm = J·ωs/Tn multiplied by a coefficient c ≈ 2–4 (centrifugal pump at 80 % ≈ 2.6, fan ≈ 2.9, including a 10 % voltage-dip margin). For example a 37 kW pump with a total J of 0.87 kg·m² needs about 1.5–3 s, while a 7.5 kW fan with a total J of 2.245 kg·m² needs about 21 s. Confirm on site with a clamp meter that the star current has settled before the changeover.

**Why is the current surge at the change from star to delta almost as high as, or higher than, a direct-on-line start?**
During the dead time the motor is disconnected, but the flux trapped in the rotor produces a residual voltage at the terminals that turns slower than the supply and keeps slipping in phase. When KM3 closes, the transient is driven by the vector difference |V_Δ − e|, which can be 1.0–1.3 times the voltage that drives a DOL start. Simulations of a 7.5 kW motor driving a pump or a fan therefore give a 1–3-cycle peak of about 0.85–1.2 times the DOL peak, but very short. It is reduced by the shortest dead time the contactors allow, the lagging KM3 order or a closed-transition starter.

**What should the dead time between KM2 opening and KM3 closing be?**
It must be longer than the opening time plus the arcing time of KM2, otherwise the phases are short-circuited. Ready-made star–delta timers typically use about 30–80 ms. Lengthening the dead time does not always reduce the peak, because the angle of the residual voltage keeps rotating. The simulations show that the shortest safe dead time is better, especially for low-inertia pumps that slow down quickly.

**Should the delta contactor KM3 be wired L1→W2 or L1→V2?**
Both rotate the same way and both are correct. The standard order L1→W2 L2→U2 L3→V2 makes the winding voltage after the changeover lead by 30°; the lagging order L1→V2 L2→W2 L3→U2 makes it lag by 30°, closer to the residual voltage, which already lags. The simulated pump gives a peak of 9.7·In instead of 11.5·In and a negative torque of −0.5·Tn instead of −4.4·Tn, so the lagging order is recommended.

**Can a motor run permanently in star to save energy?**
Only at light load. In star the winding voltage falls to 1/√3, so core loss and magnetising current fall, but the breakdown torque falls to 1/3 and the slip roughly triples. The 7.5 kW model saves 188 W at 25 % load (cos φ 0.46 → 0.79) and breaks even at about 50 %, but in practice keep it below 35–40 % of rating for a torque margin of at least 2.5, with a power relay that switches back to delta automatically.

**Is star the same as wye?**
Yes. It is the same connection: the three winding ends are joined into a neutral point. Europe and Asia call it star (Y), North America calls it wye, so the starter is called either a star–delta starter or a wye–delta starter. Delta (Δ) is sometimes called mesh.

**Does a star–delta starter save energy compared with DOL?**
No. The energy used by one start is tiny (tens of kJ, i.e. hundredths of a kWh). What star–delta reduces is the current and the voltage dip during the run-up, and for high-inertia loads about half of the supply I²t. The rotor, however, gets 30–55 % hotter than with DOL because it accelerates at high slip for longer.
