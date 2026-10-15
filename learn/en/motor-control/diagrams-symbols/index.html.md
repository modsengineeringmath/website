---
title: "Reading Motor Control Diagrams: IEC 60617 Symbols vs NEMA, IEC 81346 Reference Designations, Terminal Numbers, Wire Numbers and Cross-References"
url: https://modsengineeringmath.com/learn/en/motor-control/diagrams-symbols/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-15
---

> How to read motor control circuit diagrams in the European (IEC), American (NEMA) and Japanese styles: power circuit versus control circuit, symbols for contacts, coils, timers and overload relays, the device letter codes -Q -K -F -S -P -M of IEC 81346, terminal numbers 1/L1 2/T1 A1 A2 13 14 21 22 95 96, wire numbers, terminal strips, cross-page references, and turning relay circuits into Boolean algebra. Adds IEC and ANSI/NEMA single-line diagrams, NEMA/JIC ladder diagrams, the NEMA starter size table and an IEC-to-NEMA device-code comparison.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/diagrams-symbols/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Reading Motor Control Diagrams: IEC 60617 Symbols vs NEMA, IEC 81346 Reference Designations, Terminal Numbers, Wire Numbers and Cross-References

THภาษาไทยENEnglish

// Chapter 21.5 · AC Motor Control · Symbols & Reading Diagrams


A circuit diagram is the common language of the designer, the panel builder and the maintenance technician. If you read it fluently you will wire it right the first time and find faults from the drawing without tearing the panel apart. This page teaches you to read drawings in the IEC convention used throughout this series, and compares them with the American style found on imported machines.

In 30 seconds

- A drawing has two parts: the power circuit (400 V to the motor) and the control circuit (230 VAC/24 VDC to the coils)

- Contacts are always drawn in the normal state (de-energised, not actuated)

- Series = AND · parallel = OR · NC = NOT — you can read a control circuit as logic straight away

- Device designation + terminal number, e.g. “-K1:13”, identifies a connection point uniquely in the whole panel

- A single-line diagram shows the whole system · NEMA drawings are read as left-to-right ladders with rung numbers under the coil

## Power circuit and control circuit Basic

The power circuit (main circuit) is drawn as three lines L1 L2 L3 running down from the top through the breaker, contactor and overload relay to the motor; you read it top to bottom, following the flow of energy. The control circuit is drawn between an upper rail (L or +24 V) and a lower rail (N or 0 V). Each vertical branch is called a “path” or “current path” and has a column number at the top. Symbols belonging to the same device (e.g. coil -K1 and contact -K1 13-14) may sit in different columns or on different pages; they are tied together by the device designation.

Power circuit: read top → bottom

Control circuit: L rail → devices → coil → N rail

### What an IEC 60204-1 control schematic contains

- Column numbers 1 2 3 … above the L1 rail locate every device, with a function text (e.g. “hold-in”) under the N rail

- The box under a coil is the contact cross-reference (contact mirror): its NO / NC rows give the column of each contact of that coil; “PWR” = the power poles sit in the power circuit

- Coils on the N rail with all contacts on the L side: an earth fault between a contact and the coil cannot pick the coil up (IEC 60204-1 clause 9.4.3)

- Fuse -F3 protects the control circuit · overload contact -F2 95-96 (NC) is in series with the coil · 97-98 (NO) signals the trip

- IEC 60204-1 lamp codes GN green = normal/running · YE yellow = abnormal (trip) · RD red = danger/emergency · BU blue = action required · WH white = general status

- Power circuit: green-yellow dash-dot = PE conductor bonded to the motor frame · short dashes between poles = mechanical coupling · the overload is a bimetal element per phase linked to contact 95-96

## The single-line (one-line) diagram Intermediate

A single-line diagram is the “map” of an electrical system: one line stands for all three phases (three oblique strokes show three conductors) and the sheet shows sources, transformers, busbars, feeders, protective devices, starters and motors with their ratings — but no control circuits, terminal numbers or internal wiring. It is used to check protection coordination, calculate fault levels and plan extensions.

Figure 2 · Single-line diagram with IEC 60617 symbols: 22/0.4 kV Dyn11 transformer → ACB → MDB busbar → DOL feeder (MPCB + contactor + overload), soft-starter and VFD feeders (figures are illustrative)

### Read it top to bottom

- Source and transformer — voltage, frequency, rating (kVA), uk %, vector group (Dyn11) and neutral earthing (TN-S)

- Main breaker (ACB) — rated current and breaking capacity Icu, which must exceed the prospective fault current at the bus

- CT and meters — the circle around the line is the current transformer feeding an ammeter or power meter

- Busbar — the thick line: 3N~ 400/230 V · every feeder branches from it

- Motor feeders — breaker/MPCB → starter (contactor + overload, soft starter or VFD) → cable (size, cores, shield) → motor (kW, current)

Figure 3 · American one-line diagram (ANSI/IEEE 315): breakers are boxes on the line, ANSI/IEEE C37.2 device numbers (52 = AC circuit breaker, 49 = thermal overload), NEMA size 1 starter and FLA taken from NEC Table 430.250

| Drawing | Shows | Used for |

| Single-line | The whole system, one line per three phases, with ratings | Protection coordination, fault levels, expansion |

| Power circuit (multi-line) | Every conductor of one feeder: L1 L2 L3 PE, terminal numbers, motor leads | Panel wiring, phase rotation |

| Control schematic | Coils, contacts, buttons, sensors between rails L–N (IEC) or X1–X2 (NEMA) | Control logic, fault finding |

### What a good single-line diagram must show

- Voltage, frequency, system earthing (TN-S, TN-C-S, TT, IT) and the fault level at the bus (kA)

- Type, rating and Icu of every breaker · fuses · protection-relay settings

- Cable size, cores, material and length (for voltage drop and fault checks)

- Motors: kW or hp, rated current, starting method and device codes that match the control schematic (-Q1 -K1 -F2 -M1 or DISC M OL MTR)

- The symbol standard used (IEC 60617/81346 or ANSI/IEEE 315/NEMA), stated in the drawing legend

## IEC 60617 symbols Basic

Figure 1 · A dashed line from a contact shows a mechanical link, e.g. a push-button (the square-bracket shape), a float, a pressure switch, or the thermal element of an overload relay.

### Drawing rules you must know

- Contacts are drawn in the “de-energised, not actuated” state — a limit switch that is normally held operated carries a note

- An NO contact is drawn with its blade tilted to the left; an NC contact has a short bar across at the contact point

- The half-circle on a timer contact shows the direction of the delay (like a parachute)

- A solid dot (●) is a junction; lines that cross without a dot are not connected

- A fuse is a rectangle with the conductor running through it · a contactor pole has a small bow at the contact · a circuit-breaker has a cross at the blade tip · an isolator has a bar across the blade tip

- Dashed lines are mechanical links between poles or devices — the three poles of a contactor, a breaker’s trip unit, or the mechanical interlock between coils -K1 and -K2

## Device designations and terminal numbers Intermediate

| Traditional code (used in this series) | New IEC 81346-2 (examples) | Device |

| -Q | -QA | MPCB, isolating switch (and power contactors in the new edition) |

| -K | -QA (contactor) · -KF (relay, timer, PLC) | Contactors, relays, timers |

| -F | -FC | Fuses, overload relays, protective devices |

| -S | -SF | Push-buttons, selector switches (operated by a person) |

| -B | -BG -BP -BL | Sensors, limit switches, pressure switches, floats |

| -P / -H | -PF -PG | Pilot lights, meters |

| -M | -MA | Motors |

| -X | -XD | Terminal strips |

| -T | -TA | Transformers, power supplies (the new edition uses T for energy conversion) |

A terminal number is always read together with the designation: “-K1:A1” is the coil terminal of contactor K1, “-X1:5” is terminal 5 of terminal strip X1. Wire numbers on drawings are often based on page and column number (e.g. wire 2.4 is a wire on page 2, column 4), which makes it practical to trace wires inside the panel.

### Cross-reference tables

Under each coil on an IEC drawing there is usually a small table showing where its contacts are, for example

-K1
1-2 │ 3.2 ← main contact, page 3 column 2
13-14 │ 4.3 ← NO used for self-holding, page 4 column 3
21-22 │ 4.6 ← NC used for interlocking, page 4 column 6
43-44 │ 4.8 ← NO for the run lamp

## Reading a control circuit as logic Intermediate

Current reaches a coil when there is at least one path on which every contact is closed, so the circuit can be written as Boolean algebra. This is the foundation of ladder programming in a PLC.

G1 Series = AND

$$K = A \cdot B$$

G2 Parallel = OR

$$K = A + B$$

G3 NC contact = NOT

$$K = \overline{A}$$

G4 Self-holding (seal-in)

$$K1 = \overline{S0}\cdot\overline{F2}\cdot(S1 + K1)$$

Example G-1

### Read the DOL circuit as an equation

- A single path from the L rail: F2 (95-96, NC) → S0 (NC) → [S1 (NO) in parallel with K1 13-14] → coil K1

- Replace each NC with NOT of “actuated”: $K1 = \overline{F2}\cdot\overline{S0}\cdot(S1 + K1)$ — identical to G4

- Check: press S1 → K1 = 1 · release S1 → the K1 term holds it · press S0 or F2 trips → K1 = 0, and it does not come back by itself when released

## American (NEMA/JIC) and Japanese drawings Intermediate

In North America motor drawings follow NEMA ICS 19 (designations and symbols), NEMA ICS 2 (contactors, starters and NEMA sizes), NFPA 79 / JIC (electrical equipment of industrial machinery) and the NEC (installation); symbols come from ANSI Y32.2 / IEEE 315. The sheet below is the symbol set used in this series’ ladder diagrams.

Figure 4 · NEMA/JIC symbols: contacts are parallel bars, NO ┤ ├ and NC ┤/├ · coils and lamps are circles with letters · overload heaters are zig-zags · power poles are two short bars across the line

| Item | IEC (Europe · Thailand · ASEAN) | NEMA / JIC (North America) |

| Drawing direction | Rails top and bottom, vertical circuits · columns 1 2 3 | Rails left and right (X1 · X2), horizontal rungs like a ladder · rung numbers 1 2 3 |

| NO / NC contact | Tilted blade / blade with a bar | Two parallel bars ─┤ ├─ / with a diagonal ─┤/├─ |

| Coil | Rectangle A1–A2 | Circle with letters M, CR, TR (no terminal numbers) |

| Device codes | -K1 -S1 -F2 -P1 -M1 | M · CR · TR · OL · PB · FU · PL · MTR |

| Power-pole terminals | 1/L1 2/T1 3/L2 4/T2 5/L3 6/T3 | L1 L2 L3 → T1 T2 T3 |

| Six-lead motor terminals | U1 V1 W1 U2 V2 W2 | T1 T2 T3 T4 T5 T6 (U1=T1 V1=T2 W1=T3 U2=T4 V2=T5 W2=T6) |

| Overload | Relay -F2 95-96 at the head of the coil circuit | OL heaters in the power circuit · OL contact (NC) next to the coil, near rail X2 |

| Control voltage | 230 VAC / 24 VDC | 120 VAC from a control transformer (X2 grounded) / 24 VDC |

| Cross-reference | Box under the coil gives the NO/NC columns | Rung numbers under the coil · underlined = NC |

| Wire numbers / colours | By sheet and column · green-yellow = PE | One number per node · NFPA 79: black = power, red = AC control, white = grounded (X2), green = ground |

| Starter sizing | Rating by utilisation category AC-3 (kW, A) | NEMA size 00–9 by hp at that voltage (table below) |

### Reading a NEMA ladder

- Read left to right: buttons and contacts on the left, loads on the right — coil M sits at the far right with OL, next to the grounded rail X2 (the same idea as IEC’s “coil on N”)

- Rung numbers outside rail X1 · wire numbers on the lines: one number per electrical node

- Numbers under a coil list the rungs that carry its contacts — underlined = NC, e.g. “1 2 3” = NO on rungs 1 and 2, NC on rung 3

- Contacts carry no terminal numbers such as 13-14: they are identified by device name (M, CR1, TR) · timer contacts state their type NOTC / NCTO (on-delay) or NOTO / NCTC (off-delay)

- Full examples with the power circuit: direct on line · reversing · wye–delta

### IEC ↔ NEMA device codes

| Device | IEC | NEMA / JIC |

| Breaker / MPCB | -Q1 | CB · MCP · DISC |

| Contactor / starter | -K1 (-QA1) | M · F · R · 1M 2M 1S |

| Control relay · timer | -K2 · -K4T | CR · TR |

| Overload | -F2 (95-96) | OL |

| Fuse | -F1 -F3 | FU |

| START / STOP buttons | -S1 / -S0 | START / STOP (PB) |

| Limit · pressure · float | -B1 -B2 -B3 | LS · PS · FS |

| Pilot light | -P1 (GN, RD) | PL (G, R, A, W) |

| Control transformer | -T1 | CT / CPT (H1–H4, X1–X2) |

| Motor | -M1 (U1 V1 W1) | MTR (T1 T2 T3) |

### NEMA starter sizes (ICS 2)

| NEMA size | Continuous (A) | Max hp at 230 V | Max hp at 460 V |

| 00 | 9 | 1.5 | 2 |

| 0 | 18 | 3 | 5 |

| 1 | 27 | 7.5 | 10 |

| 2 | 45 | 15 | 25 |

| 3 | 90 | 30 | 50 |

| 4 | 135 | 50 | 100 |

| 5 | 270 | 100 | 200 |

The hp figures are maxima for full-voltage, non-plugging duty — check the manufacturer’s catalogue and NEMA ICS 2 before selecting. A NEMA size is chosen from the hp, not the measured current, whereas an IEC contactor is chosen from current and utilisation category AC-3.

Current Japanese drawings use JIS C 0617, which matches IEC 60617, but older machines still carry the former symbols. Ladder diagrams in every brand of PLC are drawn horizontally, much like NEMA.

## Reading a drawing to find a fault

- Start at the motor/load with the problem and find its device designation in the power circuit (e.g. -K3)

- Find coil -K3 in the control circuit, then work down from the L rail one device at a time

- Measure the voltage to the N rail point by point; the first point with “no voltage” lies after the device that is open

- Use the cross-reference table to see which device the open contact (e.g. -K2 21-22) belongs to, and follow it from there

## Frequently asked questions

In which state are contacts shown on a diagram?
In the normal state: no coil energised, no button pressed and no force on any sensor (de-energised, unactuated). NO contacts are therefore drawn open and NC contacts closed, even though in real operation a contactor may be pulled in almost all the time.

Why do some drawings use K for contactors and others Q?
The traditional IEC/DIN convention uses K for contactors and relays. The newer IEC 81346-2 places power contactors in class Q (switching of energy flow), e.g. -QA1, and control relays in class K, e.g. -KF1. Both styles appear on real drawings, so check the designation key page of the drawing set.

How is a single-line diagram different from a power circuit?
A single-line diagram draws one line for all three phases and covers the whole system (source, transformer, busbar, feeders, protection, motors) with ratings. A power circuit shows every conductor and terminal number of one feeder and is used for panel wiring.

Why do NEMA drawings have no terminal numbers like 13-14 or 95-96?
NEMA/JIC identifies contacts by device name (M, CR, TR, OL) and by wire numbers on the lines instead of IEC 60947 auxiliary-contact numbers. Power poles are L1 L2 L3 → T1 T2 T3, and contact locations are read from the rung numbers under the coil (underlined = NC).

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**In which state are contacts shown on a diagram?**
In the normal state: no coil energised, no button pressed and no force on any sensor (de-energised, unactuated). NO contacts are therefore drawn open and NC contacts closed, even though in real operation a contactor may be pulled in almost all the time.

**Why do some drawings use K for contactors and others Q?**
The traditional IEC/DIN convention uses K for contactors and relays. The newer IEC 81346-2 places power contactors in class Q (switching of energy flow), e.g. -QA1, and control relays in class K, e.g. -KF1. Both styles appear on real drawings, so check the designation key page of the drawing set.

**How is a single-line diagram different from a power circuit?**
A single-line diagram draws one line for all three phases and covers the whole system (source, transformer, busbar, feeders, protection, motors) with ratings. A power circuit shows every conductor and terminal number of one feeder and is used for panel wiring.

**Why do NEMA drawings have no terminal numbers like 13-14 or 95-96?**
NEMA/JIC identifies contacts by device name (M, CR, TR, OL) and by wire numbers on the lines instead of IEC 60947 auxiliary-contact numbers. Power poles are L1 L2 L3 → T1 T2 T3, and contact locations are read from the rung numbers under the coil (underlined = NC).
