---
title: "Motor Starter Simulator: DOL, Reversing, Star–Delta, Soft Starter and VFD"
url: https://modsengineeringmath.com/learn/en/motor-control/motor-lab/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> A free in-browser starting simulator for a 7.5 kW 400 V 50 Hz induction motor: press START and STOP and watch contactors pull in, timers count down, the control-circuit state and real-time plots of current, speed and torque, all from a double-cage equivalent-circuit model and the equation of motion. Change between pump, conveyor and fan loads, set timers and dead time, inject phase-loss and overload faults, and work through 6 worksheets.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/motor-lab/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Motor Starter Simulator: DOL, Reversing, Star–Delta, Soft Starter and VFD

THภาษาไทยENEnglish

// Chapter 21.14 · AC Motor Control · Starter Simulator


A virtual lab for trying things you cannot or should not do on a real machine: starting a heavy load in star–delta, setting the timer too short, letting a phase drop out, or reversing while the motor is still turning. Every number comes from the same motor model used throughout the course.

How to use it

- Pick a starting method from the tabs · press START/STOP like real push-buttons (you can hold them)

- Left: the power circuit — energised contactors turn green, live conductors turn red — plus the control-circuit state step by step

- Right: meters and a plot of the last 20 seconds · below: load, settings and faults

## Simulator

JavaScript is needed for the simulator

## The model behind it

Every 1 ms the program computes the slip from the present speed, solves the per-phase equivalent circuit (R₁, X₁, Xm and a double-cage rotor) at the voltage and frequency the motor is receiving at that instant to get current and torque, and then integrates $J\,d\omega/dt = T_m - T_L$. The overload uses a first-order thermal model $d\theta/dt = ((I/I_r)^2 - \theta)/\tau$ and trips when $\theta \ge 1.2^2$, which gives a class 10 curve. During star–delta, current and torque in the Y stage are 1/3 of their delta values, as in formulas Y1–Y2.

## Six worksheets

### 1 · Direct-on-line starting current
DOL with a pump load of 0.7 Tn: record the peak current, the time for the speed to reach 1400 rpm and the running current, and compare with Ia/In on the nameplate.
Expect: ~90 A (6.5 In), run-up in under 1 s

### 2 · Normal star–delta start
Load 0.7 Tn, timer 6 s: record the current in the Y stage and the surge at changeover, as multiples of In, and the ratio to DOL.
Expect: Y stage ≈ 1/3 of DOL

### 3 · Timer too short
Set the timer to 0.5 s and repeat worksheet 2. How much does the changeover surge change? Explain it with the plot on the star–delta page.

### 4 · Heavy load with star–delta
Change to a conveyor at 1.0 Tn. What speed does the motor reach in the Y stage, and why? Try a soft starter limited to 3 In and a VFD on the same load. Which method suits it?

### 5 · Phase loss
Run DOL at 0.7 Tn, then tick “phase loss”. Watch the current, the speed and the time until the overload trips. Then stop and try to restart with the phase still missing.
Expect: no start, current stays high

### 6 · Reversing while turning
On the reversing tab, tick “no interlock via STOP”. Run forward to full speed, then press reverse. Record the peak current and the time to pass through zero speed, and calculate the energy with R5.

## Frequently asked questions

How accurate is this simulator?
The model is the per-phase equivalent circuit of a 7.5 kW 4-pole double-cage motor, tuned to typical catalogue data (In ≈ 14 A, Ia/In ≈ 6.5, Ta/Tn ≈ 2.2, Tk/Tn ≈ 3.0). It computes the steady state at each speed and combines it with the equation of motion, so it is good for learning trends and comparing methods. It does not model detailed electrical transients (except the current surge at the changeover, which is approximated).

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**How accurate is this simulator?**
The model is the per-phase equivalent circuit of a 7.5 kW 4-pole double-cage motor, tuned to typical catalogue data (In ≈ 14 A, Ia/In ≈ 6.5, Ta/Tn ≈ 2.2, Tk/Tn ≈ 3.0). It computes the steady state at each speed and combines it with the equation of motion, so it is good for learning trends and comparing methods. It does not model detailed electrical transients (except the current surge at the changeover, which is approximated).
