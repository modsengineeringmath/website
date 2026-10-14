---
title: "Applied Motor Control Circuits in Practice: Sequence Starting, Float-Switch Pumps, Pump Alternation, Pressure-Switch Compressors, Two-Speed Motors and Phase Protection Relays"
url: https://modsengineeringmath.com/learn/en/motor-control/applied-circuits/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Contactor circuits used in real buildings and factories: timed sequence starting of conveyors, automatic water pumps with float switches or electrodes, Hand-Off-Auto selector switches, duty/standby pump alternation, air compressors with pressure switches, Dahlander two-speed motors, phase-failure, phase-reversal and voltage relays, and the formula for a pump's starts per hour.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/applied-circuits/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Applied Motor Control Circuits in Practice: Sequence Starting, Float-Switch Pumps, Pump Alternation, Pressure-Switch Compressors, Two-Speed Motors and Phase Protection Relays

THภาษาไทยENEnglish

// Chapter 21.10 · AC Motor Control · Applied Circuits


Once you understand self-holding, interlocking and timers, almost every circuit in buildings and factories is just these three ideas combined with sensors. This page collects the circuits electricians meet most often, with the reason behind each point in the circuit.

In 30 seconds

- Sequence starting: a contact of the previous motor is placed in series in the circuit of the next one

- Float-switch pump: the differential between the on and off levels sets the number of starts, $N_{max} = Q_p/(4V)$

- Every position of Hand-Off-Auto must pass through the protective devices

- A phase protection relay pays off most on unstable supplies: it guards against phase loss, phase reversal and under/overvoltage

## Sequence starting (cascaded conveyors) Basic

Conveyors that feed one another must start from the discharge end back towards the feed end, and stop from the feed end towards the discharge end; otherwise material piles up on a stopped conveyor. The circuit uses an NO contact of the previous contactor (K1) in series in the circuit of the next (K2), plus a timer so that the next one starts by itself once the previous one has run for the set time — which also spreads out the starting currents so they do not occur together.

Figure 1 · K2 can pull in only while K1 is energised and timer K3T has timed out. If K1 stops or trips, K2 stops immediately (F2 and F4 are in series in the common path)

A1 Sequence interlock

$$K2 = K1 \cdot T_{K3T} \cdot \overline{S0} \qquad K1 = \overline{S0}\,(S1 + K1)$$

## Automatic water pump with a float switch and Hand-Off-Auto Basic

Figure 2 · The three-position selector switch has two contact sets: H feeds the coil directly, A feeds it through the float switch; both still pass through the overload

A tethered (cable) float switch changes state when it tilts up or down, so the differential between the on and off levels is set by the length of free cable. Systems that need a wide differential use two floats (upper and lower level) with a self-holding circuit, or an electrode-type level relay (e.g. probes E1 E2 E3) with built-in latching.

A2 Maximum starts per hour

$$t_{cycle} = \frac{V}{Q_p - q} + \frac{V}{q} \;\ge\; \frac{4V}{Q_p}\ \ (q = Q_p/2) \qquad N_{max} = \frac{Q_p}{4V}$$

Example A-1

### 18 m³/h pump, 5.5 kW motor, at most 10 starts per hour allowed

- A2: $V \ge Q_p/(4N) = 18/(4 \times 10) = 0.45$ m³ between the on and off levels

- Tank cross-section 1.5 m² → level differential $0.45/1.5 = 0.30$ m

- If a single float gives a differential of only 0.1 m, the pump could start up to 30 times per hour when demand is half the pump rate — a two-level float arrangement is needed

## Duty/standby pump alternation Intermediate

Building water supplies and pumping stations often have two pumps (duty/standby) that alternate each time a run command is given, so that running hours stay equal and the standby pump is always ready. The simplest way is an alternating relay, which swaps its output contact each time the run signal disappears. Worthwhile additions:

- High-high water level: call the second pump to assist (duty-assist)

- If the duty pump trips (F2 97-98 closes), the standby pump takes over automatically and an alarm is raised

- A separate hour meter for each pump, for maintenance planning

A3 Equal running hours

$$h_1 \approx h_2 \approx \frac{h_{total}}{2} \qquad \text{the standby pump must run at least every 1–2 weeks}$$

## Air compressor with a pressure switch Intermediate

A pressure switch has an NC contact that opens when the pressure reaches the cut-out value and closes when the pressure falls to the cut-in value; it is wired in series with the coil in the Auto position. A reciprocating compressor must start unloaded, so it has an unloader valve that vents the cylinder head when stopping. With star–delta starting it is even more important to check that the unloader works, because torque in star is low.

A4 Receiver size for compressor cycling

$$t_{off} = \frac{V_{tank}\,\Delta p}{p_0\,q_{use}} \qquad t_{on} = \frac{V_{tank}\,\Delta p}{p_0\,(Q_c - q_{use})}$$

$p_0$ = atmospheric pressure (absolute), Δp = pressure-switch differential · Fit an anti-short-cycle timer of 1–3 minutes after stopping to prevent the motor from starting more often than allowed.

## Dahlander two-speed motors Advanced

A Dahlander motor has a single winding that can be connected two ways, giving pole numbers in a 2:1 ratio, e.g. 4/2 poles (1500/3000 rpm). Low speed is connected in Δ and high speed in YY (two halves in parallel, connected in star). Three contactors are used: K1 (low) and K2+K3 (high: K2 supplies power, K3 shorts the star point). Low and high are interlocked in the same way as a reversing circuit, and it is common practice always to start at low speed first.

A5 Pole-changing speeds

$$n_{s,low} = \frac{120f}{2p} \qquad n_{s,high} = \frac{120f}{p} = 2\,n_{s,low}$$

Fans and pumps use the “variable torque” type (Y/YY); machinery uses the “constant torque” (Δ/YY) or “constant power” type. The nameplate states the type and the terminals (1U 1V 1W for low speed, 2U 2V 2W for high speed). A separate overload is needed for each speed because the rated currents differ.

## Phase and voltage protection relays Basic

A phase monitoring relay measures all three phases and has an output contact wired in series in the control circuit, dropping out the contactor on:

| Fault | Result without a relay | Typical setting |

| Phase loss | Motor runs on two phases at ~1.7 × current, overheats and burns out; cannot restart | Instant detection |

| Phase reversal | Pump or compressor runs backwards and is damaged; lifts/hoists become dangerous | Checked at power-up |

| Under/overvoltage | Insufficient torque, high current, or stressed insulation | ±10–15 %, delay 2–10 s |

| Unbalance | Rotor overheating (see S4–S5) | 5–10 % |

Automatic restart after a power failure: a circuit using a float switch or pressure switch in Auto mode will start by itself when power returns. That is acceptable for a water pump but not for a machine with people working near it. Assess the risk according to IEC 60204-1 and fit a warning sign “May start automatically without warning” on the machine. Where a building has several motors, give them different restart delays so their starting currents do not add up when power returns.

## Frequently asked questions

Why does a float-switch pump keep switching on and off rapidly?
The distance between the float's on and off levels (the differential) is too small for the flow rate. Use formula A2 to find the volume needed between the two levels, or use a two-level float or two-level electrodes. A pump that starts more often than allowed overheats and wears out its contactor quickly.

How does Hand-Off-Auto differ from Local-Remote?
Hand-Off-Auto selects whether the motor runs by hand (bypassing the automatic system), stops, or is commanded by an automatic device (a float switch or PLC). Local-Remote selects where commands come from, such as the push-buttons at the machine or the control room. Neither may bypass the protective devices or the emergency stop.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why does a float-switch pump keep switching on and off rapidly?**
The distance between the float's on and off levels (the differential) is too small for the flow rate. Use formula A2 to find the volume needed between the two levels, or use a two-level float or two-level electrodes. A pump that starts more often than allowed overheats and wears out its contactor quickly.

**How does Hand-Off-Auto differ from Local-Remote?**
Hand-Off-Auto selects whether the motor runs by hand (bypassing the automatic system), stops, or is commanded by an automatic device (a float switch or PLC). Local-Remote selects where commands come from, such as the push-buttons at the machine or the control room. Neither may bypass the protective devices or the emergency stop.
