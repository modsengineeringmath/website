---
title: "PLC Automation"
url: https://modsengineeringmath.com/learn/en/plc/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> A complete PLC course: what a PLC is, the scan cycle, input and output wiring with PNP, NPN, sinking and sourcing, ladder diagrams, timers, counters, the IEC 61131-3 languages (LD, FBD, ST, SFC), DOL, reversing and star–delta motor control, sequential control, 4–20 mA analog and PID, commanding VFDs over Modbus, commissioning and machine safety, with an in-browser ladder simulator.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PLC Automation

THภาษาไทยENEnglish

// Chapter 22 · PLC Automation · electrician → student → engineer


A PLC (Programmable Logic Controller) replaces panels of hundreds of relays with a program you can edit. This course runs from how a PLC scans, through wiring PNP/NPN sensors correctly, writing ladder logic, timers and counters, to motor control, star–delta, sequential systems, analog and PID, and commanding VFDs. Every example can be tried straight away in the simulator on the page. There are formulas with citable IDs and worked examples.

In 30 seconds

- A PLC repeats three things every few milliseconds: read inputs → run the program → write outputs

- Ladder: series = AND · parallel = OR · NC = NOT · a self-holding rung works like a contactor

- A PNP sensor pairs with a sinking input (COM to 0 V) · NPN pairs with sourcing

- STOP and emergency-stop buttons are wired NC, and critical interlocks must stay in hardware

- IEC 61131-3 timers TON, TOF, TP and counters CTU, CTD work on every brand

## Learning path by level

Level 1 · electrician · vocational

### Wire it and write ladder logic
What a PLC is, I/O wiring, ladder, self-holding, timers, counters
Fundamentals → I/O wiring → Ladder → Timers

Level 2 · technician · programmer

### Real factory work
Motor control, sequential control, analog, commanding VFDs, commissioning
Motor control → Sequential control → Analog · PID

Level 3 · engineering student · engineer

### System-level design
Boolean algebra, state machines, SFC, ST, response time, discrete PID, functional safety
IEC 61131-3 → SFC → Safety

## Try it: a star–delta PLC in your browser

Press START (I0.1) and watch the green power flow through the ladder. Timer T1 counts 6 seconds, K2 (star) drops out, there is an 80 ms dead time, then K3 (delta) pulls in. Choose another example from the menu, or open “Edit the program” to write your own. The full simulator with worksheets is at Ladder simulator.

JavaScript is needed for the simulator

## Key equations used throughout

H1 Worst-case response

$$t_{resp,max} \approx t_{in} + 2\,t_{scan} + t_{out}$$

H2 Latch rung

$$Q = \overline{\text{STOP}}\cdot(\text{START} + Q) \;\;\equiv\;\; \text{STOP wired NC → NO contact in the program}$$

H3 On-delay timer

$$Q_{TON} = IN \wedge (ET \ge PT) \qquad ET \le PT$$

H4 Analog scaling

$$y = y_{min} + (x - x_{min})\,\frac{y_{max} - y_{min}}{x_{max} - x_{min}}$$

## PLCs found in the region and their address notation

| Brand (example models) | Input | Output | Memory | Software |

| IEC 61131-3 (standard) | %IX0.0 | %QX0.0 | %MX0.0 | CODESYS and others |

| Siemens (S7-1200/1500) | I0.0 | Q0.0 | M0.0 | TIA Portal |

| Mitsubishi (FX5U, iQ-R) | X0 | Y0 | M0 | GX Works3 |

| Omron (CP1, NX/NJ) | 0.00 | 100.00 | W0.00 | CX-Programmer / Sysmac Studio |

| Delta (DVP, AS) | X0 | Y0 | M0 | ISPSoft |

| Rockwell (Micro800, CompactLogix) | _IO_EM_DI_00 / tag | _IO_EM_DO_00 / tag | tag | CCW / Studio 5000 |

This course uses Siemens-style I0.0 / Q0.0 / M0.0 addresses because they are easy to read and translate directly to other brands.

## Every page in this course

Part 1

### PLC Basics & Hardware
What a PLC is, its architecture, the scan cycle, IEC 61131 and PNP/NPN input-output wiring

CPU22.1
What a PLC is: CPU, memory and I/O architecture, the scan cycle, scan time, IEC 61131 and choosing a PLC
What a PLC is
From relays to PLCs, architecture, the input–program–output scan, scan and response time, compact, modular and safety PLCs, PLC vs relays vs microcontrollers, and brands used in the region
Open →Formulas F1, F2, …

24V22.2
Wiring PLC inputs and outputs: sinking and sourcing, PNP/NPN sensors, relay vs transistor outputs, inductive loads and the 24 VDC supply
Wiring PLC inputs and outputs
24 VDC inputs per IEC 61131-2, sink vs source, 3-wire PNP/NPN and 2-wire sensors, relay, transistor and triac outputs, diodes and RC snubbers, interposing relays, 4–20 mA analog and power-supply sizing
Open →Formulas W1, W2, …

Part 2

### Programming
Ladder logic, timers, counters and the five IEC 61131-3 languages, with the same program in several languages

┤├22.3
Ladder diagram basics: NO and NC contacts, coils, AND, OR, self-holding, SET/RESET, edges and Boolean algebra
Ladder diagram basics
Reading ladder like a relay circuit, truth tables, why a STOP button wired NC is programmed with an NO contact, double coils, rising and falling edges, and Mitsubishi, Omron, Siemens and IEC addressing
Open →Formulas B1, B2, …

TON22.4
IEC 61131-3 timers and counters: TON, TOF, TP, CTU, CTD and CTUD with timing diagrams and real examples
IEC 61131-3 timers and counters
On-delay, off-delay, pulse, flasher circuits, part counting, reset, high-speed counters and scan-time pitfalls
Open →Formulas T1, T2, …

ST22.5
PLC programming languages in IEC 61131-3: LD, FBD, ST, SFC and IL — one program in several languages, data types and when to use which
PLC programming languages in IEC 61131-3
Ladder, function block diagram, Structured Text and Sequential Function Chart, data types BOOL INT REAL TIME, user function blocks, and choosing a language
Open →Formulas L1, L2, …

Part 3

### Industrial Applications
Motor control with a PLC, sequential control, analog and PID, and commanding a VFD

M22.6
Motor control with a PLC: DOL, reversing, star–delta, I/O lists, wiring, hard-wired interlocks and contactor feedback monitoring
Motor control with a PLC
Translating contactor circuits into ladder and ST, what must stay in hardware, overload inputs, detecting welded contactors, and a complete PLC star–delta drawing
Open →Formulas M1, M2, …

SFC22.7
Sequential control: state machines, SFC/GRAFCET, traffic lights, sorting conveyors and batch mixing tanks
Sequential control
Designing with state diagrams, steps and transitions, implementing in ladder with SET/RESET and in ST with CASE, auto/manual modes, emergency stop and homing
Open →Formulas S1, S2, …

PID22.8
Analog, PID and commanding VFDs from a PLC: 4–20 mA scaling, the PID block, constant-pressure pumping and Modbus RTU
Analog, PID and commanding VFDs from a PLC
Scaling raw counts to engineering units, wire-break detection, positional PID and tuning, commanding a VFD by digital, analog and Modbus RTU, with a sample register map
Open →Formulas P1, P2, …

Part 4

### Commissioning, Safety & Lab
Commissioning procedure, machine safety, troubleshooting and an in-browser ladder simulator

⚠22.9
PLC commissioning, machine safety and troubleshooting: loop checks, forcing, emergency stop, IEC 60204-1, ISO 13849 and documentation
PLC commissioning, machine safety and troubleshooting
Pre-power checks, point-by-point I/O tests, the dangers of forcing, stop categories 0/1/2, safety relays, PL and SIL, program backups and a troubleshooting flow
Open →Formulas K1, K2, …

▶22.10
In-browser PLC ladder simulator: write a program, watch power flow, timers and counters, with ready-made examples
In-browser PLC ladder simulator
Edit the program as text, see it drawn as ladder automatically, toggle inputs and watch the scan, TON TOF CTU SET RESET and edges, with DOL, reversing, star–delta, traffic light and tank examples and worksheets
Open →Simulator + worksheets

## Search every formula in one place

Prefixes: H overview · F fundamentals · W I/O wiring · B ladder · T timers/counters · L languages · M motors · S sequential · P analog/PID · K commissioning/safety

## Related on this site

- AC Motor Control — every contactor circuit that this course rewrites as ladder logic

- 4–20 mA signals and HART (Thai) · Modbus RTU/TCP (Thai) · Virtual instrumentation lab with a PLC (Thai)

- Control systems: PID (Thai) — the theory behind the PLC's PID block

## Standards and references

- IEC 61131-1 (overview) · IEC 61131-2 (hardware, 24 VDC input types) · IEC 61131-3 (programming languages)

- IEC 60204-1 (electrical equipment of machines, stop categories) · ISO 13849-1 / IEC 62061 (functional safety of machinery)

- IEC 60848 (GRAFCET) · Modbus Application Protocol Specification (Modbus Organization)

- F. D. Petruzella, Programmable Logic Controllers · W. Bolton, Programmable Logic Controllers · PLC manufacturers' manuals

## Frequently asked questions

What should I know before learning PLCs?
You should understand contactor control circuits (self-holding, interlocks, timers), because ladder logic is designed to read like a relay circuit, and basic 24 VDC and 230 VAC electrics so you can wire I/O correctly. All of this is covered in the motor-control course on this site.

Which PLC brand should I start with?
The principles are the same for every brand because they follow IEC 61131. Choose a brand used in the factories or schools near you, and one with free software and a simulator. In this region Mitsubishi, Omron, Siemens, Delta, Schneider, Rockwell and Keyence are common.

How is a PLC different from an Arduino or a microcontroller?
A PLC is designed for the factory environment: noise-immune, isolated 24 VDC I/O, a predictable scan, self-diagnostics, standardised languages, modules that can be serviced and replaced in use, and certification to industrial standards. A microcontroller is more flexible and cheaper, but the user has to build all that robustness themselves.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What should I know before learning PLCs?**
You should understand contactor control circuits (self-holding, interlocks, timers), because ladder logic is designed to read like a relay circuit, and basic 24 VDC and 230 VAC electrics so you can wire I/O correctly. All of this is covered in the motor-control course on this site.

**Which PLC brand should I start with?**
The principles are the same for every brand because they follow IEC 61131. Choose a brand used in the factories or schools near you, and one with free software and a simulator. In this region Mitsubishi, Omron, Siemens, Delta, Schneider, Rockwell and Keyence are common.

**How is a PLC different from an Arduino or a microcontroller?**
A PLC is designed for the factory environment: noise-immune, isolated 24 VDC I/O, a predictable scan, self-diagnostics, standardised languages, modules that can be serviced and replaced in use, and certification to industrial standards. A microcontroller is more flexible and cheaper, but the user has to build all that robustness themselves.
