---
title: "How Many Seconds Should a Star–Delta Timer Be Set To? Numerical Experiments on a Squirrel-Cage Induction Motor: Changeover Time, Dead Time, Current and Energy"
url: https://modsengineeringmath.com/en/blog/star-delta-timer-setting/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-19
---

> How many seconds for a star–delta timer? Research simulating a 7.5 kW squirrel-cage motor: t = c·τm, a c table by load, dead time, KM3 phase order, surge current, I²t, energy and case studies.

Markdown copy of https://modsengineeringmath.com/en/blog/star-delta-timer-setting/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# How Many Seconds Should a Star–Delta Timer Be Set To? Numerical Experiments on a Squirrel-Cage Induction Motor: Changeover Time, Dead Time, Current and Energy

## 2. Background

At the same speed, the star connection gives 1/3 of the delta line current and torque, and the breakdown torque also falls to 1/3. The motor can therefore accelerate only to its star equilibrium speed $n_Y$, where the star torque equals the load torque. The run-up time follows from Newton's second law for rotation:

$$t(\omega_1) = J\int_0^{\omega_1}\frac{d\omega}{T_Y(\omega) - T_L(\omega)} \qquad \tau_m = \frac{J\,\omega_s}{T_n}$$

The mechanical time constant $\tau_m$ is the time rated torque would need to accelerate the rotating mass from rest to synchronous speed. With time measured in $\tau_m$ and torque in $T_n$, the equation above contains no motor size at all, so the results carry over to other motors whose torque curves have a similar shape.

During the dead time, when the motor is disconnected, flux trapped in the rotor produces a residual voltage $\underline e$ at the terminals, which turns slower than the supply and drifts by an angle $\delta$. When KM3 closes, the transient is driven by the vector difference

$$\delta \approx s_{ch}\,\omega_s t_d + \frac{p\,T_L}{2J}t_d^2 \qquad |\Delta\underline V| = |\underline V_\Delta - \underline e| \qquad I_{pk} \approx k_a\,\frac{|\Delta\underline V|}{V_\Delta}\,I_{LR}$$

where $k_a \approx 1.35\text{–}1.45$ is the first-cycle asymmetry factor. The derivations and all formulas (E1–E24) are in Star–delta analysis, and the basics of torque–speed curves are in the induction motor lesson Induction motor.

## 3. Method

3.1 Model. A 7.5 kW 4-pole 400 V Δ 50 Hz motor with a double-cage rotor (In 14.0 A, Tn 49.3 N·m, 1471 rpm, Is/In 6.53, Ts/Tn 2.15, Tk/Tn 3.0, motor J 0.045 kg·m²), written as space-vector equations in physical winding quantities. The states are the flux linkages of the stator, the outer cage and the inner cage, plus the speed, solved with fourth-order Runge–Kutta every 0.1 ms. During the dead time the stator current is zero and only the two rotor cages are integrated (their flux is continuous across the switching).

3.2 Verification. Twelve steady-state points agree with the equivalent circuit to 10⁻¹⁶, and the changeover transient (peak current, maximum and minimum torque, speed) agrees with scipy's LSODA solver within 0.3 %.

3.3 Loads and experiments. A centrifugal pump at 80 % ($T_L \propto n^2$, total J 0.105 kg·m², τm 0.33 s), a large fan (total J 2.245 kg·m², τm 7.15 s) and a constant-torque conveyor at 50 % (total J 0.395 kg·m², τm 1.26 s), in 14 sets of experiments:

| Set | Independent variable | Dependent variables |

| E1, E7, E13 | Load type and size | Star equilibrium speed, t95, t98, coefficient c |

| E2, E5 | Timer setting · changeover trigger (timer, current relay, speed) | Peak current, time above 3·In, I²t, rotor heat |

| E3, E11 | Dead time 5–800 ms · KM3 phase order · switch-on angle | Peak current, torque, residual voltage and angle |

| E4 | Closed-transition resistor Rt/Zb | Peak current, torque, resistor energy |

| E6, E8 | Voltage 80–105 % · inertia 0.1–8 kg·m² | Run-up time, compared with Kloss and average torque |

| E9, E10, E12, E14 | Starting method · running load · supply size | Energy, I²t, voltage dip, overload thermal budget, permanent star running |

3.4 Proposed timer criterion. $t_{set} = \max\big(1.2\,t_{98}(V_n),\ t_{95}(0.9V_n)\big)$: wait until 98 % of the equilibrium speed with a 20 % margin, and never less than the time to 95 % with a 10 % voltage dip.

## 4. Results

### 4.1 Timer setting (RQ1)

Measured in τm, the run-up curves of the pump and the fan almost coincide, and making J four times larger does not change t98/τm at all. The result is a coefficient table that applies to motors of any size:

| Load (k = torque at rated speed / Tn) | nY/nN | t98/τm | t95/τm at 90 % voltage | c |

| Pump T ∝ n² · k 0.6 | 98.2 % | 1.63 | 2.08 | 2.1 |

| Pump T ∝ n² · k 0.8 | 96.5 % | 1.89 | 2.56 | 2.6 |

| Pump T ∝ n² · k 1.0 | 94.1 % | 2.31 | 3.44 | 3.4 |

| Fan · k 1.0 | 94.2 % | 2.10 | 2.94 | 2.9 |

| T ∝ n · k 0.8 | 96.2 % | 2.37 | 3.96 | 4.0 |

| Constant torque · k 0.5 | 98.8 % | 3.10 | no breakaway | 3.7 |

Figure 1 · Star-stage run-up of the three loads against time in units of τm

Example: a 37 kW, 1480 rpm pump with a total J of 0.87 kg·m² → $T_n = 238.8$ N·m, $\tau_m = 0.87 \times 157.08/238.8 = 0.572$ s → $t_{set} = 2.6 \times 0.572 \approx 1.5$ s (set 2–3 s in practice). A 7.5 kW fan with a total J of 2.245 kg·m² → $\tau_m = 7.15$ s → $t_{set} = 2.94 \times 7.15 \approx 21$ s. A blanket “5–10 s for every job” is therefore longer than needed for small pumps and far too short for high-inertia fans. The closed-form Kloss formula popular in textbooks overestimates the time of a double-cage motor by about 74 % (it gives a starting torque of only 0.79·Tn instead of 2.15·Tn), whereas the average-torque method is within 2 %.

### 4.2 Changeover peak, dead time and phase order (RQ2)

The result that contradicts common belief most is that the 1–3-cycle changeover peak of pumps and fans does not fall with the timer setting. Sweeping the fan timer from 1 to 30 s gives peaks of 7.6–10.4·In, and the pump 7.7–10.5·In, against 8.9·In for DOL. What a correct timer reduces is the time the current stays above 3·In after the changeover: the fan set to 8 s (changeover at 66 % speed) stays above 3·In for 0.96 s, set to 20 s for 0.05 s. A load with low slip in star (conveyor at 50 %) changing over at its equilibrium speed peaks at only 5.6·In.

Figure 2 · Timer sweep for the fan: speed at changeover, peak current, high-current time, I²t and rotor heat

The peak is explained by the residual voltage. Pump example (50 ms dead time): before opening n = 1419 rpm, slip 0.054, load torque 37.1 N·m, J = 0.105 → $\delta = 0.848 + 0.883 = 1.73$ rad (99°), half of it from the deceleration of the low-inertia load. The residual voltage is 134 V at −87° to the new delta voltage → $|\Delta V| = 415$ V = 1.04 times DOL → $I_{pk} \approx 1.36 \times 1.04 \times 6.53 = 9.2\,I_n$ (simulated 9.7·In). With KM3 in the standard order the angle is −147° → $|\Delta V| = 518$ V → 11.5·In (simulated 11.5·In), and the minimum torque is −4.4·Tn instead of −0.55·Tn.

Figure 3 · Phasors of the pump's transient driving voltage |VΔ − e| with KM3 in the lagging and the standard order

The dead time acts in waves (a “phase lottery”). Between 5 and 60 ms, shorter is better (pump: 5.0·In at 10 ms, 6.8·In at 30 ms, 9.7·In at 50 ms) and the lagging order beats the standard order by 10–40 %; beyond that the peak rises and falls with the angle and no value suits every load. Closed transition with Rt = 0.1–0.3·Zb cuts the peak to 2.9–3.8·In (pump) and 5.6–6.7·In (fan), without negative torque.

### 4.3 Current, energy and heat (RQ3)

| Method (fan) | Peak current | Time | Supply I²t | Rotor heat |

| Direct on line | 8.9·In | 3.3 s | 100 % | 100 % (30.8 kJ) |

| Star–delta | 3.0 → 10.4·In | 12.7 s | 51 % | 130 % |

| Soft starter 3·In | 3.0·In | 16.3 s | 140 % | 135 % |

| VFD | 1.2·In | 29.2 s | 17 % | 6 % |

Figure 4 · Supply I²t and rotor heat of each starting method compared with DOL

The electrical energy of one start is at most about a hundred-odd kilojoules (≤ 0.04 kWh in every case of this work), so no starting method saves a meaningful amount of energy. Theory says that without load the rotor heat equals $\tfrac12 J\omega_s^2$ whatever the voltage, but with load a lower voltage means slower acceleration and high slip for longer, so the rotor gets hotter than with DOL. The real benefit of star–delta is the lower I²t and sustained voltage dip. On a 250 kVA transformer a 37 kW pump dips the voltage by 4.8 % (DOL), 1.6 % (star stage) and 6.9 % for only 1–2 cycles at the changeover; on a 100 kVA generator set the figures are 32 %, 13.5 % and 41 %.

An additional experiment (E9) found that running permanently in star at light load does save energy: 188 W per 7.5 kW motor at 25 % load, with cos φ improving from 0.46 to 0.79. The break-even point is about 53 %, but the torque margin (Tk,Y/TL ≥ 2.5) limits practical use to about 35–40 % of rating.

Figure 5 · Efficiency, power factor and power saved running in star versus delta

## 5. Discussion and case studies

Compared with existing practice. The advice “change over at 85–90 % speed” is right in principle, but electricians cannot measure speed. The c·τm criterion turns this principle into a number from catalogue data (motor J, load J, Pn, nN). The belief that “a longer dead time reduces the surge” is not supported by the experiments, and “a long timer is the safe side” is only partly true: while hanging at the equilibrium speed the fan's winding carries 1.68 times its rated winding current (0.97·In in star against a winding rating of 0.58·In), and a 30 s timer uses 36 % of a class 10 overload's thermal budget per start.

Case studies (simulated cases built from common symptoms; numbers from the model):

- Exhaust fan, lights flicker for almost a second — set to 8 s like the pumps; changeover at 66 % speed, above 3·In for 0.96 s → reset to 21 s or use a current relay: 0.05–0.22 s.

- Pump trips now and then at the changeover — an rms peak of 9.7–11.5·In falls inside the instantaneous band of a type C MCB → use an MPCB/MCCB with instantaneous trip ≥ 12–13·In, the lagging KM3 order, or closed transition.

- Coupling damage after maintenance — KM3 was rewired in the standard order, torque surge −4.4·Tn → wire L1→V2 L2→W2 L3→U2.

- Pump on a generator set drops out other contactors — the changeover peak dips the voltage by 41 % → closed transition (≈ 17 %), soft starter (≈ 18 %) or VFD (≈ 9 %).

Limitations. The model has linear magnetics, ideal contactors that open all three phases at once and a zero-impedance supply in the dynamics, and it is extended to other sizes per unit. The results are therefore quantitative trends that should be confirmed by measurement on site.

## 6. Past, present and future

- 1889–1891Dolivo-Dobrovolsky (AEG) builds a three-phase squirrel-cage motor and a three-phase system using star and delta connections.

- early–mid 20th centuryFrom hand-operated star–delta switches to contactors with pneumatic and mechanical timers. Utilities in many countries limit starting currents, so star–delta becomes standard in Europe and Asia.

- 1970–1990Electronic timers with a fixed dead time, thyristor soft starters and IGBT inverters.

- TodayIE3/IE4 motors (IEC 60034-30-1) with higher starting currents, AC-3e contactors (IEC 60947-4-1:2018), current-monitoring relays and smart starters. Simulation models like the one in this article can be used to design before installing.

- Future (projections)Changeover from the motor's state and synchronous closing from residual-voltage measurement; microgrids and battery inverters that make the changeover peak more important; IE4/IE5 motors mostly on VFDs; digital twins for setting up on site.

## 7. Conclusions and recommendations

- Set the timer to $t_{set} = c\,\tau_m$ from the c table (2.1–4.0) and confirm with a clamp meter that the star current has settled before the changeover.

- Where the voltage or the load varies, use a current or speed relay instead of a fixed timer (3–4 times shorter high-current time).

- Use the shortest dead time the manufacturer approves and wire KM3 in the lagging order L1→V2 L2→W2 L3→U2.

- On generator sets or weak supplies consider closed transition, a soft starter or a VFD.

- Protective devices must ride through a ~10·In changeover peak, and starts longer than 10 s need a class 20 overload.

- For motors running a constant light load below 35–40 %, evaluate permanent star operation to save energy.

Change the timer, the dead time and the phase order yourself in the dynamic simulation lab at Star–delta analysis · lab. Every result in this article can be reproduced with node scripts/yd_research.mjs and python3 scripts/yd_check.py in the site's code repository.

### References

- IEC 60034-1, Rotating electrical machines — Rating and performance

- IEC 60034-12, Starting performance of single-speed three-phase cage induction motors

- IEC 60034-30-1, Efficiency classes of line-operated AC motors (IE code)

- IEC 60947-4-1, Contactors and motor-starters

- IEEE Std 3002.7, Recommended Practice for Conducting Motor-Starting Studies in Industrial and Commercial Power Systems

- S. D. Umans, Fitzgerald & Kingsley's Electric Machinery, 7th ed., McGraw-Hill, 2014

- P. C. Krause et al., Analysis of Electric Machinery and Drive Systems, 3rd ed., Wiley-IEEE Press, 2013

- I. Boldea, S. A. Nasar, The Induction Machine Handbook, CRC Press, 2002

## Continue in the library

- Star–delta analysis: timer, star or delta operation, currents, energy and a dynamic simulation lab

- The star–delta starter in detail: power circuit, control circuit, 0.58 In

- Star and delta motor connections: choosing from the nameplate

- How the 3-phase induction motor works: rotating field, slip and torque

- Soft starters and a comparison of motor starting methods

- Read next: 3-phase motor delta connection U1–W2, V1–U2, W1–V2

## Frequently asked questions

How many seconds should a star–delta timer be set to?
Calculate the mechanical time constant τm = J·ωs/Tn and multiply it by c ≈ 2–4 depending on the load (centrifugal pump at 80 % ≈ 2.6, fan ≈ 2.9, including a 10 % voltage-dip margin). A 37 kW pump with a total J of 0.87 kg·m² gives about 1.5 s (set 2–3 s), while a 7.5 kW fan with a total J of 2.245 kg·m² gives about 21 s. Then confirm with a clamp meter that the star current has settled before the changeover.

Does a longer timer reduce the current surge at the changeover?
Only the lasting part. The simulated pump and fan give a 1–3-cycle peak of about 7.6–10.5·In whatever the setting (DOL 8.9·In), because the peak is set by the difference between the delta voltage and the residual voltage in the motor. What a correct timer reduces is the time the current stays above 3·In after the changeover, for the fan from 0.96 s (8 s timer) to 0.05 s (20 s timer).

Is a longer dead time between KM2 and KM3 better?
No. The dead time must be long enough for the arc in KM2 to go out before KM3 closes (ready-made timers typically use about 30–80 ms), but lengthening it does not reduce the surge because the angle of the residual voltage keeps rotating. The simulations favour the shortest safe value and the lagging KM3 order L1→V2 L2→W2 L3→U2.

What is star–delta really better at than a direct-on-line start?
It reduces the run-up current to 1/3, the sustained voltage dip to 1/3 and the supply I²t by 25–50 %. It does not save energy, and the rotor gets 30–55 % hotter than with DOL. On a generator set the changeover peak can even dip the voltage more than DOL does.

How can the experiments in this article be reproduced?
Open the dynamic simulation lab on the Star–delta analysis page of the lesson library, or run node scripts/yd_research.mjs and python3 scripts/yd_check.py in the site's code repository, which use the same model as this article.

## More articles worth reading

3-phase motors
3-Phase Motor Delta (Δ) Connection: Remember U1–W2, V1–U2, W1–V2 and Choose from the Nameplate
How to connect a 3-phase motor in delta: links U1-W2, V1-U2, W1-V2, what U1 V1 W1 U2 V2 W2 mean and which wire colours go where, line vs phase…
17 Oct 2026Read the article →

Power factor
How to Calculate the Size of a Power Factor Correction Capacitor (kvar) with an Example
The formula Qc = P(tan φ1 − tan φ2) with a 100 kW, 400 V load corrected from PF 0.75 to 0.95 giving 55.3 kvar, microfarads per phase, a multiplier…
16 Oct 2026Read the article →

Power factor
What Is Power Factor? The cos φ Formula and the Relationship between kW, kVA and kvar
Power factor is the ratio of real power to apparent power. See the P Q S power triangle, a worked current calculation at PF 0.8 versus 1.0, lagging…
16 Oct 2026Read the article →

All 4 articles in Power Systems & Motors → · All articles

## Frequently asked questions

**How many seconds should a star–delta timer be set to?**
Calculate the mechanical time constant τm = J·ωs/Tn and multiply it by c ≈ 2–4 depending on the load (centrifugal pump at 80 % ≈ 2.6, fan ≈ 2.9, including a 10 % voltage-dip margin). A 37 kW pump with a total J of 0.87 kg·m² gives about 1.5 s (set 2–3 s), while a 7.5 kW fan with a total J of 2.245 kg·m² gives about 21 s. Then confirm with a clamp meter that the star current has settled before the changeover.

**Does a longer timer reduce the current surge at the changeover?**
Only the lasting part. The simulated pump and fan give a 1–3-cycle peak of about 7.6–10.5·In whatever the setting (DOL 8.9·In), because the peak is set by the difference between the delta voltage and the residual voltage in the motor. What a correct timer reduces is the time the current stays above 3·In after the changeover, for the fan from 0.96 s (8 s timer) to 0.05 s (20 s timer).

**Is a longer dead time between KM2 and KM3 better?**
No. The dead time must be long enough for the arc in KM2 to go out before KM3 closes (ready-made timers typically use about 30–80 ms), but lengthening it does not reduce the surge because the angle of the residual voltage keeps rotating. The simulations favour the shortest safe value and the lagging KM3 order L1→V2 L2→W2 L3→U2.

**What is star–delta really better at than a direct-on-line start?**
It reduces the run-up current to 1/3, the sustained voltage dip to 1/3 and the supply I²t by 25–50 %. It does not save energy, and the rotor gets 30–55 % hotter than with DOL. On a generator set the changeover peak can even dip the voltage more than DOL does.

**How can the experiments in this article be reproduced?**
Open the dynamic simulation lab on the Star–delta analysis page of the lesson library, or run node scripts/yd_research.mjs and python3 scripts/yd_check.py in the site's code repository, which use the same model as this article.
