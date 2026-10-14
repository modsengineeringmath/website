---
title: "PLC Programming Languages to IEC 61131-3: LD, FBD, ST, SFC and IL — One Program in Several Languages, Data Types and Choosing a Language"
url: https://modsengineeringmath.com/learn/en/plc/iec-languages/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> The standard languages of every PLC brand under IEC 61131-3: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Sequential Function Chart (SFC) and the withdrawn Instruction List (IL). The same motor-control program written in every language, the BOOL, INT, DINT, REAL and TIME data types, literals such as T#5s, functions versus function blocks, building a reusable motor FB, and when to use which language.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/iec-languages/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PLC Programming Languages to IEC 61131-3: LD, FBD, ST, SFC and IL — One Program in Several Languages, Data Types and Choosing a Language

THภาษาไทยENEnglish

// Chapter 22.5 · PLC · IEC 61131-3 Languages


IEC 61131-3 defines five languages for every PLC brand, so that someone who learned on one brand can read another. This page writes the same task — a self-holding motor with a 5-second warning horn — in every language, so you can see what each one is good at.

In 30 seconds

- LD: bit logic that reads like a relay circuit · FBD: wired blocks, suits process control

- ST: a Pascal-like text language, suits calculations, loops, data and state machines

- SFC: steps and transitions, suits sequences · IL: withdrawn in the 2013 edition

- FUNCTION has no memory · FUNCTION_BLOCK has memory (timers, PID)

## One task, five languages Basic

Inputs: STOP (NC), START · outputs: Horn, Conveyor · press START and the horn sounds for 5 s, then the conveyor runs; press STOP and everything stops.

### Ladder Diagram (LD)

I0.0(STOP) I0.1(START) M0.0
──┤ ├────────┬──┤ ├──────┬───────────────────────( )── run command (seal-in)
│ M0.0 │
└──┤ ├──────┘
M0.0 ┌─TON T1──┐
──┤ ├────────────────────────┤IN Q├─────────── time 5 s
T#5s ──┤PT ET├
M0.0 T1 Q0.1
──┤ ├────────┤/├────────────────────────────────( )── horn
T1 Q0.0
──┤ ├───────────────────────────────────────────( )── conveyor

### Function Block Diagram (FBD)

┌──────┐
START ───┤ ≥1 │ ┌──────┐
Run ─────┤ ├──────┤ & ├──── Run
└──────┘ STOP─┤ │
└──────┘
┌─TON───┐ ┌──────┐
Run ─────┤IN Q├──── T1.Q ───────┤ & │
T#5s ───┤PT ET├ Run ─────────┤ ├──── Horn
└───────┘ T1.Q ──o─────┤ │ (o = inverted)
└──────┘
T1.Q ───────────────────────────────────────── Conveyor

### Structured Text (ST)

VAR
Run : BOOL;
T1 : TON;
END_VAR

Run := (PB_Start OR Run) AND PB_Stop_NC; // seal-in
T1(IN := Run, PT := T#5S); // call the timer instance every scan
Horn := Run AND NOT T1.Q;
Conveyor := T1.Q;

### Sequential Function Chart (SFC)

╔════════╗
║ 0 Wait ║
╚═══╤════╝
──┼── START
┌───┴────┐ ┌────────────┐
│ 1 Warn ├───┤ N Horn │
└───┬────┘ └────────────┘
──┼── Step1.T >= T#5s
┌───┴────┐ ┌────────────┐
│ 2 Run ├───┤ N Conveyor │
└───┬────┘ └────────────┘
──┼── NOT PB_Stop_NC
└──────► back to step 0

### Instruction List (IL) — a withdrawn language

LD PB_Start
OR Run
AND PB_Stop_NC
ST Run
IL resembles assembly language. It was removed from the third edition of IEC 61131-3 (2013) but is still found in older programs (Siemens STL, Mitsubishi List).

## Data types and literals Intermediate

| Type | Size | Range | Used for |

| BOOL | 1 bit | FALSE / TRUE | Digital I/O, status |

| INT | 16 bits | −32 768 … 32 767 | Raw analog values, counters |

| DINT | 32 bits | −2 147 483 648 … 2 147 483 647 | Large counters, encoder positions |

| REAL | 32-bit IEEE 754 | ~7 significant digits | Engineering values, PID |

| TIME | 32 bits (ms) | T#0ms … T#24d20h… | Timer presets |

| WORD / DWORD | 16 / 32 bits | Bit patterns | Multi-bit status, Modbus registers |

L1 Signed integer range

$$-2^{n-1} \le x \le 2^{n-1} - 1 \qquad n = 16 \Rightarrow -32768 \ldots 32767$$

L2 Integer pitfalls in scaling

$$\frac{27648 \times 10}{27648} \;\text{(INT overflows at the multiplication)} \qquad \frac{13824}{27648}\times 10 = 0 \;\text{(division truncates before the multiplication)}$$

How to avoid them: convert to REAL before calculating (INT_TO_REAL), or use DINT and multiply before dividing — a scaling example is in Analog · PID.

## Building a reusable motor function block Advanced

A plant with 50 motors should not write the seal-in circuit, feedback check and hour counter 50 times. Build one FB and call 50 instances of it.

FUNCTION_BLOCK FB_Motor
VAR_INPUT Start, Stop_NC, OL_NC, Feedback : BOOL; FbTime : TIME := T#2S; END_VAR
VAR_OUTPUT Run, Fault : BOOL; Hours : REAL; END_VAR
VAR Cmd : BOOL; TFb : TON; THr : TON; END_VAR

Cmd := (Start OR Cmd) AND Stop_NC AND OL_NC AND NOT Fault;
TFb(IN := Cmd XOR Feedback, PT := FbTime); // commanded but no feedback, or feedback without a command
IF TFb.Q THEN Fault := TRUE; END_IF // Fault is reset from the HMI
Run := Cmd;
THr(IN := Feedback AND NOT THr.Q, PT := T#36S); // pulse every 0.01 h
IF THr.Q THEN Hours := Hours + 0.01; END_IF
END_FUNCTION_BLOCK

## Choosing the right language for the job

| Task | Best language | Reason |

| Interlocks, seal-in circuits, safety-related logic | LD | Site technicians can monitor it online and diagnose it at once |

| Process control loops, PID blocks | FBD | Shows the signal flow |

| Calculations, recipes, arrays, strings, communications | ST | Concise, with loops and conditions |

| Machines that work in steps, batch processes | SFC (or ST with CASE) | Shows the active step, so you can see at once which step it is stuck in |

## Frequently asked questions

Should I program a PLC in ladder or Structured Text?
Choose by the job: for on/off logic and interlocks that technicians must read and diagnose on site, ladder is best. For calculations, data handling, recipes, loops and complex state machines, ST is shorter and clearer. Sequences suit SFC. Real projects usually mix languages, wrapping the complex parts in function blocks that are called from ladder.

What is the difference between a function (FUNCTION) and a function block (FUNCTION_BLOCK)?
A function has no memory and always gives the same result for the same inputs, e.g. scaling a value. A function block has internal variables that keep their values from scan to scan and must be instantiated, e.g. timers, counters, PID or a motor-control block.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Should I program a PLC in ladder or Structured Text?**
Choose by the job: for on/off logic and interlocks that technicians must read and diagnose on site, ladder is best. For calculations, data handling, recipes, loops and complex state machines, ST is shorter and clearer. Sequences suit SFC. Real projects usually mix languages, wrapping the complex parts in function blocks that are called from ladder.

**What is the difference between a function (FUNCTION) and a function block (FUNCTION_BLOCK)?**
A function has no memory and always gives the same result for the same inputs, e.g. scaling a value. A function block has internal variables that keep their values from scan to scan and must be instantiated, e.g. timers, counters, PID or a motor-control block.
