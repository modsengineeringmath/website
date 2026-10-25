---
title: "What Is Power Factor? The cos φ Formula and the Relationship between kW, kVA and kvar"
url: https://modsengineeringmath.com/en/blog/power-factor-explained/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> Power factor is the ratio of real power to apparent power. See the P Q S power triangle, a worked current calculation at PF 0.8 versus 1.0, lagging versus leading PF, and the effect of harmonics.

Markdown copy of https://modsengineeringmath.com/en/blog/power-factor-explained/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# What Is Power Factor? The cos φ Formula and the Relationship between kW, kVA and kvar

THภาษาไทยENEnglish
// Article · Power Factor


Power factor tells you how much of the electrical power supplied to a load is turned into real work. A low value means the cables and transformers carry current that does no work. This article explains it with the power triangle and numeric examples.

30-second summary

- $\text{PF}=\dfrac{P}{S}=\cos\varphi$ when voltage and current are sinusoidal

- P = real power (kW) · Q = reactive power (kvar) · S = apparent power (kVA), and $S^2=P^2+Q^2$

- Same real power but a low PF ⇒ the current rises by a factor of $1/\text{PF}$

## What is power factor

In an AC circuit, voltage and current do not necessarily rise and fall together. If they are out of phase by an angle $\varphi$, the power converted to real work is only a fraction of $V\times I$.

$$P = V I \cos\varphi, \qquad S = V I, \qquad \text{PF} = \frac{P}{S} = \cos\varphi$$

Here $V$ and $I$ are RMS values. A purely resistive load (a heater, an incandescent lamp) has $\varphi=0$ and PF = 1. Induction motors, transformers and iron-core ballasts contain coils, which make the current lag the voltage, so their PF is below 1.

## The P Q S power triangle

The three kinds of power are related as a right triangle.

| Power | Symbol · unit | Meaning | Formula |

| Real power | $P$ · W, kW | Power converted to work, heat, light or torque | $VI\cos\varphi$ |

| Reactive power | $Q$ · var, kvar | Power that shuttles back and forth between the source and the magnetic or electric field in the load | $VI\sin\varphi$ |

| Apparent power | $S$ · VA, kVA | The burden that cables, transformers and generators must support | $VI=\sqrt{P^2+Q^2}$ |

For a balanced three-phase system, using line voltage and line current, $P=\sqrt{3}\,V_L I_L\cos\varphi$ and $S=\sqrt{3}\,V_L I_L$.

## Example: a 230 V, 10 A load with a lagging PF of 0.8

- Apparent power and real power

$$S=VI=230\times10=2300\ \text{VA},\qquad P=S\cos\varphi=2300\times0.8=1840\ \text{W}$$

- Reactive power from the power triangle

$$Q=\sqrt{S^2-P^2}=\sqrt{2300^2-1840^2}=1380\ \text{var}$$

- If the PF is corrected to 1.0 with the same real power, the current needed is

$$I'=\frac{P}{V}=\frac{1840}{230}=8\ \text{A}$$

- Compare the line loss $\propto I^2$

$$\left(\frac{10}{8}\right)^2=1.5625$$

At PF 0.8 the load draws 10 A, but at PF 1.0 only 8 A for the same 1840 W of work. The current differs by 25 % and the line loss is about 56 % higher (2300 : 1840 : 1380 is a 5 : 4 : 3 triangle).

## Lagging and leading PF

- Lagging: the current lags the voltage. Inductive loads (motors, transformers), which make up most of a factory's load.

- Leading: the current leads the voltage. Capacitive loads, or PF-correction capacitors installed beyond what is needed. A long unloaded cable has a similar effect.

A PF value alone does not say whether it is lagging or leading, so state it explicitly, for example "0.8 lagging".

## With harmonics: the true PF is lower than cos φ

Electronic loads such as switching power supplies and rectifiers draw non-sinusoidal current, which lowers the true PF even when the fundamental current is in phase with the voltage.

$$\text{PF}_{true}=\underbrace{\cos\varphi_1}_{\text{displacement}}\times\frac{1}{\sqrt{1+\text{THD}_I^2}}$$

Example: $\cos\varphi_1=1$ and $\text{THD}_I=30\,\%$ give $\text{PF}_{true}=1/\sqrt{1.09}\approx0.958$. Installing PF-correction capacitors alone is therefore not enough, and may cause resonance with the harmonics, so THD must be considered as well.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas.

- What is power factor: analogies and the complete power triangle (in Thai)

- Power factor simulator: see the waveforms and phasors (in Thai)

- PF and the electricity bill: kvar penalties and the 0.85 criterion (in Thai)

- Harmonics and true PF (in Thai)

- Next: how to calculate a PF-correction capacitor

## Frequently asked questions

What is a good power factor?
The closer to 1.0 the better. In Thai practice, customers in tariff classes that carry a penalty usually correct the PF to above 0.85 under the utility's criterion, and design for about 0.95 to allow for light-load periods. See the power factor and electricity bill page for the criteria.

What is the difference between lagging and leading PF?
Lagging means the current lags the voltage, caused by inductive loads such as motors and transformers. Leading means the current leads the voltage, caused by capacitive loads or by too many capacitors installed.

What harm does a low PF cause?
More current is needed for the same real power, so cables, transformers and breakers carry a heavier load, line losses ($I^2R$) and voltage drop increase, and some customer classes must pay a penalty.

How does true PF differ from cos φ?
cos φ is only the displacement PF of the fundamental frequency. If the current is distorted by harmonics, the true PF is $\text{PF}=\cos\varphi_1/\sqrt{1+\text{THD}_I^2}$, which is lower than cos φ.

## More articles worth reading

Power factor
How to Calculate the Size of a Power Factor Correction Capacitor (kvar) with an Example
The formula Qc = P(tan φ1 − tan φ2) with a 100 kW, 400 V load corrected from PF 0.75 to 0.95 giving 55.3 kvar, microfarads per phase, a multiplier…
16 Oct 2026Read the article →

Motors · research
How Many Seconds Should a Star–Delta Timer Be Set To? Numerical Experiments on a Squirrel-Cage Induction Motor: Changeover Time, Dead Time, Current and Energy
How many seconds for a star–delta timer? Research simulating a 7.5 kW squirrel-cage motor: t = c·τm, a c table by load, dead time, KM3 phase order,…
19 Oct 2026Read the article →

3-phase motors
3-Phase Motor Delta (Δ) Connection: Remember U1–W2, V1–U2, W1–V2 and Choose from the Nameplate
How to connect a 3-phase motor in delta: links U1-W2, V1-U2, W1-V2, line vs phase voltage and current, choosing from a 230/400 V or 400/690 V…
17 Oct 2026Read the article →

All 4 articles in Power Systems & Motors → · All articles

## Frequently asked questions

**What is a good power factor?**
The closer to 1.0 the better. In Thai practice, customers in tariff classes that carry a penalty usually correct the PF to above 0.85 under the utility's criterion, and design for about 0.95 to allow for light-load periods. See the power factor and electricity bill page for the criteria.

**What is the difference between lagging and leading PF?**
Lagging means the current lags the voltage, caused by inductive loads such as motors and transformers. Leading means the current leads the voltage, caused by capacitive loads or by too many capacitors installed.

**What harm does a low PF cause?**
More current is needed for the same real power, so cables, transformers and breakers carry a heavier load, line losses ($I^2R$) and voltage drop increase, and some customer classes must pay a penalty.

**How does true PF differ from cos φ?**
cos φ is only the displacement PF of the fundamental frequency. If the current is distorted by harmonics, the true PF is $\text{PF}=\cos\varphi_1/\sqrt{1+\text{THD}_I^2}$, which is lower than cos φ.
