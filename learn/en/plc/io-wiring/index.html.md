---
title: "PLC Input/Output Wiring: Sinking and Sourcing, PNP/NPN Sensors, Relay and Transistor Outputs, Inductive Loads and the 24 VDC Supply"
url: https://modsengineeringmath.com/learn/en/plc/io-wiring/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Wire PLC I/O correctly every time: 24 VDC Type 1, 2 and 3 inputs to IEC 61131-2, sinking and sourcing inputs, 3-wire PNP and NPN sensors with brown, black and blue wire colours, 2-wire sensors and leakage current, relay, transistor and triac outputs, flyback diodes, RC snubbers, interposing relays, 4–20 mA analog signals, shielding, earthing the 0 V, and sizing the power supply.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/io-wiring/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PLC Input/Output Wiring: Sinking and Sourcing, PNP/NPN Sensors, Relay and Transistor Outputs, Inductive Loads and the 24 VDC Supply

THภาษาไทยENEnglish

// Chapter 22.2 · PLC · I/O Wiring


A correct program is worthless if the inputs read wrong or the outputs burn out. This page explains wiring by the direction of current, not by memorising rules. Once you understand “who supplies and who receives”, sinking versus sourcing and PNP versus NPN will never confuse you again.

In 30 seconds

- PNP supplies +24 V → use a sinking input (COM → 0 V) · NPN pulls down to 0 V → use a sourcing input (COM → +24 V)

- 3-wire sensor: brown +24 V · blue 0 V · black signal

- Relay output: AC or DC, slow, wears out · transistor: DC only, fast, no wear

- DC coils get a diode · AC coils get an RC snubber or varistor · large loads go through an interposing relay

## 24 VDC inputs: sinking and sourcing Basic

Inside a digital input is an optocoupler in series with a resistor; current can flow through its LED in one direction only. The names sinking and sourcing describe the direction of current at the input terminal: a sinking input “receives” current (an external device must supply +24 V to it), while a sourcing input “supplies” current out (the external device must pull it down to 0 V). Many modern PLCs can be wired either way, depending on which supply terminal the group's COM is connected to.

Figure 1 · The arrows show the current direction: a PNP sensor “pushes” current from +24 V into the input · an NPN sensor “pulls” current from the input down to 0 V

W1 Input current

$$I_{in} \approx \frac{V - V_{LED}}{R_{in}} \approx \frac{24 - 1.2}{4.7\ \text{k}\Omega} \approx 5\ \text{mA}$$

24 VDC input types to IEC 61131-2 (approximate values — check the PLC manual)

| Type | ON | OFF | Used for |

| Type 1 | ≥ 15 V and ≥ 2 mA | ≤ 5 V or ≤ 0.5 mA | Contacts, switches, 3-wire sensors |

| Type 2 | ≥ 11 V and ≥ 6 mA | ≤ 5 V or ≤ 2 mA | High-current devices (rare) |

| Type 3 | ≥ 11 V and ≥ 2 mA | ≤ 5 V or ≤ 1.5 mA | 2-wire sensors (high leakage) and general use |

W2 Two-wire sensor compatibility

$$I_{leak,sensor} \le I_{OFF,max} \qquad V_{drop,sensor} \le 24 - V_{ON,min}$$

## 3-wire sensors and wire colours Basic

| Wire (IEC 60947-5-2) | Function | PNP | NPN |

| Brown (BN) | +24 V | +24 V | +24 V |

| Blue (BU) | 0 V | 0 V | 0 V |

| Black (BK) | NO signal | Active = +24 V | Active = 0 V |

| White (WH) | NC signal (4-wire models) | Inverted | Inverted |

In Asia you will meet both PNP (common on European machines) and NPN (common on older Japanese machines). Spare parts must match the type. Connecting the wrong sensor type does not cause immediate damage, but the input will not work or will read inverted.

Example W-1

### Replacing an NPN sensor with a PNP one on a machine whose input COM is wired to +24 V

- The input group is currently sourcing (COM → +24 V), so it works only with NPN sensors.

- If the whole group is changed to PNP: move the group COM to 0 V and check that no NPN devices remain in that group.

- If only one sensor is changed and the COM cannot be moved: buy an NPN sensor as before, or use a relay or signal-converter module.

## Outputs: relay, transistor, triac Intermediate

Figure 2 · A 230 VAC contactor coil driven from a relay output with an RC snubber · a 24 VDC relay driven from a PNP transistor output with a diode

| Type | Load | Speed | Life | Cautions |

| Relay | AC/DC ≤ 2 A per point | ~10 ms | 10⁵–10⁶ operations (less with inductive loads) | Unsuitable for frequent switching (PWM, fast-flashing lamps) |

| Transistor (PNP/NPN) | DC 0.3–0.5 A per point | < 1 ms (µs on fast models) | No wear | DC only; can fail on a short circuit (some models are self-protected) |

| Triac (SSR) | AC 0.5–1 A | Half a cycle | No wear | Off-state leakage may stop a small coil from dropping out |

W3 Inductive kick

$$v_L = L\frac{di}{dt} \qquad \text{no suppressor: several hundred volts} \qquad \text{with a diode: } V_{clamp} \approx V_{supply} + 0.7\ \text{V}$$

A diode clamps the voltage best but makes the coil drop out more slowly (the current circulates for longer). If a fast release is needed, use a Zener diode or a varistor. AC coils use an RC snubber or a varistor; modern contactors accept plug-in surge-suppressor modules on A1–A2.

### Interposing relays

When a load exceeds the output rating, needs a different voltage, or the PLC circuit must be isolated from the field, use a small 24 VDC DIN-rail relay as an intermediary. If it fails you replace a relay costing a few dollars instead of an output module.

## Analog signal wiring Intermediate

- Use shielded twisted-pair cable and earth the shield at the panel end only (unless the manual specifies both ends with an equipotential bonding conductor).

- 4–20 mA tolerates noise and long cable runs better than 0–10 V and can detect a broken wire (below 3.6 mA) — details in 4–20 mA · NE 43 (Thai).

- A 2-wire transmitter is wired as a loop: +24 V → transmitter → current input → 0 V. Check the loop voltage budget as well.

## The 24 VDC power supply and earthing Intermediate

W4 24 VDC supply sizing

$$I_{PSU} \ge 1.25\left(I_{CPU} + \sum I_{in} + \sum I_{sensor} + \sum I_{out\,(\text{simultaneous})}\right)$$

Example W-2

### CPU 0.4 A · 24 inputs × 5 mA · 10 sensors × 20 mA · 8 interposing relays × 25 mA · 4 solenoids × 0.3 A

- Total $0.4 + 0.12 + 0.2 + 0.2 + 1.2 = 2.12$ A

- W4: $1.25 \times 2.12 = 2.65$ A → a 24 V 5 A power supply (or put the solenoids on a separate supply so their inrush current does not disturb the CPU)

IEC 60204-1 recommends that the 24 VDC circuit be a PELV system with the 0 V terminal earthed at a single point in the panel, so that an earth fault on a control wire blows a fuse instead of making a device operate unintentionally. Fit separate 24 V fuses or circuit-breakers for the input group, the output group and the CPU.

Emergency stop: never rely on an ordinary PLC input alone for an emergency stop. It must be wired through a safety relay or a safety PLC that removes power directly, with the PLC only reading its status (see Safety).

## Frequently asked questions

Which type of input does a PNP sensor connect to?
A PNP sensor puts +24 V out on its signal wire (it is a source, i.e. sourcing), so it must connect to an input that takes current in and returns it to 0 V (a sinking input). In practice, on a PLC with a common COM terminal, connect the COM of that input group to 0 V. An NPN sensor pulls the signal down to 0 V, so its group COM must go to +24 V.

Why does a 2-wire sensor make an input stay on?
A 2-wire sensor needs current to power itself even in the OFF state (a leakage current of 0.5–1.5 mA). If this current exceeds the maximum OFF current the input accepts, the PLC reads the input as permanently ON. Use a Type 3 input, or fit a bleeder resistor in parallel with the input as the manual specifies.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Which type of input does a PNP sensor connect to?**
A PNP sensor puts +24 V out on its signal wire (it is a source, i.e. sourcing), so it must connect to an input that takes current in and returns it to 0 V (a sinking input). In practice, on a PLC with a common COM terminal, connect the COM of that input group to 0 V. An NPN sensor pulls the signal down to 0 V, so its group COM must go to +24 V.

**Why does a 2-wire sensor make an input stay on?**
A 2-wire sensor needs current to power itself even in the OFF state (a leakage current of 0.5–1.5 mA). If this current exceeds the maximum OFF current the input accepts, the PLC reads the input as permanently ON. Use a Type 3 input, or fit a bleeder resistor in parallel with the input as the manual specifies.
