---
title: "Star and Delta Motor Connections: the U1 V1 W1 / W2 U2 V2 Terminal Box, 230/400 V vs 400/690 V Motors and Reversing"
url: https://modsengineeringmath.com/learn/en/motor-control/motor-connections/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Connect a three-phase motor in star (Y) or delta (Δ) correctly: winding voltage, line versus phase current, placing the copper links in the U1 V1 W1 W2 U2 V2 terminal box to IEC 60034-8, choosing the connection from a 230/400 V or 400/690 V nameplate, which motors can be star–delta started, reversing rotation, and the mistakes that burn motors out.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/motor-connections/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Star and Delta Motor Connections: the U1 V1 W1 / W2 U2 V2 Terminal Box, 230/400 V vs 400/690 V Motors and Reversing

THภาษาไทยENEnglish

// Chapter 21.3 · AC Motor Control · Star & Delta Connections


The mistake that most often burns out a new motor is not in the control circuit — it is connecting the terminals the wrong way. This page explains that star and delta differ in the voltage across each winding, and how to read the nameplate so you choose the right connection for a 400 V system every time.

In 30 seconds

- Y: each winding gets $V_L/\sqrt3$ = 230 V · Δ: each winding gets $V_L$ = 400 V

- A winding is designed for one voltage only — the connection must give it that voltage

- Nameplate 230/400 V Δ/Y → on 400 V connect Y · nameplate 400/690 V Δ/Y → on 400 V connect Δ

- Star–delta starting is only possible for motors that run in Δ at 400 V (400/690 V nameplate)

- To reverse rotation: swap any two phases

## The six-terminal box Basic

A three-phase motor has three windings, each with a start and an end. Under IEC 60034-8 the starts are called U1 V1 W1 and the ends U2 V2 W2 (older motors use U-X, V-Y, W-Z). In the terminal box the top row is U1 V1 W1 and the bottom row is ordered W2 U2 V2. You select Y or Δ by placing copper links.

Figure 1 · Star: one horizontal link joins W2-U2-V2 to form the star point · Delta: three vertical links U1–W2, V1–U2, W1–V2

## How star and delta differ Intermediate

C1 Star (Y)

$$V_{ph} = \frac{V_L}{\sqrt{3}} \qquad I_L = I_{ph}$$

C2 Delta (Δ)

$$V_{ph} = V_L \qquad I_L = \sqrt{3}\, I_{ph}$$

C3 Power in either connection

$$P = 3\,V_{ph}\,I_{ph}\cos\varphi = \sqrt{3}\,V_L\,I_L\cos\varphi$$

C4 Same windings, same supply: Y vs Δ

$$\frac{V_{ph,Y}}{V_{ph,\Delta}} = \frac{1}{\sqrt3} \;\Rightarrow\; \frac{I_{L,Y}}{I_{L,\Delta}} = \frac{1}{3} \qquad \frac{T_Y}{T_\Delta} = \frac{1}{3}$$

Where the 1/3 in C4 comes from: the winding voltage falls by √3, so the winding current falls by √3; in Y the line current equals the winding current, while in Δ the line current is √3 times the winding current. Together that gives $1/(\sqrt3\cdot\sqrt3) = 1/3$. Torque varies with the square of the winding voltage, $(1/\sqrt3)^2 = 1/3$ — this is the basis of the star–delta starter.

Example C-1

### A 7.5 kW motor, nameplate 400 V Δ 14.6 A, connected in delta at 400 V

- C2: the winding current is $I_{ph} = 14.6/\sqrt3 = 8.43$ A at a winding voltage of 400 V.

- If it is connected in Y for starting, each winding gets 230 V: the starting line current is $95/3 = 32$ A (instead of 95 A) and the starting torque is $2.2/3 = 0.73$ Tn.

- The nameplate line 690 V Y 8.4 A confirms this: on a 690 V system in Y, line current = winding current = 8.4 A and each winding still gets 400 V.

## Choosing the connection from the nameplate Basic

The nameplate gives two voltages. The lower one is the line voltage when connected in Δ, the higher one the line voltage when connected in Y; both give the windings the same voltage. The working rule: find the line whose voltage matches the supply, and connect as the symbol on that line says.

Figure 2 · Decision chart for a 400 V 50 Hz system

| Nameplate | Winding voltage | Connection on 400 V | Star–delta possible? | Found on |

| 230/400 V Δ/Y | 230 V | Y | No | Small motors, about ≤ 3 kW (can run from a single-phase 230 V-input VFD when connected in Δ) |

| 400/690 V Δ/Y | 400 V | Δ | Yes | About ≥ 4 kW |

| 400 V Y (3 terminals) | 230 V | Connected at the factory | No | Submersible pumps, hermetic compressors |

| 380 V Δ (old nameplate) | 380 V | Δ | Yes | Older or imported motors |

Danger: some electricians remember “big motors are connected in delta” and connect a large 230/400 V motor in delta. The windings then get 73 % too much voltage and burn out within minutes. Size is not the criterion — only the nameplate is.

Example C-2

### A 2.2 kW pump, nameplate 230/400 V Δ/Y 8.0/4.6 A — where can it be used?

- Three-phase 400 V system: connect Y, line current 4.6 A, set the overload to 4.6 A, and start it direct-on-line or with a soft starter.

- A house with single-phase 230 V: use a VFD with single-phase input and 3-phase 230 V output, and connect the motor in Δ. The drive output current is 8.0 A.

- Never use star–delta on a 400 V system, because in the Δ stage the windings would get 400 V.

## What happens with a wrong connection Intermediate

| Case | Winding voltage | Symptoms | Result |

| 230/400 V connected Δ at 400 V | 173 % | Loud hum, no-load current above In, heats quickly | Insulation breakdown, burn-out |

| 400/690 V connected Y at 400 V | 58 % | Runs normally at no load; under load the speed drops and current is high | Overload trips, or overheating if set wrong |

| One winding reversed (U1–U2 swapped) | Unbalanced | Vibration, noise, very unequal currents | Overheating, no useful torque |

| Star–delta starter but the links were left in | — | Short circuit when the Y or Δ contactor closes | Breaker trips, arcing in the terminal box |

## Direction of rotation and reversing Basic

IEC 60034-8: with L1 L2 L3 connected to U1 V1 W1 in that order, the motor turns clockwise when viewed from the shaft end. Swap any two phases and the phase sequence seen by the motor reverses, the rotating field reverses and the motor turns the other way — the principle of the reversing circuit.

C5 Direction of rotation

$$L1\!\to\!U1,\ L2\!\to\!V1,\ L3\!\to\!W1 \;\Rightarrow\; \text{CW (viewed from shaft end)} \qquad \text{swap 2 lines} \Rightarrow \text{CCW}$$

With star–delta, both the winding starts (U1 V1 W1) and the winding ends (W2 U2 V2) must be swapped consistently. If only one set is swapped, the Y stage turns backwards but the Δ stage is wired wrongly (some windings get the wrong voltage or none at all) and a high current flows at changeover. The correct method is to swap two phases upstream, before they enter the starter.

## Checks before energising

- Read both nameplate lines and note the voltage and connection that match the supply

- Measure the resistance of all three windings with a milliohmmeter (they should differ by no more than about 2 %)

- Measure winding-to-frame insulation resistance with a 500 V DC megger (details in Design · testing)

- Tighten terminal nuts to the specified torque, use correctly sized lugs, and seal the terminal box to maintain its IP rating

- Connect the motor frame earth to the PE terminal in the terminal box

## Frequently asked questions

What happens if a 230/400 V motor is connected in delta on a 400 V supply?
Each winding gets 400 V although it was designed for 230 V (√3 = 1.73 times too much). The iron saturates and the magnetising current is several times normal even at no load. The overload may trip, or, if it is set wrong, the motor burns out within a short time.

Can a 400/690 V motor be connected in star on a 400 V supply?
It will run, but each winding gets only 230 V and the torque at every speed falls to 1/3. With more than about 1/3 of rated load the slip becomes high, the winding current exceeds its rating and the motor overheats. Star is only acceptable as the starting stage of a star–delta starter.

Why are the bottom terminals ordered W2 U2 V2 rather than U2 V2 W2?
Shifting the bottom row by one position (W2 under U1, U2 under V1, V2 under W1) lets the delta links sit straight up and down: U1–W2, V1–U2, W1–V2. Each link joins the end of one winding to the start of the next, which is exactly the delta connection.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What happens if a 230/400 V motor is connected in delta on a 400 V supply?**
Each winding gets 400 V although it was designed for 230 V (√3 = 1.73 times too much). The iron saturates and the magnetising current is several times normal even at no load. The overload may trip, or, if it is set wrong, the motor burns out within a short time.

**Can a 400/690 V motor be connected in star on a 400 V supply?**
It will run, but each winding gets only 230 V and the torque at every speed falls to 1/3. With more than about 1/3 of rated load the slip becomes high, the winding current exceeds its rating and the motor overheats. Star is only acceptable as the starting stage of a star–delta starter.

**Why are the bottom terminals ordered W2 U2 V2 rather than U2 V2 W2?**
Shifting the bottom row by one position (W2 under U1, U2 under V1, V2 under W1) lets the delta links sit straight up and down: U1–W2, V1–U2, W1–V2. Each link joins the end of one winding to the start of the next, which is exactly the delta connection.
