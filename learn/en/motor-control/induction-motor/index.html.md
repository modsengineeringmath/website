---
title: "Three-Phase Induction Motor Principles for Industry: Rotating Field, Slip, Torque–Speed Curve, Starting Current and the Nameplate"
url: https://modsengineeringmath.com/learn/en/motor-control/induction-motor/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> How a three-phase induction motor works: the rotating magnetic field n_s = 120f/p, slip, the equivalent circuit, the torque–speed curve, starting current of 6–8 times rated, torque proportional to V², IE2 IE3 IE4 efficiency classes to IEC 60034-30-1, reading the nameplate (IP, IC, insulation class, S1 duty) and calculating rated current from kW for a 400 V 50 Hz system.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/induction-motor/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Three-Phase Induction Motor Principles for Industry: Rotating Field, Slip, Torque–Speed Curve, Starting Current and the Nameplate

THภาษาไทยENEnglish

// Chapter 21.1 · AC Motor Control · Induction Motor


Before choosing a contactor or designing a starter you need to know what the motor “wants” from the circuit: how much current it draws when starting, how much torque it gives, and what a voltage dip does to it. This page goes from the physics to the numbers on the nameplate, using the same 7.5 kW 4-pole 400 V 50 Hz motor throughout the course.

In 30 seconds

- Three-phase currents 120° apart create a magnetic field rotating at $n_s = 120f/p$

- The rotor turns slightly slower: slip $s$ is 1–5 % at rated load · rated torque $T = 9550P/n$

- At start ($s = 1$) current is 6–8 In but torque only 1.5–2.5 Tn

- Torque varies with the square of voltage: a 10 % voltage dip loses 19 % of torque

- kW on the nameplate = mechanical shaft power · rated current $I_n = P/(\sqrt3 V \eta \cos\varphi)$ ≈ 2 A/kW at 400 V

## Construction Basic

The squirrel-cage induction motor, the most common motor in factories, has two parts: the stator, a laminated iron core carrying three windings placed 120 electrical degrees apart, and the rotor, made of aluminium or copper bars cast into short-circuiting end rings at both ends. There are no brushes and no commutator, so it is rugged and needs little maintenance. The usual type is TEFC (Totally Enclosed Fan Cooled, code IC411), with a fan on the shaft blowing air over the cooling fins.

Figure 1 · Parts of a TEFC motor: all six stator winding leads come out to the terminal box, which is where we choose star or delta

## The rotating field and synchronous speed Basic

When three-phase currents displaced 120° in time are fed into windings displaced 120° in space, the vector sum of the three fields has a constant magnitude of 1.5 times the peak field of one phase and rotates around the stator at constant speed. This is the heart of the three-phase AC motor: rotation without any moving parts.

Figure 2 · At times t1, t2, t3 each phase current is different, but the resultant vector keeps the same length and turns 60° each time ωt advances 60°

M1 Synchronous speed

$$n_s = \frac{120\, f}{p}\ \ \text{rpm} \qquad (p = \text{number of poles})$$

| Number of poles p | 2 | 4 | 6 | 8 |

| n_s at 50 Hz | 3000 | 1500 | 1000 | 750 |

| Approx. rated n | 2900–2970 | 1440–1480 | 950–985 | 700–740 |

| Typical use | High-head pumps, small fans | General purpose (most common) | Large fans, crushers | Conveyors, hoists |

## Slip and torque Intermediate

The rotating field sweeps across the rotor bars and induces voltage and current in the rotor (Faraday's law). Because this current sits in a magnetic field it feels a force $F = BIL$ that drags the rotor round after the field. But if the rotor caught up with the field exactly, the flux cutting would vanish and the torque would be zero, so the rotor always turns slower — hence the name “asynchronous motor”.

M2 Slip

$$s = \frac{n_s - n}{n_s} \qquad n = n_s(1 - s)$$

M3 Rotor frequency

$$f_r = s\, f$$

M4 Torque from power and speed

$$T = \frac{P}{\omega} = \frac{60\,P}{2\pi n} \;\;\Rightarrow\;\; T\,[\text{N}{\cdot}\text{m}] = \frac{9550\, P\,[\text{kW}]}{n\,[\text{rpm}]}$$

Example M-1

### A 7.5 kW 4-pole 50 Hz motor, nameplate 1470 rpm

- M1: $n_s = 120(50)/4 = 1500$ rpm

- M2: $s = (1500 - 1470)/1500 = 0.02 = 2\,\%$ · M3: $f_r = 0.02 \times 50 = 1$ Hz (the rotor current reverses very slowly)

- M4: $T_n = 9550(7.5)/1470 = 48.7$ N·m — the value to compare with the load torque and the starting torque

## Equivalent circuit and power flow Advanced

An induction motor is a transformer whose secondary (the rotor) can rotate. Referring the rotor quantities to the stator side gives the per-phase circuit of Figure 3. The rotor resistance appears as $R_2'/s$, which splits into the rotor copper loss $R_2'$ and a “load resistor” $R_2'(1-s)/s$ representing the mechanical power.

Figure 3 · Per-phase equivalent circuit (Y basis): at start s = 1 and the circuit impedance is only R₁ + R₂′ + jX — which is why the current is several times rated

M5 Power split in the rotor

$$P_{ag} = 3 I_2'^2 \frac{R_2'}{s} \qquad P_{cu2} = s\,P_{ag} \qquad P_{mech} = (1 - s)\,P_{ag} \qquad T = \frac{P_{ag}}{\omega_s}$$

The key practical result: rotor loss = slip × air-gap power. A motor running at high slip (low voltage, overload, wrongly connected in star) heats up immediately, and reducing speed by increasing slip is wasteful — unlike lowering the frequency with a VFD, where the slip stays small.

Example M-2

### Power flowing through the rotor of a 7.5 kW motor at s = 2 %

- Mechanical power including friction and fan ≈ 7.5 + 0.1 = 7.6 kW

- M5: $P_{ag} = P_{mech}/(1-s) = 7.6/0.98 = 7.76$ kW · $P_{cu2} = 0.02(7.76) = 0.155$ kW

- If the motor is forced to run at s = 10 % with the same torque, $P_{cu2}$ rises to about 0.78 kW — five times the rotor heating.

## The torque–speed curve and starting current Intermediate

The curves in Figure 4 are computed from the equivalent circuit of the example motor (double-cage rotor, tuned to typical catalogue data). The points to know:

- Locked-rotor torque Ts ≈ 2.2 Tn at n = 0 — must comfortably exceed the load's breakaway torque

- Breakdown (pull-out) torque Tk ≈ 3 Tn at about 85–90 % speed — if the load exceeds this the motor stalls

- Operating region to the right of the breakdown point, where the curve is almost a straight line and torque is proportional to slip

- Starting current ≈ 6.5 In, hardly falling until the speed reaches 80 % — so the whole run-up is a high-current period

Figure 4 · Orange = motor torque, blue = current (right axis), green = pump load, dashed = constant-torque load. Where the motor curve crosses the load curve is the operating point.

M6 Rated current

$$I_n = \frac{P_{out}}{\sqrt{3}\,V_L\,\eta\,\cos\varphi} \qquad P_{in} = \frac{P_{out}}{\eta}$$

M7 Starting current

$$I_{st} = \left(\frac{I_a}{I_n}\right) I_n \qquad \frac{I_a}{I_n} \approx 6\text{–}8$$

M8 Torque versus voltage

$$T(s) \propto V^2 \qquad \frac{T_2}{T_1} = \left(\frac{V_2}{V_1}\right)^2 \qquad I(s) \propto V$$

Example M-3

### Rated current, starting current and the effect of a voltage dip

- M6: $I_n = 7500/(\sqrt3 \times 400 \times 0.904 \times 0.82) = 7500/513.6 = 14.6$ A — matches the nameplate

- $P_{in} = 7.5/0.904 = 8.30$ kW · $S = \sqrt3(400)(14.6) = 10.1$ kVA · $Q = \sqrt{10.1^2 - 8.30^2} = 5.8$ kvar

- M7: $I_{st} = 6.5 \times 14.6 = 95$ A when started direct-on-line

- M8: if the voltage dips to 90 % during starting, the starting torque is $2.2 \times 0.9^2 = 1.78$ Tn and the current $95 \times 0.9 = 86$ A

## Reading the motor nameplate Basic

Figure 5 · Example nameplate: the two voltage lines “400 V Δ / 690 V Y” say that on a 400 V system it must be connected in delta, and that it can be star–delta started

| Field | Meaning | Used for |

| 400 V Δ 14.6 A / 690 V Y 8.4 A | Rated voltage and current for each connection | Choosing the terminal connection, setting the overload |

| 7.5 kW · 1470 r/min · 50 Hz | Mechanical shaft power, speed at rated load | Finding rated torque and slip |

| cos φ 0.82 · IE3 90.4 % | Power factor and efficiency at rated load | Calculating current, kVA, energy cost, PF correction |

| IP55 | Dust (5) and water-jet (5) protection to IEC 60034-5 | Matching the location (IP55 general use, IP56/66 wash-down) |

| IC411 | Cooled by a shaft-mounted fan (TEFC) | Take care at low speed on a VFD |

| Ins.cl. F · ΔT B | Insulation rated 155 °C, but actual temperature rise within class B (130 °C) | A margin for insulation life |

| S1 · Ta 40 °C | Continuous duty, ambient up to 40 °C · altitude up to 1000 m | Plant rooms hotter than 40 °C require derating |

| Ia/In 6.5 · Ta/Tn 2.2 · Tk/Tn 3.0 | Ratios of starting current, starting torque and breakdown torque | Calculating starting current, voltage dip and ability to accelerate |

## Efficiency classes IE1–IE4 and why to choose IE3 or better Intermediate

IEC 60034-30-1 defines efficiency classes IE1 (standard), IE2 (high), IE3 (premium) and IE4 (super premium). Many countries set minimum energy performance standards (MEPS) at IE2 or IE3. The electricity cost over a motor's life is usually tens of times its purchase price, so a difference of only a few percent in efficiency pays off.

| 4-pole 50 Hz | IE1 | IE2 | IE3 | IE4 |

| 7.5 kW | 86.0 % | 88.7 % | 90.4 % | 92.6 % |

| 11 kW | 87.6 % | 89.8 % | 91.4 % | 93.3 % |

Example M-4

### Replacing IE1 with IE3 on a 7.5 kW pump running 6,000 h/year at 4.5 THB/kWh

- $P_{in,IE1} = 7.5/0.860 = 8.72$ kW · $P_{in,IE3} = 7.5/0.904 = 8.30$ kW

- Saving 0.42 kW × 6000 h = 2,520 kWh/year ≈ 11,300 THB/year

- Caution: IE3/IE4 motors have a higher inrush current at start, which is why IEC 60947-4-1 introduced the AC-3e utilisation category for contactors.

## What an electrician must remember on site

- Check the nameplate before every connection: the voltage and connection (Δ/Y) must match the 400 V system

- The no-load current of a 4-pole motor is about 30–50 % of In — that does not mean the motor is faulty

- Measure the current in all three phases; if they differ by more than ~10 %, check for voltage unbalance, contactor contacts and loose terminals

- A normally running motor too hot to touch (60–80 °C on the frame) is normal for class F; measure with a thermometer instead of by hand

## Frequently asked questions

Why does an induction motor turn slower than synchronous speed?
Torque comes from currents induced in the rotor, which requires the rotating field to cut the rotor conductors. If the rotor turned exactly as fast as the field there would be no flux cutting, no current and no torque, so it must always be slower. The difference is the slip, about 1–5 % at rated load.

Why doesn't the high starting current burn out the motor?
The current is high only for the few seconds of acceleration, and the heat accumulated (I²t) is still less than the insulation can take. If the rotor is locked or accelerates too slowly (very high inertia, low voltage), the heating becomes so high that an overload relay of a suitable class must trip first.

Is the power on the nameplate electrical or mechanical?
It is the mechanical power at the shaft (output), per IEC 60034-1. The electrical power drawn from the supply is larger, P/η; for example a 7.5 kW motor with 90.4 % efficiency draws 8.3 kW.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why does an induction motor turn slower than synchronous speed?**
Torque comes from currents induced in the rotor, which requires the rotating field to cut the rotor conductors. If the rotor turned exactly as fast as the field there would be no flux cutting, no current and no torque, so it must always be slower. The difference is the slip, about 1–5 % at rated load.

**Why doesn't the high starting current burn out the motor?**
The current is high only for the few seconds of acceleration, and the heat accumulated (I²t) is still less than the insulation can take. If the rotor is locked or accelerates too slowly (very high inertia, low voltage), the heating becomes so high that an overload relay of a suitable class must trip first.

**Is the power on the nameplate electrical or mechanical?**
It is the mechanical power at the shaft (output), per IEC 60034-1. The electrical power drawn from the supply is larger, P/η; for example a 7.5 kW motor with 90.4 % efficiency draws 8.3 kW.
