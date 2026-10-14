---
title: "Reading Motor Control Diagrams: IEC 60617 Symbols vs NEMA, IEC 81346 Reference Designations, Terminal Numbers, Wire Numbers and Cross-References"
url: https://modsengineeringmath.com/learn/en/motor-control/diagrams-symbols/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> How to read motor control circuit diagrams in the European (IEC), American (NEMA) and Japanese styles: power circuit versus control circuit, symbols for contacts, coils, timers and overload relays, the device letter codes -Q -K -F -S -P -M of IEC 81346, terminal numbers 1/L1 2/T1 A1 A2 13 14 21 22 95 96, wire numbers, terminal strips, cross-page references, and turning relay circuits into Boolean algebra.

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

## Power circuit and control circuit Basic

The power circuit (main circuit) is drawn as three lines L1 L2 L3 running down from the top through the breaker, contactor and overload relay to the motor; you read it top to bottom, following the flow of energy. The control circuit is drawn between an upper rail (L or +24 V) and a lower rail (N or 0 V). Each vertical branch is called a “path” or “current path” and has a column number at the top. Symbols belonging to the same device (e.g. coil -K1 and contact -K1 13-14) may sit in different columns or on different pages; they are tied together by the device designation.

Power circuit: read top → bottom

Control circuit: L rail → devices → coil → N rail

## IEC 60617 symbols Basic

Figure 1 · A dashed line from a contact shows a mechanical link, e.g. a push-button (the square-bracket shape), a float, a pressure switch, or the thermal element of an overload relay.

### Drawing rules you must know

- Contacts are drawn in the “de-energised, not actuated” state — a limit switch that is normally held operated carries a note

- An NO contact is drawn with its blade tilted to the left; an NC contact has a short bar across at the contact point

- The half-circle on a timer contact shows the direction of the delay (like a parachute)

- A solid dot (●) is a junction; lines that cross without a dot are not connected

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

## American (NEMA/ANSI) and Japanese drawings Intermediate

| Item | IEC (Europe · Thailand · ASEAN) | NEMA / JIC (North America) |

| Drawing direction | Rails top and bottom, vertical circuits | Rails left and right, horizontal rungs like a ladder |

| NO contact | Tilted blade | Two parallel lines ─┤ ├─ |

| NC contact | Tilted blade with a bar | Parallel lines with a diagonal ─┤/├─ |

| Coil | Rectangle | Circle with letters M, CR, TR |

| Device codes | -K1 -S1 -F2 | M (motor starter), CR (relay), OL, PB, LS |

| Control voltage | 230 VAC / 24 VDC | 120 VAC from a control transformer / 24 VDC |

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

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**In which state are contacts shown on a diagram?**
In the normal state: no coil energised, no button pressed and no force on any sensor (de-energised, unactuated). NO contacts are therefore drawn open and NC contacts closed, even though in real operation a contactor may be pulled in almost all the time.

**Why do some drawings use K for contactors and others Q?**
The traditional IEC/DIN convention uses K for contactors and relays. The newer IEC 81346-2 places power contactors in class Q (switching of energy flow), e.g. -QA1, and control relays in class K, e.g. -KF1. Both styles appear on real drawings, so check the designation key page of the drawing set.
