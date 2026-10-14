---
title: "Variable-Frequency Drives (VFDs) for Motors: Rectifier, DC Bus, IGBT PWM, V/f and Vector Control, and Correct Wiring"
url: https://modsengineeringmath.com/learn/en/motor-control/vfd/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> How a variable-frequency drive works for 400 V 50 Hz motors: six-diode rectifier, 540–565 V DC bus, IGBT PWM inverter, constant V/f control, voltage boost, field weakening, sensorless vector control, input and output wiring, shielded cable and EMC, cable length and dv/dt, Type B RCDs, braking resistors, single-phase-in three-phase-out drives, and what must never be connected on the output.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/vfd/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Variable-Frequency Drives (VFDs) for Motors: Rectifier, DC Bus, IGBT PWM, V/f and Vector Control, and Correct Wiring

THภาษาไทยENEnglish

// Chapter 21.11 · AC Motor Control · VFD Principles


A contactor can only switch a motor on or off. A VFD creates a new three-phase supply whose frequency and voltage are both adjustable, so the motor can run at any speed with controlled current. This page explains what is inside the box, why V/f must be held constant, and the wiring rules that let a drive run for years without disturbing other systems.

In 30 seconds

- AC 400 V → rectifier → DC bus ≈ 540–565 V → IGBT PWM → AC 0–400 V, 0–50 Hz (or higher)

- Hold V/f = 8 V/Hz to keep the flux constant → full torque at every speed below 50 Hz

- Above 50 Hz the voltage stays constant, the flux falls and torque falls as 1/f

- Output side: no capacitors, never switch a contactor while running, shielded cable earthed 360°

- A single-phase 230 V supply can drive a 230/400 V motor connected in Δ

## Inside a VFD Basic

Figure 1 · Three parts: the rectifier (AC → DC), the DC bus with its capacitors (energy storage) and the IGBT inverter (DC → AC at adjustable frequency)

V1 DC bus voltage

$$V_{dc} \approx 1.35\,V_L = 540\ \text{V (loaded)} \qquad V_{dc,0} = \sqrt2\,V_L = 566\ \text{V (no load)}$$

Six IGBTs switch at 2–16 kHz to produce voltage pulses whose width varies sinusoidally (PWM). The motor, being an inductance, filters out the pulses, so the current is nearly sinusoidal. A higher switching frequency makes the motor quieter but heats the IGBTs more (derating is required).

V2 Maximum output voltage

$$V_{LL,rms} = 0.612\,m\,V_{dc}\ (\text{SPWM}, m \le 1) \qquad V_{LL,max} \approx 0.707\,V_{dc}\ (\text{SVPWM})$$

With $V_{dc}$ = 540 V the maximum SVPWM output voltage is ≈ 382 V, slightly below 400 V, so drives use over-modulation near base frequency. If the supply is low (e.g. 380 V), the motor at 50 Hz receives less than its nameplate voltage and the current at full load is slightly higher.

## V/f control Intermediate

The flux in the iron core is proportional to $V/f$. If the frequency is reduced without reducing the voltage, the core saturates and the current soars; if the voltage is reduced too much, the flux weakens and torque is lost. The drive therefore holds the ratio constant up to the base frequency (from the motor nameplate). At low frequency the voltage drop across R₁ becomes a large fraction, so the voltage is raised slightly (boost).

Figure 2 · Below 50 Hz: constant torque, power rises with speed · Above 50 Hz: constant voltage, constant power, torque falls as 1/f

V3 Constant V/f

$$V(f) = V_n\frac{f}{f_n} + V_{boost}\left(1 - \frac{f}{f_n}\right) \qquad \frac{V_n}{f_n} = \frac{400}{50} = 8\ \text{V/Hz}$$

V4 Speed with a VFD

$$n = \frac{120 f}{p} - \Delta n \qquad \Delta n \approx s_n\,n_{s,n}\ \ (\text{constant at rated torque})$$

V5 Field weakening (f > f_n)

$$T_{cont} \approx T_n\,\frac{f_n}{f} \qquad T_{max} \approx T_{max,n}\left(\frac{f_n}{f}\right)^2 \qquad P \approx P_n$$

Example V-1

### A 7.5 kW, 4-pole, 1470 rpm motor at 30 Hz and 60 Hz

- V3 (ignoring boost): 30 Hz → $V = 8 \times 30 = 240$ V · 60 Hz → voltage held at 400 V

- V4: rated speed drop $\Delta n = 1500 - 1470 = 30$ rpm → 30 Hz: $n = 900 - 30 = 870$ rpm · 60 Hz: $n \approx 1800 - 35 \approx 1765$ rpm (in field weakening the slip at rated power rises slightly)

- V5: at 60 Hz the continuous torque ≈ $48.7 \times 50/60 = 40.6$ N·m; power is still ~7.5 kW, but the maximum torque falls to $(5/6)^2 = 69\,\%$

- At 30 Hz the full 48.7 N·m is available electrically, but the shaft-mounted fan turns at 60 % speed and cools less; with a constant-torque load the motor must be derated

### V/f versus sensorless vector control

V/f simply commands a voltage and frequency without knowing what the motor is doing. It suits pumps and fans and can drive several motors in parallel. Vector control (FOC) estimates flux and torque from the measured currents and controls the flux-producing and torque-producing currents separately, giving high torque at low speed (150 % at 1 Hz) and fast response — suited to conveyors, mixers and hoists. It requires auto-tuning so the drive can measure the motor parameters before use, and works with one motor per drive.

JavaScript is needed for the simulator

## Wiring Basic

Figure 3 · Terminal names differ between brands but the functions are the same: R S T (L1 L2 L3) input, U V W output, digital inputs, analog inputs, fault relay and braking-resistor terminals

### Power-side rules

- Feed the input through the MCCB or fuses specified in the manual (gG/gR fuses protect IGBTs/diodes better). An input contactor (if fitted) is for isolation, not for run/stop (use the digital inputs), because the DC bus capacitors charge every time power is applied

- No separate overload is needed: the drive protects the motor with a thermal model once the nameplate current is entered correctly (except where several motors share one drive — then each motor needs its own overload)

- Use symmetrical shielded motor cable with the shield bonded to earth 360° at the clamps at both ends; the motor PE conductor returns to the drive's PE terminal

- Keep motor cables at least 20–30 cm from signal cables; where they must cross, cross at right angles

- For cables longer than the manual allows (often about 50–100 m for shielded cable), use an output reactor, dv/dt filter or sine filter

Never on the U V W output: no power-factor correction capacitors or snubbers · never open or close a contactor while the drive is delivering output · never apply mains to U V W (e.g. a bypass without an interlock) · never insulation-test with a megger while the cable is still connected to the drive

### The DC bus is dangerous even after switch-off

The DC bus capacitors hold a charge of 540–565 V for several minutes after power is removed. The manual specifies a waiting time (often 5–15 minutes), and you must confirm by measuring at the DC+ and DC− terminals before touching anything.

## EMC, leakage current and RCDs Intermediate

The steep voltage edges of PWM (thousands of volts per microsecond) drive high-frequency current through the capacitance of the cable and motor to earth and radiate interference. An input EMC filter prevents interference from flowing back into the supply, but increases the earth leakage current.

- Three-phase drives can produce smooth DC leakage current, so a Type B RCD is required · single-phase drives use Type F or Type B

- On an IT system (unearthed), the Y capacitors of the internal filter must be disconnected as described in the manual

- Bearing currents from common-mode voltage cause fluting of the bearings in large motors; use insulated bearings or a shaft earthing brush

## Braking and braking resistors Advanced

When the drive is told to decelerate faster than the load would coast to a stop, the motor becomes a generator and energy flows back into the DC bus. A diode rectifier cannot return it to the mains, so the bus voltage rises until the drive trips on “DC overvoltage”. Remedies: lengthen the deceleration time, use a braking resistor via a brake chopper, or use a regenerative (AFE) drive.

V6 Braking resistor

$$E = \tfrac12 J(\omega_1^2 - \omega_2^2) \qquad P_{peak} \approx \frac{J\,\omega_1\,\Delta\omega}{t_{dec}} \qquad R \le \frac{V_{br}^2}{P_{peak}},\ R \ge R_{min}$$

Example V-2

### A fan with J = 2.2 kg·m² decelerated from 1470 rpm to 0 in 10 s

- $\omega_1 = 2\pi(1470)/60 = 154$ rad/s · $E = \tfrac12(2.2)(154^2) = 26.1$ kJ (some is lost to air drag, so this is the worst case)

- V6: $P_{peak} \approx 2.2(154)(154)/10 = 5.2$ kW

- The chopper operates at $V_{br} \approx 760$ V (typical for a 400 V drive) → $R \le 760^2/5{,}200 = 111\ \Omega$, and it must not be less than the $R_{min}$ in the manual · The average power depends on how often braking occurs; it is not 5.2 kW continuously

## Single-phase-in, three-phase-out drives Basic

Homes, farms and shops that have only a single-phase 230 V supply can use a drive with a single-phase input (L N terminals) and a three-phase 230 V output to run three-phase motors up to about 2.2–3 kW. The motor must be a 230/400 V type connected in Δ so that each winding receives 230 V. The advantages are higher starting torque than a single-phase capacitor motor, adjustable speed and low starting current. The limitation is that the input current is peaky (low true power factor), so the input breaker must be chosen according to the manual.

## Frequently asked questions

Can I put a contactor between the VFD and the motor?
Only for isolation or bypass, and it may be opened or closed only when the drive is not delivering output (command a stop and wait for the output to switch off first). Opening the output while current flows causes voltage spikes that destroy the IGBTs and the contacts, and closing it while the drive is running causes a current surge that trips the drive.

Why does the residual-current device trip when a VFD is installed?
The EMC filter and the capacitance of the shielded cable cause high-frequency leakage current to earth, and DC leakage is also possible. Use an RCD designed for drives (Type B for three-phase drives, Type F for single-phase drives), rated 30 mA only where needed for personal protection, or 100–300 mA for fire protection, following the manufacturer's recommendations.

Can a VFD be used with an old motor?
Usually yes, but fast IGBT switching produces high peak voltages at the motor terminals when the cable is long, and the insulation of an old motor may not withstand them. Keep the cable short, use a dv/dt filter or sine filter for long runs, and check cooling when running at low speed.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Can I put a contactor between the VFD and the motor?**
Only for isolation or bypass, and it may be opened or closed only when the drive is not delivering output (command a stop and wait for the output to switch off first). Opening the output while current flows causes voltage spikes that destroy the IGBTs and the contacts, and closing it while the drive is running causes a current surge that trips the drive.

**Why does the residual-current device trip when a VFD is installed?**
The EMC filter and the capacitance of the shielded cable cause high-frequency leakage current to earth, and DC leakage is also possible. Use an RCD designed for drives (Type B for three-phase drives, Type F for single-phase drives), rated 30 mA only where needed for personal protection, or 100–300 mA for fire protection, following the manufacturer's recommendations.

**Can a VFD be used with an old motor?**
Usually yes, but fast IGBT switching produces high peak voltages at the motor terminals when the cable is long, and the insulation of an old motor may not withstand them. Keep the cable short, use a dv/dt filter or sine filter for long runs, and check cooling when running at low speed.
