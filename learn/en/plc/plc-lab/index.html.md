---
title: "PLC Ladder Simulator in the Browser: Write Programs, See Power Flow, Timers, Counters and Ready-Made Examples"
url: https://modsengineeringmath.com/learn/en/plc/plc-lab/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> A free PLC simulator with nothing to install: write programs as text (Boolean/ST) and see them drawn as ladder automatically, operate NO and NC push-button and switch inputs, watch power flow through each rung, TON TOF TP timers, CTU counters, SET/RESET, edge detection, adjustable scan time, examples for DOL, reversing, star–delta, a flasher, traffic lights, tank filling with a simulated plant, a parts-counting conveyor, and 8 worksheets.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/plc-lab/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PLC Ladder Simulator in the Browser: Write Programs, See Power Flow, Timers, Counters and Ready-Made Examples

THภาษาไทยENEnglish

// Chapter 22.10 · PLC · Ladder Simulator


Open this page and start programming a PLC straight away. Pick an example from the menu, press the inputs on the left, watch the green lines showing how far power flows, then open “Edit the program” to write your own rungs. The program is drawn as ladder for you automatically.

## Simulator

JavaScript is required to use the simulator

## Program syntax

One line is one rung, written as a Boolean equation similar to Structured Text. Text after # or // is a comment (shown beside the rung).

| Write | Meaning | In ladder |

| Q0.0 = I0.1 & I0.2 | AND | Contacts in series → coil |

| Q0.0 = I0.1 | Q0.0 | OR | Contacts in parallel |

| !I0.2 | NOT | NC contact |

| S Q0.0 = … / R Q0.0 = … | SET / RESET | Coil (S) / (R) |

| P(I0.1) / N(I0.1) | Rising / falling edge | Contact marked P / N |

| T1 = TON(I0.0, 5s) | TON, TOF, TP timers; time in s or ms | TON block T1 · use T1 as its Q contact |

| C1 = CTU(I0.2, I0.3, 6) | Up-counter (count, reset, PV) | CTU block C1 · use C1 as its Q contact |

Variables: I0.0–I1.7 inputs (read-only) · Q0.0–Q1.7 outputs · M0.0–M9.7 memory · T1… C1… · TRUE FALSE · AND OR NOT may be used instead of & | ! · a NOT in front of brackets is distributed with De Morgan's theorem before drawing.

Buttons with a dashed border are NC-wired devices: the input is 1 when not pressed · inputs from the “simulated plant” (water level, part-counting sensor) cannot be pressed; they change with the simulated process.

## 8 worksheets

### 1 · Self-holding
DOL example: delete | Q0.0 and load. Explain the result. Then change I0.0 to !I0.0 and explain why the motor will not run at all.

### 2 · Two-location control
Add STOP2 (I0.3) and START2 (I0.4) buttons to the DOL circuit following the rule STOPs in series, STARTs in parallel (new inputs in the simulator are NO buttons, so write STOP2 as !I0.3).

### 3 · Interlock
Reversing example: press FWD and REV at the same time (two fingers). Which Q turns on? Delete & !Q0.1 and try again. Explain the risk.

### 4 · Dead time
Star–delta example: change T2 to 0ms and watch the simulated plant at the changeover. Then delete & !Q0.1 in the Q0.2 rung.

### 5 · Scan time
Parts-counter example: increase the scan time to 200 ms. Does the counter still count every part? Compare with formula F4.

### 6 · Flasher
Change it to on 0.2 s, off 0.8 s, then make two lamps flash alternately (Q0.0 and Q0.1).

### 7 · Night-mode traffic light
Add a switch I0.1 “night mode” that makes the amber lamps in both directions flash and turns all other lamps off.

### 8 · Tank filling with an alarm
Add a watchdog timer: if the pump runs for more than 20 s without reaching LH, stop the pump and light alarm lamp Q0.3 until RESET (I0.5) is pressed.

## Frequently asked questions

Can this simulator replace a real PLC?
It is good for practising logic, scan order, timers and counters, but it does not simulate hardware, communications or brand-specific instructions. Once you understand the basics, continue with the manufacturer's software, which has its own simulator, or with a real PLC in the lab.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Can this simulator replace a real PLC?**
It is good for practising logic, scan order, timers and counters, but it does not simulate hardware, communications or brand-specific instructions. Once you understand the basics, continue with the manufacturer's software, which has its own simulator, or with a real PLC in the lab.
