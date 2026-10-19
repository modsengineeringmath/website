---
title: "VFD Setup and Applications: Basic Parameters, Multi-Step Speeds, 0–10 V / 4–20 mA, Constant-Pressure PID Pumps and Energy Savings from the Affinity Laws"
url: https://modsengineeringmath.com/learn/en/motor-control/vfd-applications/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> A 12-step VFD commissioning procedure that works for any brand: nameplate data, auto-tune, acceleration and deceleration times, command sources, preset speeds from digital inputs, 0–10 V and 4–20 mA analog inputs, constant-pressure water pumps with the drive's built-in PID, conveyors, fans, the affinity laws Q ∝ n, H ∝ n², P ∝ n³, calculating energy savings and payback, temperature derating in hot and humid climates, bypass, and common fault codes.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/vfd-applications/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# VFD Setup and Applications: Basic Parameters, Multi-Step Speeds, 0–10 V / 4–20 mA, Constant-Pressure PID Pumps and Energy Savings from the Affinity Laws

THภาษาไทยENEnglish

// Chapter 21.13 · AC Motor Control · VFD Setup & Applications


Every drive manufacturer names its parameters differently, but what has to be set is the same on every brand. This page gives a commissioning sequence that works in general, the most common applications, and how to prove with numbers whether a VFD is worth the money.

In 30 seconds

- Enter the full nameplate data, then auto-tune before doing anything else

- Ramp times too short → OC/OV trips · too long → sluggish response

- Analog: $f = f_{min} + (f_{max} - f_{min})\cdot\frac{x - x_0}{x_1 - x_0}$

- Pumps and fans: $P \propto n^3$ — cut speed by 20 % and power falls to ~51 % (with no static head)

- Hot, humid climate: check the temperature inside the panel and derate per the manual

## The 12-step setup Basic

- Reset to factory defaults (when reusing a drive that has been used before)

- Motor data: voltage, current, power, frequency, speed and cos φ from the nameplate (for the Y/Δ connection actually used)

- Auto-tune: static (stationary) if the load cannot be uncoupled, rotating if it can

- Control mode: V/f for pumps and fans or several motors · vector for high torque at low speed

- Minimum and maximum frequency: e.g. 20–50 Hz for a pump (below that the water will not rise)

- Acceleration and deceleration times: start at 5–10 s and adjust (see P1)

- Stop method: ramp (decelerate over time) or coast (free-wheel) — large fans usually coast

- Command source: keypad / terminals (DI) / communication (Modbus) · speed source: keypad / AI / preset / bus

- Digital inputs: RUN FWD, RUN REV, reset, preset speed, external fault

- Analog input: type (0–10 V or 4–20 mA) and scaling (see P2)

- Outputs: fault/run relays to pilot lamps or the PLC · AO showing frequency or current

- Test: run uncoupled, check the direction of rotation (it can be reversed by a parameter), apply load, measure current, record every setting

Parameter names with the same function (examples of terms manufacturers use)

| Function | Terms found in manuals |

| Motor rated current | Motor rated current · Rated motor current · Nominal current |

| Acceleration / deceleration time | Acceleration time · Ramp-up time · Accel 1 / Decel 1 |

| Run command source | Run command source · Control place · Operation mode |

| Frequency source | Frequency reference · Speed setpoint source |

| Switching frequency | Carrier frequency · PWM frequency · Switching frequency |

P1 Minimum ramp time without tripping

$$t_{acc,min} \approx \frac{J\,\omega_n}{T_{lim} - \overline{T_L}} \qquad T_{lim} \approx 1.5\,T_n\ \ (\text{set by the drive current limit})$$

P2 Analog reference scaling

$$f = f_{min} + (f_{max} - f_{min})\,\frac{x - x_0}{x_1 - x_0} \qquad x: 0\text{–}10\ \text{V or } 4\text{–}20\ \text{mA}$$

Example P-1

### A PLC sends 12 mA to a pump set for a 20–50 Hz range

- P2: $f = 20 + 30\,(12 - 4)/(20 - 4) = 20 + 15 = 35$ Hz

- If the 4–20 mA wire breaks, the signal becomes 0 mA — set the drive to detect “signal loss” (< 2–3 mA) and then stop or run at a fallback speed, instead of interpreting it as 20 Hz

## Multi-step speeds from digital inputs Basic

Two or three digital inputs select preset speeds in binary. This suits conveyors or mixers that need only a few speeds, and they can be commanded from a selector switch or a PLC without any analog signal.

| DI3 | DI4 | Resulting speed | Example value |

| 0 | 0 | Main reference (keypad/AI) | 50 Hz |

| 1 | 0 | Preset 1 | 15 Hz (jog/positioning) |

| 0 | 1 | Preset 2 | 30 Hz |

| 1 | 1 | Preset 3 | 45 Hz |

## Constant-pressure water pumping with the drive's PID Intermediate

A building booster water system uses a 4–20 mA pressure transmitter wired to the drive's AI. You set the target (e.g. 3.5 bar) and the drive computes PID and adjusts the frequency to hold the pressure constant even as water demand changes. Functions you should set:

- Sleep / wake-up: when there is no demand, the frequency falls to a low value; after it stays there longer than a set time the drive stops the pump, and it restarts when the pressure drops a set amount below the target

- Dry-run protection: abnormally low current or power at high frequency = the pump is running dry; stop and raise an alarm

- Pipe fill: fill the pipework slowly at start-up to prevent water hammer

- Multi-pump: many drives can start a second pump (DOL or another drive) when demand exceeds one pump

PID theory and tuning are in Control systems: PID (Thai), and an example of a PLC commanding a VFD is in PLC analog, PID and VFD.

## The affinity laws and energy savings Intermediate

Figure 1 · Left: the affinity laws · Right: at 80 % flow, throttling with a valve still uses about 90 % power, while a VFD uses about 55 %

P3 Affinity law — flow

$$\frac{Q_2}{Q_1} = \frac{n_2}{n_1}$$

P4 Affinity law — head

$$\frac{H_2}{H_1} = \left(\frac{n_2}{n_1}\right)^2$$

P5 Affinity law — power

$$\frac{P_2}{P_1} = \left(\frac{n_2}{n_1}\right)^3$$

P6 System with static head

$$H_{sys} = H_{st} + kQ^2 \qquad \frac{n}{n_1} \approx \sqrt{h_0 + (1 - h_0)q^2} \quad (h_0 = H_{st}/H_1,\ q = Q/Q_1)$$

P7 Energy saved per year

$$\Delta E = (P_{throttle} - P_{VFD})\,h \qquad \text{money} = \Delta E \times \text{tariff per kWh}$$

P8 Simple payback

$$t_{payback} = \frac{\text{installed VFD cost}}{\text{savings per year}}$$

Example P-2

### A 30 kW ventilation fan runs 6,000 h/year at an average 75 % flow; electricity costs 4.5 baht/kWh

- Damper throttling: $P \approx 30(0.55 + 0.45 \times 0.75) = 26.6$ kW

- VFD (P5, no static head): $30 \times 0.75^3 / 0.97 + 0.6 = 13.6$ kW (including drive losses)

- P7: $\Delta E = (26.6 - 13.6)(6000) = 78{,}000$ kWh/year ≈ 351,000 baht/year

- P8: installed drive 180,000 baht → payback ~0.5 year

## Installing in a hot, humid climate Intermediate

- Most drives are rated at 40 °C ambient (some at 50 °C); above that, derate by about 1–2.5 %/°C per the manual — the inside of a panel standing in the tropical sun can exceed 50 °C

- Above 1000 m altitude, derate ~1 % per 100 m

- High humidity and condensation: fit anti-condensation heaters in panels that stand idle for long periods, and choose conformally coated boards (3C2/3C3)

- Cooling: drive losses are ~2–3 % of rated power and must be included when sizing the panel fan (see K7)

## Bypass and multiple motors Advanced

Critical duties (a fire pump must never rely on a VFD as its only path; main wastewater pumps) may need a bypass: contactor KM-VFD (on the drive output) and KM-BYP (from the mains straight to the motor), interlocked both electrically and mechanically, switching over only when the drive has stopped and the motor is de-energised, and with an overload relay for the bypass path. One drive can run several motors at once in V/f mode, provided the drive is sized ≥ 1.1 × the sum of the motor currents and each motor has its own overload relay.

## Common fault codes

| Code (typical) | Meaning | Cause / remedy |

| OC / Overcurrent | Instantaneous overcurrent | Accelerating too fast, shorted motor cable, no auto-tune, boost too high |

| OV / DC overvoltage | DC bus too high | Decelerating too fast, overhauling load, high supply voltage → increase decel time or fit a braking resistor |

| UV / Undervoltage | DC bus too low | Supply dip, lost input phase, blown input fuse |

| OH / Overtemperature | Heatsink too hot | Failed drive fan, hot panel, clogged with dust, high switching frequency |

| OL / Motor overload | Motor thermal model full | Overload, long running at low speed and high torque, wrong motor current setting |

| GF / Earth fault | Earth leakage on the output | Deteriorated cable or motor insulation, moisture in the terminal box |

| PHL / Input phase loss | Input phase missing or unbalanced | Check fuses, terminals and the three-phase voltages |

## Frequently asked questions

How much energy do I save by running a pump at half speed?
By the affinity laws, in a system with no static head the power falls to (0.5)³ = 12.5 %, a saving of almost 88 %. A real system that must lift water to a height has to keep a certain minimum speed to overcome the static head, so it saves much less. Use the system curve, or the calculator on this page, which accepts a static-head fraction.

My VFD trips on OC (overcurrent) during acceleration. How do I fix it?
Increase the acceleration time, check that the motor current and power are entered correctly and that auto-tune has been done, check the motor cable for short circuits or earth leakage, and see whether the load is mechanically jammed. If the load genuinely has high inertia, you may need a drive with a heavy-duty rating.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**How much energy do I save by running a pump at half speed?**
By the affinity laws, in a system with no static head the power falls to (0.5)³ = 12.5 %, a saving of almost 88 %. A real system that must lift water to a height has to keep a certain minimum speed to overcome the static head, so it saves much less. Use the system curve, or the calculator on this page, which accepts a static-head fraction.

**My VFD trips on OC (overcurrent) during acceleration. How do I fix it?**
Increase the acceleration time, check that the motor current and power are entered correctly and that auto-tune has been done, check the motor cable for short circuits or earth leakage, and see whether the load is mechanically jammed. If the load genuinely has high inertia, you may need a drive with a heavy-duty rating.
