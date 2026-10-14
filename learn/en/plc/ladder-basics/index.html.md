---
title: "Ladder Logic Basics: NO and NC Contacts, Coils, AND, OR, Latching, SET/RESET, Edge Detection and Boolean Algebra"
url: https://modsengineeringmath.com/learn/en/plc/ladder-basics/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Learn to write ladder diagrams (Ladder Diagram) for PLCs from scratch: read ladder like a relay circuit, NO and NC contacts, coils, AND, OR and NOT circuits, truth tables, seal-in (latching) circuits, why a STOP button wired NC needs an NO contact in the program, SET and RESET, rising and falling edges, double coils, De Morgan's theorem and the address formats of Siemens, Mitsubishi, Omron and IEC, with a simulator.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/ladder-basics/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Ladder Logic Basics: NO and NC Contacts, Coils, AND, OR, Latching, SET/RESET, Edge Detection and Boolean Algebra

THภาษาไทยENEnglish

// Chapter 22.3 · PLC · Ladder Basics


Ladder logic was designed so that an electrician who can read relay circuits can read a program straight away. The left rail is the “positive supply”, the right rail is “zero”, and each rung is a path along which power can reach the coil if all its contacts are closed. The one thing you must rethink is that a contact in the program tests a bit value, not a button.

In 30 seconds

- ─┤ ├─ NO: conducts when bit = 1 · ─┤/├─ NC: conducts when bit = 0 · ─( )─ coil: writes the result to a bit

- Series = AND · parallel = OR · NC = NOT · every rung is one Boolean equation

- STOP button wired NC → use NO in the program (broken wire = stop)

- Each coil is written in one place only · P/N edge contacts conduct for one scan

## The elements of ladder logic Basic

Figure 1 · Four basic rungs: AND, OR, NOT and a motor seal-in circuit (compare with the contactor circuit in DOL)

B1 AND (series)

$$Y = A \cdot B \qquad \text{ST: } Y := A \text{ AND } B;$$

B2 OR (parallel)

$$Y = A + B \qquad \text{ST: } Y := A \text{ OR } B;$$

B3 NOT (NC contact)

$$Y = \overline{A} \qquad \text{ST: } Y := \text{NOT } A;$$

| A | B | A·B | A+B | Ā | A⊕B |

| 0 | 0 | 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 | 0 | 0 |

B4 De Morgan

$$\overline{A\cdot B} = \overline{A} + \overline{B} \qquad \overline{A + B} = \overline{A}\cdot\overline{B}$$

B4 is needed whenever you want “not both” in ladder, because basic ladder has no NOT in front of a bracket. The simulator on this page uses this rule to convert equations into NO/NC contacts automatically.

B5 XOR (exclusive OR, two-way switch)

$$Y = A\overline{B} + \overline{A}B$$

## A STOP button wired NC and the contact in the program Basic

Figure 2 · The most common beginner's mistake: “the STOP button is NC, so I'll program an NC contact” — the result is that the motor never runs, because bit I0.0 = 1 keeps the NC contact in the program open all the time

B6 Motor latch in a PLC

$$Q0.0 = I0.0_{(\text{STOP, NC})}\cdot(I0.1_{(\text{START})} + Q0.0)\cdot I0.2_{(\text{OL 95-96, NC})}$$

JavaScript is needed for the simulator

In the simulator, inputs with a dashed border are NC buttons: the green light on I0.0 is already lit without pressing anything. Try pressing START, then STOP, and press the overload button to simulate a trip.

## SET, RESET and edge detection Intermediate

A SET coil (─(S)─) makes its bit 1 when the rung is true and holds that value even after the rung goes false. A RESET coil (─(R)─) makes it 0. Used as a pair, they replace a seal-in circuit. A rising-edge contact P conducts for just one scan when its bit changes 0→1; a falling-edge contact N conducts for one scan on 1→0. Use them for counting, toggling a state or issuing a command once per press.

B7 Set/Reset with reset priority (R rung below)

$$Q_{k+1} = (S + Q_k)\cdot\overline{R}$$

B8 Rising edge (one-shot)

$$P(A)_k = A_k\cdot\overline{A_{k-1}} \qquad N(A)_k = \overline{A_k}\cdot A_{k-1}$$

Example B-1

### One button: press for on, press again for off (toggle / flip-flop)

- Create a one-scan pulse: $M0.1 = P(I0.0)$

- If it is off, turn it on: $S\ M0.2 = M0.1\cdot\overline{Q0.1}$ · if it is on, turn it off: $R\ M0.2 = M0.1\cdot Q0.1$

- $Q0.1 = M0.2$ — note that both conditions read the old value of Q0.1 from the previous scan, so it does not switch on and off in the same scan. Try it with the “SET/RESET and edges” example in the simulator.

## Programming rules that prevent bugs Intermediate

- Write each coil in one place only — if it is written on two rungs, the lower rung overwrites the upper one (double coil)

- Use internal memory (M) as an intermediary and write the real outputs (Q) at the end of the program; this makes maintenance easier

- Give every bit a symbolic name (tag), e.g. M1_Run PB_Stop_NC, instead of a bare address

- Comment every rung with “why”, not “what” (the ladder already shows what it does)

- Put safety conditions (STOP, OL, E-stop status) at the far left of the rung, where they are read first

## Frequently asked questions

Is an NC contact in the program the same as an NC button wired in the field?
No. A contact in the program tests a “bit value”, not the state of the button. An NO contact in the program conducts when the bit is 1; an NC contact conducts when the bit is 0. A STOP button wired NC makes its bit 1 in the normal state, so the program must use an NO contact for the rung to work normally and stop when the button is pressed.

Should I use SET/RESET instead of a seal-in circuit?
You can, and it reads well in sequential logic, but watch two things: if SET and RESET are both true at once, whichever is on the lower rung wins; and a SET bit may keep its value through a power failure if it is retentive memory, so the machine restarts by itself when power returns. For ordinary motor control the classic seal-in circuit is safer because it drops out by itself on STOP.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Is an NC contact in the program the same as an NC button wired in the field?**
No. A contact in the program tests a “bit value”, not the state of the button. An NO contact in the program conducts when the bit is 1; an NC contact conducts when the bit is 0. A STOP button wired NC makes its bit 1 in the normal state, so the program must use an NO contact for the rung to work normally and stop when the button is pressed.

**Should I use SET/RESET instead of a seal-in circuit?**
You can, and it reads well in sequential logic, but watch two things: if SET and RESET are both true at once, whichever is on the lower rung wins; and a SET bit may keep its value through a power failure if it is retentive memory, so the machine restarts by itself when power returns. For ordinary motor control the classic seal-in circuit is safer because it drops out by itself on STOP.
