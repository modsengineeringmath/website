---
title: "AC Motor Control with Magnetic Contactors and VFDs"
url: https://modsengineeringmath.com/learn/en/motor-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> A complete course on industrial three-phase motor control for 230/400 V 50 Hz systems in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore: induction motor principles, nameplates, star and delta connections, magnetic contactors and overload relays, IEC symbols and drawings, DOL, reversing, a detailed star–delta starter, soft starters, VFDs, design, installation and troubleshooting, with diagrams, calculators and a simulator.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# AC Motor Control with Magnetic Contactors and VFDs

THภาษาไทยENEnglish

// Chapter 21 · AC Motor Control · electrician → student → engineer


Three-phase induction motors use more than half of industrial electricity. This course goes from how the motor turns, through reading the nameplate, connecting star or delta, choosing contactors and overloads and reading drawings, to designing a star–delta starter and setting up a VFD. Every example uses the real 230/400 V 50 Hz supply of Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore. There are formulas with citable IDs and worked examples.

In 30 seconds

- An induction motor turns slightly slower than its field: $n_s = 120f/p$ = 1500 rpm (4-pole, 50 Hz), actual ≈ 1470 rpm

- Direct-on-line starting draws 6–8 × rated current, so voltage dip and the starting method matter

- On 400 V: a 400/690 V motor runs in Δ and can be star–delta started · a 230/400 V motor runs in Y only

- Star–delta cuts current and torque to 1/3 · overload at 0.58 In · needs interlocks and a dead time

- A VFD varies f and V together (V/f): soft start, full torque and pump/fan energy savings

## Learning path by level

Level 1 · electrician · vocational

### Wire it right and safely
Nameplates, Y/Δ terminals, panel devices, self-holding circuits, reversing, star–delta
Connections → Devices → DOL → Star–delta

Level 2 · technician · supervisor

### Select devices and troubleshoot
AC-3 contactor size, overload setting, cable size, voltage drop, VFDs and fault tables
Drawings → VFD setup → Design · faults

Level 3 · engineering student · engineer

### Understand it with mathematics
Equivalent circuit, slip, torque $T \propto V^2$, run-up dynamics $J\,d\omega/dt = T_m - T_L$, V/f and the affinity laws
Induction motor → Starting methods compared → VFD principles

## Try it: start a 7.5 kW motor four ways

Pick a tab, press START and watch the plot: blue is line current, green is speed and orange is torque. Start direct-on-line first, then switch to star–delta and notice the starting current falling to about 1/3 and the current peak at the change to delta. Then raise the load until star can no longer accelerate it, and open the full simulator with worksheets.

JavaScript is needed for the simulator

## Key equations used throughout

H1 Synchronous speed & slip

$$n_s = \frac{120 f}{p} \qquad s = \frac{n_s - n}{n_s}$$

H2 Motor rated current

$$I_n = \frac{P_{out}}{\sqrt{3}\, V_L\, \eta\, \cos\varphi}$$

H3 Star–delta reduction

$$I_{L,Y} = \tfrac{1}{3} I_{L,\Delta} \qquad T_Y = \tfrac{1}{3} T_\Delta \qquad I_{r,OL} = \frac{I_n}{\sqrt{3}} \approx 0.58\, I_n$$

H4 V/f and affinity laws

$$\frac{V}{f} = \frac{400}{50} = 8\ \text{V/Hz} \qquad \frac{P_2}{P_1} = \left(\frac{n_2}{n_1}\right)^3$$

## The supply used in this course: 230/400 V 50 Hz

All seven countries use 50 Hz three-phase four-wire systems with line voltages of 380–415 V, following IEC 60038 (230/400 V). Motor-control gear rated 380–415 V 50 Hz is therefore usable across the region. What differs is the declared site voltage, the earthing system and the utility's connection rules — details in 230/400 V 50 Hz supply.

| Country | Phase / line voltage found on site | Frequency | Notes for motor work |

| Thailand | 230 / 400 V (formerly 220/380 V) | 50 Hz | MEA/PEA · TN-C-S · EIT wiring code |

| Laos | 230 / 400 V (220/380 V also found) | 50 Hz | Grid interconnected with Thailand, IEC equipment |

| Cambodia | 230 / 400 V (220/380 V also found) | 50 Hz | Measure the real voltage before setting a VFD |

| Vietnam | 220 / 380 V | 50 Hz | 400 V motors work; 5 % undervoltage raises current slightly |

| Myanmar | 230 / 400 V | 50 Hz | Voltage varies widely: use voltage and phase relays |

| Malaysia | 230 / 400 V (formerly 240/415 V) | 50 Hz | Much older 415 V-rated equipment still in service |

| Singapore | 230 / 400 V | 50 Hz | Installation to SS 638 (based on IEC 60364) |

“The same standard” means the same voltage level and frequency so equipment is interchangeable — not that every site has the same voltage. Measure the line voltage before setting overloads and drives.

## How to choose a starting method

| Method | Starting current | Starting torque | Speed control | Good for |

| Direct-on-line | 6–8 In | Highest (1.5–2.5 Tn) | No | Small motors, stiff supply, heavy starts |

| Star–delta | ≈ 2–2.7 In | 1/3 of DOL | No | Pumps, fans, compressors starting unloaded |

| Soft starter | 2–4 In (set) | Falls as (I/Is)² | No | Pumps needing a soft stop (water hammer), conveyors |

| VFD | ≤ 1–1.5 In | Up to 1.5 Tn | Yes | Energy-saving pumps and fans, conveyors, process machines |

## Every page in this course

Part 1

### Motors & Low-Voltage Supply
Three-phase induction motor principles, nameplates, the 230/400 V 50 Hz systems of the region, and star/delta terminal connections

n_s21.1
Three-phase induction motors for industry: rotating field, slip, torque–speed curve, starting current and the nameplate
Three-phase induction motors for industry
Rotating field n_s = 120f/p, slip, equivalent circuit, torque–speed curve, 6–8× starting current, IE2–IE4 efficiency (IEC 60034-30-1), reading the nameplate and rated current from kW
Open →Formulas M1, M2, …

400 V21.2
Low-voltage 230/400 V 50 Hz supply in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore: line and phase voltage, earthing systems and their effect on motors
Low-voltage 230/400 V 50 Hz supply in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore
IEC 60038, declared voltages per country from 220/380 to 230/400 V, ±10 % tolerance, TN-C-S and TT earthing, phase sequence, voltage unbalance and 60 Hz motors on 50 Hz
Open →Formulas S1, S2, …

Y/Δ21.3
Star and delta motor connections: the U1 V1 W1 / W2 U2 V2 terminal box, 230/400 V vs 400/690 V motors, and reversing
Star and delta motor connections
Voltage per winding, line vs phase current, terminal-box links, choosing the connection from the nameplate, which motors can be star-delta started, checking rotation and the mistakes that burn motors
Open →Formulas C1, C2, …

Part 2

### Control Devices & Diagrams
AC-3 contactors, overload relays, MPCBs, breakers, timers, push-buttons, IEC 60617 symbols and IEC 81346 device codes

K21.4
Magnetic contactors, overload relays, motor-protection breakers and control devices: AC-3, trip class, timers, push-buttons and pilot lights
Magnetic contactors, overload relays, motor-protection breakers and control devices
Contactor construction, coil, main and auxiliary contacts, utilization categories AC-1 AC-3 AC-4 (IEC 60947-4-1), class 10/20 overloads, MPCBs, aM fuses, Type 1/2 coordination, timers and IEC 60204-1 colours
Open →Formulas D1, D2, …

⊣⊢21.5
Reading motor-control drawings: IEC 60617 vs NEMA symbols, IEC 81346 device codes, terminal markings, wire numbers and cross-references
Reading motor-control drawings
Power vs control circuits, contact, coil and timer symbols, terminal markings 1/L1–2/T1, A1–A2, 13–14, 21–22, device letters -Q -K -F -S -H -M, cross-referencing and European, American and Japanese drawing styles
Open →Formulas G1, G2, …

Part 3

### Starter & Control Circuits
DOL, reversing, a detailed star-delta starter, soft starters and field-proven applied circuits

DOL21.6
Direct-on-line starter: power circuit, self-holding control circuit, two-location control, jogging and step-by-step device selection
Direct-on-line starter
Self-holding (latching) contact, why STOP is a normally-closed button in series, multi-location control, jog, pilot lights, and selecting the MPCB, contactor and cable for a 7.5 kW 400 V motor
Open →Formulas L1, L2, …

⇄21.7
Three-phase motor reversing circuits: swapping two phases, electrical, mechanical and push-button interlocks, and automatic reversing with limit switches
Three-phase motor reversing circuits
Why swapping L1 and L3 reverses rotation, three layers of interlock against a phase-to-phase short, reversing via STOP vs direct, roller doors, hoists, conveyors and limit switches
Open →Formulas R1, R2, …

Y→Δ21.8
The star–delta starter in detail: power and control circuits, 0.58·In contactor sizing, overload setting, timer and changeover time
The star–delta starter in detail
Current and torque reduced to 1/3, contactors KM1 KM2 KM3, overload at 0.58·In, timer setting, Y–Δ dead time, transition current peaks, phase order on the delta side, closed-transition starters and six-wire cabling
Open →Formulas Y1, Y2, …

τm21.9
Star–Delta Analysis: Timer Setting, Star or Delta Operation, Currents, Energy and Numerical Research
Star–Delta Analysis
Timer from the mechanical time constant τm = J·ωs/Tn, dead time and residual voltage, the lagging KM3 order, closed transition, I²t, rotor heat, voltage dip, running in star at light load, case studies, past, present and future, and a dynamic simulation lab
Open →Formulas E1, E2, …

∠α21.10
Soft starters, autotransformer starters and a comparison of motor starting methods: current, torque, voltage dip and cost
Soft starters, autotransformer starters and a comparison of motor starting methods
Thyristor phase-angle control, voltage ramp, current limit, torque control, bypass contactor, soft stop against water hammer, autotransformer starting and a starting-method selection table
Open →Formulas T1, T2, …

⚙21.11
Applied motor-control circuits from real plants: sequence starting, float-switch pumps, duty/standby alternation, pressure-switch compressors, two-speed motors and phase-failure relays
Applied motor-control circuits from real plants
Timed sequence starting, conveyor chains, float or electrode pump control, duty/standby alternation, Hand-Off-Auto, compressors, Dahlander two-speed motors and phase-loss/phase-reversal relays
Open →Formulas A1, A2, …

Part 4

### Variable Frequency Drives
V/f and PWM principles, wiring, parameters, pump and fan energy savings, and applications

V/f21.12
Variable frequency drives for motors: rectifier, DC bus, IGBT PWM, V/f and vector control, and correct wiring
Variable frequency drives for motors
540–565 V DC bus from 400 V, PWM, constant V/f and field weakening, sensorless vector, no contactor or capacitor on the output, shielded cable and EMC, cable length and dv/dt, RCD Type B, braking resistor, and single-phase-in three-phase-out drives
Open →Formulas V1, V2, …

n³21.13
Setting up and applying VFDs: basic parameters, multi-speed, 0–10 V / 4–20 mA, constant-pressure PID pumping and energy savings from the affinity laws
Setting up and applying VFDs
A 12-step commissioning procedure, accel/decel times, command source, preset speeds, analog inputs, constant-pressure pumps, conveyors, fans, P ∝ n³, energy-saving and payback calculation, temperature derating and bypass
Open →Formulas P1, P2, …

Part 5

### Design, Installation & Lab
Device selection, cable sizing, protection coordination, panels, testing, troubleshooting and the starter simulator

✓21.14
Designing and installing motor circuits: breaker selection, cable size, starting voltage dip, control panels, megger testing and a troubleshooting table
Designing and installing motor circuits
A 10-step design procedure, cable sizing for current and voltage drop, Thai EIT wiring code and IEC 60364, IEC 61439 panels, IP rating, panel heat, insulation-resistance testing, loop checks and common faults with causes
Open →Formulas K1, K2, …

▶21.15
Motor starter simulator: DOL, reversing, star–delta, soft starter and VFD with live current, torque, speed and contacts
Motor starter simulator
Press START and STOP and watch power flow through the control circuit, contactors pull in, the timer run and current, torque and speed plotted in real time; inject faults such as overload and phase loss and compare starting methods
Open →Simulator + worksheets

## Search every formula in one place

Prefixes: H overview · M motor · S supply · C connections · D devices · G drawings · L DOL · R reversing · Y star–delta · T soft starters · A applied circuits · V VFD · P VFD applications · K design

## Related on this site

- PLC Automation — every contactor circuit in this course rewritten as ladder logic

- Power factor (Thai) · Power systems & protection (Thai) · VFD harmonics (Thai)

## Standards and references

- IEC 60034-1 (motor ratings) · IEC 60034-8 (terminal markings and rotation) · IEC 60034-30-1 (IE efficiency classes)

- IEC 60947-4-1 (contactors and starters, AC-3, Type 1/2 coordination) · IEC 60947-4-2 (soft starters) · IEC 60947-2 (circuit-breakers)

- IEC 60204-1 (electrical equipment of machines) · IEC 60617 (symbols) · IEC 81346 (reference designations)

- IEC 61800 (adjustable-speed drives) · IEC 60364 / Thai EIT wiring code · IEC 61439 (low-voltage assemblies)

- S. J. Chapman, Electric Machinery Fundamentals · B. K. Bose, Modern Power Electronics and AC Drives · manufacturers' starter selection guides

## Frequently asked questions

Which motors can be star–delta started?
Only motors whose delta voltage on the nameplate equals the supply line voltage. On a 400 V system that is a motor marked 400/690 V Δ/Y (usually 4 kW and above). A 230/400 V Δ/Y motor must run in star on 400 V and cannot be star–delta started.

Can the same equipment be used in Thailand and its neighbours?
In practice yes. Every country covered here uses 50 Hz three-phase four-wire systems with line voltages of 380–415 V (IEC 60038 nominal 230/400 V), so equipment rated 380–415 V 50 Hz fits all of them. Always measure the actual site voltage and check the local utility's rules.

What is the overload setting for a star–delta starter?
When the overload relay sits after the main contactor in the phase-current path (the most common arrangement) set it to 0.58 × the motor In, e.g. 8.5 A for a 14.6 A motor. If it sits in the line-current path before the split, set it to In.

When should I use a VFD instead of star–delta?
When you need variable speed, a soft start with high torque, energy savings on pumps and fans that often run below full flow (P ∝ n³), or when the starting voltage dip is a problem. If you only need to reduce the starting current of a light load at fixed speed, star–delta or a soft starter is cheaper.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Which motors can be star–delta started?**
Only motors whose delta voltage on the nameplate equals the supply line voltage. On a 400 V system that is a motor marked 400/690 V Δ/Y (usually 4 kW and above). A 230/400 V Δ/Y motor must run in star on 400 V and cannot be star–delta started.

**Can the same equipment be used in Thailand and its neighbours?**
In practice yes. Every country covered here uses 50 Hz three-phase four-wire systems with line voltages of 380–415 V (IEC 60038 nominal 230/400 V), so equipment rated 380–415 V 50 Hz fits all of them. Always measure the actual site voltage and check the local utility's rules.

**What is the overload setting for a star–delta starter?**
When the overload relay sits after the main contactor in the phase-current path (the most common arrangement) set it to 0.58 × the motor In, e.g. 8.5 A for a 14.6 A motor. If it sits in the line-current path before the split, set it to In.

**When should I use a VFD instead of star–delta?**
When you need variable speed, a soft start with high torque, energy savings on pumps and fans that often run below full flow (P ∝ n³), or when the starting voltage dip is a problem. If you only need to reduce the starting current of a light load at fixed speed, star–delta or a soft starter is cheaper.
