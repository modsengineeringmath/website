---
title: "Soft Starters, Autotransformers and Motor Starting Methods Compared: Current, Torque, Voltage Dip and Cost"
url: https://modsengineeringmath.com/learn/en/motor-control/soft-starters/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> How a soft starter works: anti-parallel thyristors, firing-angle control, voltage ramp, current limit, torque control, bypass contactor and soft stop against water hammer in pumps. Autotransformer starting, the current and torque formula for each method, and a comparison of DOL, star–delta, soft starter and VFD with a voltage-dip calculator.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/soft-starters/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Soft Starters, Autotransformers and Motor Starting Methods Compared: Current, Torque, Voltage Dip and Cost

THภาษาไทยENEnglish

// Chapter 21.10 · AC Motor Control · Soft Starters & Autotransformers


Every method that lowers the voltage at start-up obeys the same rule: current falls in proportion to voltage, but torque falls with the square of voltage. This page uses that rule to compare starting methods with numbers, and explains the soft starter, now a favourite choice for modern pump installations.

In 30 seconds

- Reduce the voltage by a factor $k$ → current × $k$, torque × $k^2$

- Soft starter: thyristors chop the waveform, ramp the voltage, limit current to 2–4 In, then bypass

- Autotransformer at tap $a$: motor current × $a$, line current × $a^2$, torque × $a^2$

- Soft stop reduces water hammer in pump pipework — something star–delta cannot do

## The rule of reduced-voltage starting Intermediate

T1 Reduced-voltage starting

$$\frac{V}{V_n} = k \;\Rightarrow\; I_{st} = k\,I_{st,DOL} \qquad T_{st} = k^2\,T_{st,DOL}$$

T2 Torque at a current limit

$$T_{st} = T_{st,DOL}\left(\frac{I_{lim}}{I_{st,DOL}}\right)^2$$

Example T-1

### Motor with Ia/In = 6.5, Ta/Tn = 2.2, current limit set to 3 In

- $k = 3/6.5 = 0.46$ → initial voltage about 46 %

- T2: $T_{st} = 2.2(0.46)^2 = 0.47$ Tn — enough for a centrifugal pump (~0.15 Tn) but not for a loaded conveyor (~1.0–1.5 Tn)

- Compare star–delta: current $6.5/3 = 2.2$ In but torque $2.2/3 = 0.73$ Tn — lower current yet higher torque, because the winding voltage falls only by $1/\sqrt3$ while the line current falls to 1/3 (it behaves like an autotransformer with $a = 0.58$, see Example T-2)

## How a soft starter works Intermediate

Each phase has two thyristors (SCRs) connected in anti-parallel. The controller fires the thyristors at an angle α after the voltage zero crossing, so the motor receives only the tail end of each half-cycle. As α is steadily reduced, the rms voltage at the motor steadily rises. When full voltage is reached an internal bypass contactor closes and the thyristors stop conducting, so there is no heat loss in them during normal running.

Figure 1 · Motor voltage waveform during the ramp: from narrow slices of the wave (large α) to the full wave, then bypass

T3 RMS voltage vs firing angle (resistive approximation)

$$\frac{V_{rms}}{V} = \sqrt{1 - \frac{\alpha}{\pi} + \frac{\sin 2\alpha}{2\pi}}$$

Formula T3 applies to a resistive load and is meant to show the trend. A motor is an inductive load whose current lags, so the conduction interval is longer than this. A real soft starter measures the current and adjusts α by feedback.

### Common starting modes

- Voltage ramp: starts at an initial voltage (30–60 %) and rises linearly over a set time (5–30 s)

- Current limit: adjusts the voltage so the current never exceeds k·In (2–4 In) throughout acceleration

- Torque control: makes the torque rise smoothly so speed rises almost linearly; well suited to pumps and conveyors

- Kick start: applies a short burst of high voltage at the start to overcome static friction

- Soft stop / pump stop: lowers the voltage slowly when stopping so the water in the pipe decelerates without slamming the check valve (water hammer)

JavaScript is needed for the simulator

### Connection and precautions

- Upstream short-circuit protection is required: a circuit-breaker for Type 1 or semiconductor fuses for Type 2 coordination, per the manufacturer's tables

- Never connect power-factor correction capacitors between the soft starter and the motor — connect them on the supply side and switch them out during the ramp

- Set the motor rated current, overload class and number of starts per hour as specified by the manufacturer (the thyristors heat up during starting)

- A line-side contactor or disconnect switch is needed for isolation during maintenance (blocked thyristors do not count as isolation)

## Autotransformer starting Advanced

A three-phase autotransformer has taps such as 50 %, 65 % and 80 %. The motor receives $aV$ and the motor current falls by a factor $a$, but because the transformer also transforms current, the current in the supply lines falls by $a^2$ — a better reduction in line current than a resistor starter or a soft starter at the same torque. It is used for large motors such as raw-water pumps and large compressors (often built as a Korndorfer starter with closed-transition changeover).

T4 Autotransformer starter at tap $a$

$$I_{motor} = a\,I_{st,DOL} \qquad I_{line} = a^2\,I_{st,DOL} \qquad T_{st} = a^2\,T_{st,DOL}$$

Example T-2

### 65 % tap with a motor of Ia/In = 7, Ta/Tn = 2.3

- $a^2 = 0.4225$ → line current $0.4225 \times 7 = 2.96$ In · torque $0.4225 \times 2.3 = 0.97$ Tn

- Compare a soft starter at the same line current of 2.96 In: T2 → only $2.3(2.96/7)^2 = 0.41$ Tn

- The autotransformer gives almost twice the torque at the same line current, at the price of size, weight and cost

## Comparing every method Intermediate

Figure 2 · Starting current and torque of an example motor (Ia/In 6.5 · Ta/Tn 2.15)

T5 Supply dip for any method

$$\Delta U\% \approx \frac{\sqrt3\,V_L\,I_{line,st}}{S_{tr}/u_k + \sqrt3\,V_L\,I_{line,st}}\times 100$$

| Criterion | DOL | Star–delta | Autotransformer | Soft starter | VFD |

| Line current | 6–8 In | 2–2.7 In | 2–4 In | 2–4 In | ≤ 1.5 In |

| Starting torque | Highest | 1/3 | a² | (I/Is)² | High, controllable |

| Smoothness | Jerk | Two jerks | Moderate | Smooth | Smoothest |

| Soft stop | ✗ | ✗ | ✗ | ✓ | ✓ (controlled) |

| Cables to motor | 3 | 6 | 3 | 3 (inside delta: 6) | 3, shielded |

| Harmonics | — | — | — | During ramp only | Continuous |

| Relative cost | 1 | 1.5–2 | 3–5 | 2–3 | 3–6 |

## Frequently asked questions

Can a soft starter control speed?
No. A soft starter reduces the voltage but the frequency stays at 50 Hz, so under normal load the motor always runs close to rated speed. Reducing the voltage under load only raises the slip and heats the motor. If you need speed control you must use a variable-frequency drive (VFD).

What is an inside-delta soft starter connection?
Some models place the thyristors in series with each winding inside the delta, so they carry only 0.58 In and a smaller soft starter can be used. However, six cables must be run to the motor, as with star–delta, and the connection must follow the manufacturer's diagram exactly.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Can a soft starter control speed?**
No. A soft starter reduces the voltage but the frequency stays at 50 Hz, so under normal load the motor always runs close to rated speed. Reducing the voltage under load only raises the slip and heats the motor. If you need speed control you must use a variable-frequency drive (VFD).

**What is an inside-delta soft starter connection?**
Some models place the thyristors in series with each winding inside the delta, so they carry only 0.58 In and a smaller soft starter can be used. However, six cables must be run to the motor, as with star–delta, and the connection must follow the manufacturer's diagram exactly.
