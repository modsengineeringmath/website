---
title: "Timers and Counters to IEC 61131-3: TON, TOF, TP, CTU, CTD and CTUD with Timing Diagrams and Real-World Examples"
url: https://modsengineeringmath.com/learn/en/plc/timers-counters/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> The standard timers and counters found in every PLC brand: TON on-delay, TOF off-delay and TP pulse timers, timing diagrams, ET and PT, flasher circuits, a pre-start warning, a fan that runs on after stop, CTU, CTD and CTUD counters for counting parts, resetting, times longer than the maximum preset, accuracy that depends on scan time, high-speed counters, and the equivalent names in Siemens, Mitsubishi and Omron.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/timers-counters/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Timers and Counters to IEC 61131-3: TON, TOF, TP, CTU, CTD and CTUD with Timing Diagrams and Real-World Examples

THภาษาไทยENEnglish

// Chapter 22.4 · PLC · Timers & Counters


Timers and counters are the main reason a PLC pays for itself against a relay panel. One timer in the program replaces a physical timer relay costing tens of dollars, and its time can be set precisely from the HMI. This page uses the names from IEC 61131-3, which is the template for the instructions of every brand.

In 30 seconds

- TON: IN must stay on for the full PT before Q = 1 · TOF: Q stays on for PT after IN goes off · TP: one pulse of length PT per rising edge

- CTU counts rising edges of CU · Q = 1 when CV ≥ PV · R clears it

- Accuracy ≈ ± one scan time

- Very long times: use a minute timer feeding a counter

## The three timer types Basic

Figure 1 · The same input (top row) driving the three timer types with PT = 3 s

T1 TON — on-delay

$$ET = \begin{cases} \min(ET + \Delta t,\ PT) & IN = 1 \\ 0 & IN = 0 \end{cases} \qquad Q = IN \wedge (ET \ge PT)$$

T2 TOF — off-delay

$$Q = IN \vee (ET T3 TP — fixed-length pulse

$$Q = 1 \ \text{during } [t_0,\ t_0 + PT) \text{ after a rising edge of } IN \text{ at } t_0 \ (\text{not retriggered during the pulse})$$

T4 Software timer accuracy

$$PT \le t_{actual} \le PT + t_{scan} + t_{base}$$

Example T-1

### A conveyor that sounds a horn for 5 s before starting, with a cooling fan that runs on for 2 minutes after it stops

- Run command M0.0 (seal-in from START/STOP) · T1 = TON(M0.0, 5s)

- Horn: Q0.1 = M0.0 & !T1 · conveyor: Q0.0 = T1 (runs once the 5 s are up)

- Fan: T2 = TOF(Q0.0, 120s) · Q0.2 = T2 — runs together with the conveyor and stays on for another 2 minutes after the conveyor stops

T5 Flasher from two timers

$$T1 = \text{TON}(EN \wedge \overline{T2},\ t_{on}) \quad T2 = \text{TON}(T1,\ t_{off}) \quad Q = EN \wedge \overline{T1} \quad (T_{period} = t_{on} + t_{off})$$

JavaScript is needed for the simulator

## Counters Basic

Figure 2 · CTU counts only rising edges of CU, so a part that stops in front of the sensor is counted only once

T6 CTU — up counter

$$CV_{k+1} = \begin{cases} 0 & R = 1 \\ CV_k + 1 & P(CU) \\ CV_k & \text{otherwise} \end{cases} \qquad Q = (CV \ge PV)$$

T7 CTD — down counter

$$CV = PV \text{ on LD} \qquad CV_{k+1} = CV_k - 1 \text{ at } P(CD) \qquad Q = (CV \le 0)$$

CTUD combines both in one block (QU and QD). Use it to count how many items are inside an area, such as cars entering and leaving a car park, or parts in a buffer between two machines.

JavaScript is needed for the simulator

Example T-2

### A filter change every 500 running hours, but the maximum timer PT is 24 h

- Create a pulse every hour while the pump runs: T1 = TON(Q0.0 & !T1, 3600s) (resets itself when done)

- Count the pulses: C1 = CTU(T1, I0.5, 500) · I0.5 = reset button pressed after changing the filter

- Warning: Q0.3 = C1 · make C1 retentive so its value is not lost in a power failure

## Names in each brand

| IEC 61131-3 | Siemens S7-1200/1500 | Mitsubishi FX5/iQ | Omron CP/NX |

| TON | TON (IEC_TIMER) | OUT T0 K50 (100 ms) / TON FB | TIM / TON |

| TOF | TOF | TOF FB (or a circuit) | TOF |

| TP | TP | TP FB | TP |

| CTU | CTU | OUT C0 K10 / CTU FB | CNT / CTU |

Older timers in some brands are set as a number of “time-base” units, e.g. K50 on a 100 ms base = 5 s. Always check the time base when moving a program between models.

## High-speed counters Intermediate

A CTU in the program can count at no more than about half the scan rate (it must see 0 for one scan and 1 for one scan). For example, a 10 ms scan counts no faster than ~50 Hz, and the input filter time must be subtracted too. Encoders and high-speed sensors must be wired to the CPU's high-speed counter (HSC) inputs, which count in hardware at tens or hundreds of kHz and support two-phase A/B signals.

T8 Software counter limit

$$f_{max} \approx \frac{1}{2\,(t_{scan} + t_{in})}$$

## Frequently asked questions

How accurate is a PLC timer?
A timer is updated when it is executed in each scan, so its error is about one scan time (plus the resolution of its time base, e.g. 1 ms, 10 ms or 100 ms). That is fine for general work, but if you need millisecond accuracy use a hardware timer, a cyclic-interrupt task or the CPU's pulse outputs.

A timer stops timing when it is in a part of the program that is not called. What is happening?
A software timer only times while its instruction is being executed. If it sits inside a function or a jumped-over section that is not running, it stops timing or freezes its value. Call the timer every scan and control it through its IN input instead.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**How accurate is a PLC timer?**
A timer is updated when it is executed in each scan, so its error is about one scan time (plus the resolution of its time base, e.g. 1 ms, 10 ms or 100 ms). That is fine for general work, but if you need millisecond accuracy use a hardware timer, a cyclic-interrupt task or the CPU's pulse outputs.

**A timer stops timing when it is in a part of the program that is not called. What is happening?**
A software timer only times while its instruction is being executed. If it sits inside a function or a jumped-over section that is not running, it stops timing or freezes its value. Call the timer every scan and control it through its IN input instead.
