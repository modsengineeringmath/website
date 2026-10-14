---
title: "Motor Circuit Design and Installation: Device Selection, Cable Size, Starting Voltage Drop, Control Panels, Testing and a Troubleshooting Table"
url: https://modsengineeringmath.com/learn/en/motor-control/design-installation/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> A 10-step motor circuit design procedure for 400 V 50 Hz systems: deriving power from the load, choosing the motor and starting method, contactor, overload relay, circuit-breaker and breaking capacity, cable size by current and voltage drop (EIT wiring code of Thailand and IEC 60364), earth-fault current at the cable end, IEC 61439 control panels, IP ratings, panel heat and fans, insulation resistance testing, commissioning, maintenance, and a table of fault symptoms with causes.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/design-installation/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Motor Circuit Design and Installation: Device Selection, Cable Size, Starting Voltage Drop, Control Panels, Testing and a Troubleshooting Table

THภาษาไทยENEnglish

// Chapter 21.13 · AC Motor Control · Design, Installation & Troubleshooting


This page brings every previous chapter together into one design job, from the load to commissioning, with what to check on site and a troubleshooting table compiled from the most common symptoms. Every number in the examples can be calculated from the formulas on the page.

In 30 seconds

- Design in order: load → motor → starting method → devices → cable → panel → test

- The cable must pass three checks: current rating, voltage drop (running ≤ 3–5 %, starting ≤ 10–15 %) and earth-fault current at the cable end

- Panel heat: $\Delta T = P/(kA)$ — a drive almost always means a fan is needed

- Before energising: megger ≥ 1 MΩ, check tightness, check phase sequence, test the control circuit on its own

## The 10-step design procedure Basic

Figure 1 · The sequence can loop back — for example, a high starting voltage drop (step 7) may force a change of starting method (step 3)

K1 Shaft power of a pump or a drive

$$P_{pump} = \frac{\rho g Q H}{\eta_p} \qquad P = T\,\omega = \frac{T\,n}{9550}\ \text{(kW)}$$

K2 Motor size margin

$$P_{motor} \ge (1.10\text{–}1.15)\,P_{load,max} \;\rightarrow\; \text{next standard size}$$

## Cable size, voltage drop and fault current at the cable end Intermediate

K3 Cable ampacity after derating

$$I_z\,k_{temp}\,k_{group} \ge I_n \qquad I_z \ge I_r\ (\text{overload protection setting})$$

K4 Running voltage drop

$$\Delta V\% = \frac{\sqrt3\,I_n\,L\,(R\cos\varphi + X\sin\varphi)}{V_L}\times100 \le 3\text{–}5\,\% \qquad R = \frac{\rho}{A},\ \rho_{Cu,70^\circ C} \approx 0.0225\ \Omega\,\text{mm}^2/\text{m}$$

K5 Starting voltage drop

$$\Delta V_{st}\% \approx \Delta V_{tr}\% + \frac{\sqrt3\,I_{st}\,L\,(R\cdot0.3 + X\cdot0.95)}{V_L}\times100 \le 10\text{–}15\,\%$$

K6 Earth fault at the cable end (TN system)

$$I_{f} = \frac{U_0}{Z_s} \ge I_a \qquad Z_s \approx Z_{src} + (1 + m)\,\frac{\rho L}{A_{ph}}\ \ (m = A_{ph}/A_{PE})$$

$U_0$ = 230 V · $I_a$ = the current that makes the protective device disconnect within the time required by the standard (for fixed motor circuits in a TN system usually 5 s; use the magnetic trip value of the MPCB/breaker for instantaneous disconnection). Take Ik and disconnection times from the installation standard that applies in the country concerned.

Example K-1

### A 15 kW 4-pole 400 V pump 50 m from the panel, 315 kVA transformer with uk 4 %, direct-on-line start

- M6: $I_n = 15{,}000/(\sqrt3 \times 400 \times 0.921 \times 0.84) = 28.0$ A · $I_{st} = 7 \times 28 = 196$ A

- L2 (at the transformer): $S_{sc} = 315/0.04 = 7.9$ MVA · $S_{st} = \sqrt3(400)(196) = 136$ kVA → $\Delta U \approx 1.7\,\%$

- K3: 6 mm² cable $I_z \approx 36$ A × 0.87 = 31.3 A ≥ 28 A ✓

- K4: $R = 0.0225/6 = 3.75$ mΩ/m → $\Delta V = \sqrt3(28)(50)(0.00375 \times 0.84 + 0.00008 \times 0.54) = 7.7$ V = 1.9 % ✓

- K5: $\sqrt3(196)(50)(0.00375 \times 0.3 + 0.00008 \times 0.95) = 20.4$ V = 5.1 % + 1.7 % = 6.8 % ✓ → direct-on-line starting is acceptable

- Devices: 32 A AC-3 contactor · 24–32 A MPCB set to 28 A · 6 mm² PE

## Control panels: layout, IP rating and heat Intermediate

Figure 2 · Arrange devices along the energy flow from top to bottom, with wiring ducts between rows and the terminal rail at the bottom near the cable entry

- Low-voltage assemblies are designed and verified to IEC 61439 (the panel builder must verify temperature-rise limits, clearances and the busbar short-circuit rating)

- IP54 for general factory areas, IP55/65 for wash-down or outdoor areas (IEC 60529) — a cut-out for a fan must use a fan-and-filter unit with the same IP rating as the enclosure

- Leave 20–30 % spare space · keep the clearances in the drive manual (100–200 mm above and below for airflow)

K7 Enclosure temperature rise and fan airflow

$$\Delta T = \frac{P_{loss}}{k\,A_e}\ \ (k \approx 5.5\ \text{W/m}^2\text{K painted steel}) \qquad \dot V\,[\text{m}^3/\text{h}] \approx \frac{3.1\,P_{loss}\,[\text{W}]}{\Delta T_{allow}}$$

Example K-2

### A wall-mounted 600 × 800 × 300 mm enclosure containing a 15 kW drive (losses ~2.5 %)

- $P_{loss} \approx 0.025 \times 15{,}000 + 40 = 415$ W (including contactors and the power supply)

- Effective cooling surface (not counting the back against the wall) $A_e \approx 0.6(0.8) + 0.6(0.3) + 2(0.8)(0.3) = 1.14$ m²

- K7: sealed $\Delta T = 415/(5.5 \times 1.14) = 66$ K — in a 35 °C plant room the inside would exceed 100 °C ✗

- Use a fan: allow 10 K above ambient → $\dot V = 3.1(415)/10 = 129$ m³/h → choose a fan-filter unit ≥ 160 m³/h (allowing for a clogged filter)

## Pre-commissioning tests Basic

K8 Insulation resistance acceptance

$$R_{iso} \ge 1\ \text{M}\Omega\ @\ 500\ \text{V DC (IEC 60204-1)} \qquad R_{40^\circ C} \ge 5\ \text{M}\Omega\ \text{windings}

- Visual inspection: devices match the drawings, cable sizes, wire numbers, all covers fitted, no wire offcuts left in the panel

- Tightness: every power terminal torqued to the specified value (paint-mark after tightening)

- Earth continuity: measure the PE resistance from the motor frame to the panel earth bar

- Insulation resistance: disconnect drives, soft starters and electronics first, then test the cable and motor at 500 V DC (K8)

- Control circuit: isolate the power circuit (switch the MPCBs off), supply control power only, and test the sequence, interlocks, timers and emergency stop

- Direction of rotation: uncouple if possible, bump-start briefly and check the direction (a pump run backwards for long can be damaged)

- Live run: measure three-phase currents, voltage, temperature and vibration, compare with the nameplate and record them as the baseline

## Troubleshooting table

| Symptom | Possible causes | What to check |

| Press START and the contactor does not pull in | Blown control fuse · overload still tripped · STOP/E-stop latched · loose wire | Measure voltage point by point from the L rail along the drawing |

| Pulls in while pressed but drops out on release | Self-holding contact (13-14) not wired or faulty | Measure across 13-14 while energised, check the wire in parallel with the START button |

| Contactor hums loudly | Low coil voltage · dirty pole faces · broken shading ring | Measure coil voltage while energised, clean the pole faces |

| Motor hums but does not turn | Lost phase · jammed load · wrongly connected in Y for a heavily loaded 400/690 V motor | Measure three-phase voltage at the motor terminals, turn the shaft by hand (isolate first) |

| Overload trips after a few minutes' running | Genuine overload · wrong setting · low or unbalanced voltage · failed bearing | Measure current against the nameplate, measure voltage, listen to the bearings |

| MPCB trips instantly at start | Short circuit · failed insulation · magnetic setting too low · star–delta changeover timing wrong | Megger, measure winding resistance, note when in the sequence it trips |

| Motor abnormally hot but does not trip | Blocked fan/fins · low-speed running on a VFD · harmonics · high ambient temperature | Measure frame temperature, clean, check the operating frequency |

| Contactor contacts burn out quickly | Undersized · frequent inching (AC-4) · coil not pulling in firmly | Compare the rating with the duty, check operations per hour |

## Preventive maintenance

- Monthly: listen, check temperatures, clean panel fan filters, check pilot lamps

- Every 6 months: infrared thermal scan under load (to find loose connections), measure three-phase currents

- Yearly: re-torque power terminals, inspect contactor contacts, measure insulation resistance and record the trend, test emergency stops

- By running hours: grease bearings as stated on the motor plate, replace the drive cooling fan (often every 3–5 years) and the DC-bus capacitors per the manual

## Frequently asked questions

What is the minimum acceptable insulation resistance for a motor?
For the electrical equipment of machines, IEC 60204-1 requires at least 1 MΩ at 500 V DC between conductors and earth. For low-voltage motor windings, IEEE 43 recommends a minimum of 5 MΩ (corrected to 40 °C), and you should watch the trend against previous readings — a steadily falling value matters more than a single reading.

Can I size a motor cable from current alone?
No. Three things must be checked: the current rating after derating for installation method and temperature, the voltage drop both while running and while starting, and that the earth-fault current at the cable end is high enough for the protective device to disconnect within the required time. Long cables are usually sized by voltage drop, not by current.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the minimum acceptable insulation resistance for a motor?**
For the electrical equipment of machines, IEC 60204-1 requires at least 1 MΩ at 500 V DC between conductors and earth. For low-voltage motor windings, IEEE 43 recommends a minimum of 5 MΩ (corrected to 40 °C), and you should watch the trend against previous readings — a steadily falling value matters more than a single reading.

**Can I size a motor cable from current alone?**
No. Three things must be checked: the current rating after derating for installation method and temperature, the voltage drop both while running and while starting, and that the earth-fault current at the cable end is high enough for the protective device to disconnect within the required time. Long cables are usually sized by voltage drop, not by current.
