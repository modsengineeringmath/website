---
title: "Analog, PID and Drive Control with a PLC: 4–20 mA Scaling, the PID Block, a Constant-Pressure Pump and Modbus RTU"
url: https://modsengineeringmath.com/learn/en/plc/analog-pid-vfd/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Analog work in a PLC from start to finish: ADC resolution, scaling raw counts to engineering units (Siemens 0–27648, Mitsubishi, Omron), wire-break detection per NAMUR NE 43, the positional and discrete PID block, Kp Ti Td settings, basic tuning, a constant-pressure pump example, and commanding a VFD by digital, analog and Modbus RTU signals with an example register map, control and status words, and frequency in 0.01 Hz units.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/analog-pid-vfd/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Analog, PID and Drive Control with a PLC: 4–20 mA Scaling, the PID Block, a Constant-Pressure Pump and Modbus RTU

THภาษาไทยENEnglish

// Chapter 22.8 · PLC · Analog, PID & VFD


The real world is not just 0 and 1: pressure, level, temperature and motor speed are continuous quantities. This page goes from the raw number in an analog module to a pressure-control loop that commands a drive — the most common job in buildings and factories.

In 30 seconds

- Scaling: $y = y_{min} + (x - x_{min})(y_{max} - y_{min})/(x_{max} - x_{min})$, computed in REAL

- Below 3.6 mA or above 21 mA is a fault, not a measurement

- PID: $u = K_p\left(e + \frac{1}{T_i}\int e\,dt + T_d\frac{de}{dt}\right)$ · start tuning with PI

- Commanding a VFD: DI + AI is simplest · Modbus returns data (current, faults) over a single pair

## From raw counts to engineering units Basic

Figure 1 · A 0–10 bar, 4–20 mA pressure transmitter into an analog module that returns raw counts of 0–27648

P1 Linear scaling

$$y = y_{min} + (x - x_{min})\,\frac{y_{max} - y_{min}}{x_{max} - x_{min}}$$

P2 Resolution per raw count

$$\Delta y = \frac{y_{max} - y_{min}}{x_{max} - x_{min}} \qquad \text{e.g. } \frac{10\ \text{bar}}{27648} = 0.36\ \text{mbar}$$

P3 Signal validity (NAMUR NE 43)

$$3.8 \le I \le 20.5\ \text{mA: valid measurement} \qquad I \le 3.6 \text{ or } I \ge 21\ \text{mA → fault}$$

Example P-1

### Scaling a raw value of 13824 with INT gives zero

- Wrong: Bar := Raw / 27648 * 10; in INT → 13824/27648 = 0 (truncated) → 0 bar

- Also wrong: Raw * 10 / 27648 in INT → 27648 × 10 = 276480 overflows INT

- Right: Bar := INT_TO_REAL(Raw) * 10.0 / 27648.0; → 5.0 bar

- Check P3: Siemens modules return negative raw values when the current is below 4 mA (down to −4864 ≈ 1.185 mA), and with wire-break diagnostics enabled they report a special value (32767) — check both the raw range per P3 and the module's status bits.

## The PID block in a PLC Intermediate

Figure 2 · Constant-pressure loop: SP − PV = e → PID → frequency → VFD → pump → pressure → transmitter

P4 PID (standard form)

$$u(t) = K_p\left(e + \frac{1}{T_i}\int_0^t e\,d\tau + T_d\,\frac{de}{dt}\right) \qquad e = SP - PV$$

P5 Discrete PID (sample time $T_s$)

$$u_k = K_p\left(e_k + \frac{T_s}{T_i}\sum_{j=0}^{k} e_j - \frac{T_d}{T_s}(PV_k - PV_{k-1})\right)$$

The derivative term uses PV instead of e (derivative on measurement) so the output does not kick when SP changes, and anti-windup is needed: when the output hits its limit (e.g. 50 Hz), stop accumulating the integral. Most pump and fan loops use PI only (Td = 0) because pressure signals are noisy.

### Initial tuning for a constant-pressure pump

- Start with a small Kp (e.g. 0.5 of full scale), a long Ti (e.g. 5 s) and Td = 0

- Increase Kp until it starts to oscillate, then halve it

- Reduce Ti gradually until the value returns to setpoint quickly enough without oscillating (typically 1–5 s for water pressure)

- Test by actually opening and closing taps, watching both the dip and the overshoot

Try the effect of Kp, Ti and Td in the PID lab (Thai), and a pressure loop with a VFD pump in the virtual instrumentation lab (Thai).

## Commanding a drive from the PLC Intermediate

| Method | Wiring | Advantages | Limitations |

| Digital + preset speeds | Several DO → DI wires | Simple, noise-immune | Only a few speeds |

| Digital + analog | DO → RUN · AO → AI (4–20 mA) | Continuous adjustment, easy to understand | Feedback limited to what is wired (AO, relays) |

| Modbus RTU (RS-485) | One twisted pair, several drives | Read current, frequency and faults; set parameters | Communication settings needed; slower response with many stations |

| Industrial Ethernet | PROFINET, EtherNet/IP, Modbus TCP, EtherCAT | Fast, lots of data, full diagnostics | Needs a module and network configuration |

P6 Frequency setpoint over Modbus

$$\text{Reg} = \frac{f}{0.01\ \text{Hz}} \quad (35.5\ \text{Hz} \to 3550) \qquad \text{or} \quad \text{Reg} = \frac{f}{f_{max}}\times \text{Scale}_{100\%}$$

Example register map (hypothetical, for learning — every brand differs; use the real manual)

| Register | Name | Read/write | Value |

| 40001 | Control word | W | Bit 0 = RUN · bit 1 = REV · bit 2 = RESET |

| 40002 | Frequency reference | W | 0.01 Hz |

| 40011 | Status word | R | Bit 0 = Ready · bit 1 = Running · bit 3 = Fault |

| 40012 | Output frequency | R | 0.01 Hz |

| 40013 | Output current | R | 0.1 A |

| 40014 | Fault code | R | Code per the manual |

RS-485 wiring, CRC-16 calculation and a frame builder are in Modbus RTU · TCP (Thai). Remember: set the “communication timeout” in the drive so it stops if the PLC is silent for longer than the set time — otherwise, if the communication cable breaks, the drive keeps running at the last frequency.

Example P-2

### The PLC sends 4–20 mA to a VFD ranged 20–50 Hz; 42 Hz is wanted

- Invert P1: $I = 4 + 16\,(42 - 20)/(50 - 20) = 4 + 11.73 = 15.73$ mA

- If the analog output is 0–27648 = 4–20 mA: raw value $= 27648 \times 11.73/16 = 20275$

- Set the drive to treat AI below 2 mA as a broken wire and choose the response (stop / fallback speed)

## Frequently asked questions

Is it better to run PID in the PLC or in the VFD?
For a single loop where the transmitter can be wired straight into the VFD, the drive's own PID is simple, responds quickly and keeps working even if the PLC fails. If several pumps must be coordinated, there are many conditions, or the loop must be logged and adjusted from SCADA, PID in the PLC is more flexible.

What value do I send over Modbus to command 35.5 Hz?
It depends on the register units in the drive manual. Many drives use 0.01 Hz units, so you send 3550. Some use a fraction of maximum frequency, e.g. 0–16384 or 0–10000 = 0–100 %. Always read the manual and test with a low value first.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Is it better to run PID in the PLC or in the VFD?**
For a single loop where the transmitter can be wired straight into the VFD, the drive's own PID is simple, responds quickly and keeps working even if the PLC fails. If several pumps must be coordinated, there are many conditions, or the loop must be logged and adjusted from SCADA, PID in the PLC is more flexible.

**What value do I send over Modbus to command 35.5 Hz?**
It depends on the register units in the drive manual. Many drives use 0.01 Hz units, so you send 3550. Some use a fraction of maximum frequency, e.g. 0–16384 or 0–10000 = 0–100 %. Always read the manual and test with a low value first.
