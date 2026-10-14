---
title: "Three-Phase Motor Reversing Circuit: Swapping Two Phases, Electrical, Mechanical and Push-Button Interlocks, and Automatic Reversing with Limit Switches"
url: https://modsengineeringmath.com/learn/en/motor-control/forward-reverse/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> The forward–reverse circuit for a 400 V three-phase motor: why swapping L1 and L3 reverses the motor, the two-contactor power circuit, three layers of interlocking (NC contacts, double push-buttons and a mechanical interlock), reversing through STOP versus instant reversal, plugging and AC-4 duty, roller shutters, electric hoists, conveyors and limit switches.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/forward-reverse/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Three-Phase Motor Reversing Circuit: Swapping Two Phases, Electrical, Mechanical and Push-Button Interlocks, and Automatic Reversing with Limit Switches

THภาษาไทยENEnglish

// Chapter 21.7 · AC Motor Control · Forward–Reverse


Roller shutters, electric hoists, two-way conveyors and lathes all need to reverse. This circuit is two DOL starters connected to one motor. The hard part is not making the motor turn the other way — it is guaranteeing that the two contactors can never close at the same time, because that is a phase-to-phase short circuit.

In 30 seconds

- K1 connects L1-L2-L3 straight through · K2 swaps L1 and L3 → the phase sequence reverses and so does the rotating field

- K1 + K2 closed together = a short circuit between L1 and L3

- Three layers of interlocking: NC auxiliary of the opposite contactor · NO+NC double push-buttons · mechanical interlock

- Instant reversal while running (plugging) draws more than the starting current and needs AC-4 contactors — stop first

## Power circuit: swapping two phases Basic

Figure 1 · The supply sides of K1 and K2 are connected in parallel. On the output side of K2, lines L1 and L3 are swapped before joining the output of K1 · ▽ is the symbol for a mechanical interlock

R1 Phase swap

$$\text{K1: } (L1, L2, L3)\to(U1, V1, W1) \qquad \text{K2: } (L3, L2, L1)\to(U1, V1, W1)$$

R2 Fault if both close

$$I_{k2} = \frac{V_{L1L3}}{2 Z_{src}} = \frac{\sqrt3}{2} I_{k3} \approx 0.87\,I_{k3}$$

## Control circuit with three layers of interlocking Intermediate

Figure 2 · Each side is a DOL self-holding circuit, but with two NC contacts from the opposite side in its path: the other direction's push-button and the other contactor's auxiliary contact

| Layer | Made with | Prevents | Weak spot if it is the only layer |

| 1 Electrical (auxiliary) | K2 21-22 in series with the K1 coil and K1 21-22 in series with the K2 coil | Commanding the second contactor while the first is closed | Main contacts weld but the NC auxiliary can still reclose |

| 2 Push-button | Double buttons: pressing S1 first opens the NC in the K2 side | Pressing both buttons at once · forces reversal through a release first | No help if a contactor sticks |

| 3 Mechanical | A mechanical lever between the paired contactors | Both closing physically, even with a wrong control circuit | The contactor pair must be mounted as the manufacturer specifies |

R3 Interlocked logic

$$K1 = \overline{S0}\,\overline{F2}\,(S1 + K1)\,\overline{S2}\,\overline{K2} \qquad K2 = \overline{S0}\,\overline{F2}\,(S2 + K2)\,\overline{S1}\,\overline{K1}$$

JavaScript is needed for the simulator

In the simulator, press forward and then immediately press reverse: the interlock will refuse. Then tick “No stop-before-reverse” and reverse while the motor is running. Watch the current shoot above the starting current and the speed pass through zero.

## Reversing while running (plugging) Advanced

If the motor is running forward at nearly full speed and the phases are swapped instantly, the rotating field reverses but the rotor is still turning the original way. The slip relative to the new field is therefore close to 2.

R4 Slip during plugging

$$s = \frac{-n_s - n}{-n_s} = 1 + \frac{n}{n_s} \approx 2 \quad (n \approx n_s)$$

At s ≈ 2 the current is slightly higher than at starting and the torque acts as a brake. All the kinetic energy of the load turns into heat in the rotor (about 3 times that of a single start). The contactors must be rated AC-4, and there must be a way to cut the supply when the speed reaches zero (a zero-speed switch); otherwise the motor will accelerate in the reverse direction.

R5 Rotor heat per operation (load with no torque)

$$E_{start} = \tfrac12 J\omega_s^2 \qquad E_{plug\,(\omega_s \to 0)} = \tfrac32 J\omega_s^2 \qquad E_{reverse\,(\omega_s \to -\omega_s)} = 4\cdot\tfrac12 J\omega_s^2$$

Example R-1

### A conveyor reversed while running, total J = 0.4 kg·m², 4-pole motor

- $\omega_s = 2\pi(1500)/60 = 157$ rad/s · kinetic energy $\tfrac12(0.4)(157^2) = 4.93$ kJ

- R5: a full reversal (forward → full speed in reverse) puts ≈ 4 × 4.93 = 19.7 kJ of heat into the rotor, compared with 4.9 kJ for a normal start

- If it reverses every 30 s, the motor heats up four times faster than with normal starts → stop before reversing, or use an inverter that decelerates under control

## Automatic reversing with limit switches Intermediate

Roller shutters and sliding tables must stop at the end of travel. Put an NC end-of-travel limit switch in series with the coil for that direction (-B1 in the forward circuit, -B2 in the reverse circuit). When the limit is hit, that direction's circuit opens while the opposite direction can still be commanded. For automatic back-and-forth travel, wire an NO contact of the same limit switch in parallel with the opposite direction's push-button.

- Use limit switches with positive-opening contacts (IEC 60947-5-1) for any safety-related position

- Add an over-travel limit beyond the normal limit and wire it into the main stop circuit, in case the first limit fails

- Electric hoists: never rely on auxiliary contacts alone — fit upper and lower limits and a mechanical brake

## Frequently asked questions

Is an electrical interlock on its own enough?
No. If the main contacts of one contactor weld, or the contactor sticks mechanically, its NC auxiliary contact may still be closed even though the main contacts are still made, so the other contactor can pull in and short two phases. A mechanical interlock between the two contactors physically stops them closing together. Manufacturers sell reversing contactor sets that include both.

Can I reverse the motor while it is running?
Technically yes (plugging), but the current is higher than the starting current, the torque shocks the shaft and gearbox, and the contactors must be rated AC-4. In most applications you should force the operator to press STOP and wait for the motor to stop first, or use a timer to delay the reversal.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Is an electrical interlock on its own enough?**
No. If the main contacts of one contactor weld, or the contactor sticks mechanically, its NC auxiliary contact may still be closed even though the main contacts are still made, so the other contactor can pull in and short two phases. A mechanical interlock between the two contactors physically stops them closing together. Manufacturers sell reversing contactor sets that include both.

**Can I reverse the motor while it is running?**
Technically yes (plugging), but the current is higher than the starting current, the torque shocks the shaft and gearbox, and the contactors must be rated AC-4. In most applications you should force the operator to press STOP and wait for the motor to stop first, or use a timer to delay the reversal.
