---
title: "What Is a PLC: CPU, Memory, I/O, the Scan Cycle, Scan Time, the IEC 61131 Standard and Choosing a PLC"
url: https://modsengineeringmath.com/learn/en/plc/plc-fundamentals/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> PLC (Programmable Logic Controller) fundamentals for industry: the history from relay panels to PLCs, the architecture — power supply, CPU, memory, input and output modules — the read-inputs, run-program, write-outputs scan cycle, the I/O image, scan time and response time, the shortest pulse a PLC can catch, compact, modular and safety PLCs, comparison with relays and microcontrollers, and how to choose a PLC.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/plc-fundamentals/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is a PLC: CPU, Memory, I/O, the Scan Cycle, Scan Time, the IEC 61131 Standard and Choosing a PLC

THภาษาไทยENEnglish

// Chapter 22.1 · PLC · What Is a PLC


In 1968 General Motors' Hydra-Matic transmission plant wanted to stop rewiring relay panels every time the car models changed. That brief produced the first PLC (the Modicon 084). The core idea is unchanged today: a computer built to survive the factory floor, which reads inputs from switches and sensors, decides with a program an electrician can read, and drives outputs — repeating predictably, without end.

In 30 seconds

- PLC = power supply + CPU + memory + I/O modules + communication ports

- One scan: read inputs into the image → run the program top to bottom → write outputs → system tasks

- Typical scan time 1–20 ms · worst-case response ≈ input delay + 2 scans + output delay

- Its strength is robustness and deterministic behaviour, not speed

## PLC architecture Basic

Figure 1 · The PLC sits between two groups of field devices: those that “tell” (buttons, sensors) and those that “do” (contactors, valves, lamps)

| Part | Function | What to know |

| Power supply | Converts 230 VAC to 24 VDC for the CPU and I/O | Use a separate supply for high-current field loads (solenoids) |

| CPU | Runs the program, manages I/O and communication | Look at speed per instruction, memory size and special functions (PID, fast counters) |

| Memory | Stores the program, data and settings | Retentive data keeps its value through a power failure (battery/flash) |

| Digital I/O | 0/1 signals from switches and to coils | 24 VDC sinking/sourcing, relay/transistor outputs |

| Analog I/O | Continuous 4–20 mA, 0–10 V signals | 12–16-bit resolution, must be scaled to engineering units |

| Communication | Talks to HMIs, SCADA, drives and other PLCs | Ethernet (PROFINET, EtherNet/IP, Modbus TCP), RS-485 (Modbus RTU) |

## The scan cycle Intermediate

A PLC does not “watch” its inputs continuously. At the start of each scan it takes a snapshot of every input terminal into the input image table, then runs the program rung by rung from top to bottom, reading from that snapshot. Coil results are written to the output image, which is sent to the output terminals all at once at the end of the scan. Working this way means input values cannot change part-way through a scan, so the result is predictable.

Figure 2 · Right: button I0.0 changes in the middle of scan 0, is read into the image at the start of scan 1, and output Q0.0 changes at the end of scan 1 (seen at the terminal in scan 2)

F1 Scan time

$$t_{scan} = t_{read\,I} + t_{program} + t_{write\,Q} + t_{comm/diag}$$

F2 Program execution estimate

$$t_{program} \approx N_{bit}\,t_{bit} + N_{word}\,t_{word} + N_{real}\,t_{real}$$

F3 System response time

$$t_{in} + t_{scan} + t_{out} \;\le\; t_{resp} \;\le\; t_{in} + 2\,t_{scan} + t_{out}$$

F4 Shortest pulse surely seen

$$t_{pulse} > t_{scan} + t_{in}$$

Example F-1

### A conveyor runs at 1.2 m/s; 30 mm parts pass a photoelectric sensor; PLC scan 10 ms, input filter 3 ms

- Time the part blocks the sensor: $t = 0.030/1.2 = 25$ ms

- F4: must exceed $10 + 3 = 13$ ms → 25 ms is caught ✓ (almost a 2× margin)

- If the conveyor speeds up to 3 m/s: $t = 10$ ms < 13 ms → parts may be missed; use a high-speed input or a hardware counter

- F3: the time from a part reaching the sensor to the air-jet reject (transistor output 0.1 ms + solenoid 15 ms) is at worst ≈ 3 + 20 + 0.1 + 15 = 38 ms → the part travels 46 mm in that time, so mount the air nozzle this far beyond the sensor

## Types of PLC Basic

| Type | Characteristics | Good for |

| Nano/Compact (all-in-one) | CPU and I/O in one housing, 10–60 points, limited expansion | Single machines, pumps, building services |

| Modular (rack) | Choose the CPU, I/O and communication modules as needed, hundreds to thousands of points | Production lines, process plants |

| Safety PLC | Dual CPUs, self-checking, SIL/PL certified | Emergency stops, light curtains, safety gates, burner management |

| PAC / IPC (soft PLC) | An industrial computer running an IEC 61131-3 runtime | Heavy computation, multi-axis motion, large data volumes |

| Smart relay | Programmable relay with a small display and function blocks | Very small jobs, replacing a few relays |

### PLC compared with relays and microcontrollers

| Criterion | Relay panel | PLC | Microcontroller |

| Changing the logic | Rewire | Edit the program | Edit the program (written in C) |

| Industrial robustness | High | High (IEC 61131-2 tests for EMC, temperature, vibration) | User must design it in |

| Diagnostics | Measure point by point | Online status view, event logs | Depends on the programmer |

| Predictability | High | High (fixed scan, watchdog) | Depends on the design |

| Cost per point | Low for very small jobs | Moderate | Very low |

## The IEC 61131 standard Intermediate

IEC 61131 makes PLC knowledge transferable across brands. The parts electricians and engineers use most:

- Part 2 (equipment): 24 VDC input Types 1/2/3, ON/OFF voltage ranges, EMC tests — details in I/O wiring

- Part 3 (languages): LD, FBD, ST, SFC (and IL, deprecated in the 2013 edition), data types, standard timers and counters — see IEC 61131-3 languages

## How to choose a PLC Intermediate

F5 I/O count with spare

$$N_{I/O} = \left\lceil 1.2\,N_{required} \right\rceil \quad (\text{15–25 \% spare})$$

- Make an I/O list: count digital and analog inputs and outputs and high-speed inputs, with their types (PNP/NPN, 4–20 mA)

- The required response time (F3) and special functions (PID, counters, motion)

- Communication with the HMIs, drives and SCADA systems already in the plant

- Safety: is a safety PLC or safety relay needed?

- Environment: panel temperature, humidity, vibration

- Plant standards and spares on hand — a brand the maintenance staff already know is often better value than a cheaper one

## Frequently asked questions

If a button is pressed for less than the scan time, will the PLC see it?
Possibly not. Inputs are read once at the start of each scan, so a pulse shorter than the scan time plus the input filter time can appear and disappear between two reads. Fast signals (encoders, high-speed part-counting sensors) need high-speed inputs, hardware counters or interrupts.

Why does writing the same coil in two places make the program misbehave?
Because the PLC executes from top to bottom, the value written by the lower coil overwrites the value from the upper one before the outputs are sent at the end of the scan. The upper coil appears not to work (double-coil syndrome). Combine the conditions into a single rung, or use SET/RESET deliberately.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**If a button is pressed for less than the scan time, will the PLC see it?**
Possibly not. Inputs are read once at the start of each scan, so a pulse shorter than the scan time plus the input filter time can appear and disappear between two reads. Fast signals (encoders, high-speed part-counting sensors) need high-speed inputs, hardware counters or interrupts.

**Why does writing the same coil in two places make the program misbehave?**
Because the PLC executes from top to bottom, the value written by the lower coil overwrites the value from the upper one before the outputs are sent at the end of the scan. The upper coil appears not to work (double-coil syndrome). Combine the conditions into a single rung, or use SET/RESET deliberately.
