---
title: "3-Phase Motor Delta (Δ) Connection: Remember U1–W2, V1–U2, W1–V2 and Choose from the Nameplate"
url: https://modsengineeringmath.com/en/blog/3-phase-motor-delta-connection/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-17
---

> How to connect a 3-phase motor in delta: links U1-W2, V1-U2, W1-V2, line vs phase voltage and current, choosing from a 230/400 V or 400/690 V nameplate, and a 16-second video.

Markdown copy of https://modsengineeringmath.com/en/blog/3-phase-motor-delta-connection/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# 3-Phase Motor Delta (Δ) Connection: Remember U1–W2, V1–U2, W1–V2 and Choose from the Nameplate

THภาษาไทยENEnglish
// Article · 3-phase motors


A delta connection joins the three windings of a 3-phase induction motor end to end in a closed triangle and feeds the supply into its three corners. In the terminal box it takes only three links. This article covers how to remember the pairs, the voltage and current relationships, and what to check on the nameplate before switching on.

The 30-second summary

- Link U1–W2 · V1–U2 · W1–V2, then connect L1 → U1, L2 → V1, L3 → W1

- Each winding sees the full line voltage, $V_{ph}=V_L$, and the line current is $I_L=\sqrt{3}\,I_{ph}$

- Use delta only when the Δ figure on the nameplate equals the supply's line voltage, for example 400/690 V on a 400 V supply

## Watch the 16-second summary

U1–W2 · V1–U2 · W1–V2

### 3-Phase Motor Delta Connection
YouTube Shorts · 16 seconds · over 66,000 views · Thai narration

Taught by Ajarn ModOpen on YouTube ↗

## How to remember U1–W2, V1–U2, W1–V2

Each phase winding has a start (number 1) and an end (number 2): U1–U2, V1–V2 and W1–W2. A delta connection joins the start of one phase to the end of the previous phase, going round in the order U → V → W → U, and the supply is connected to the three junctions.

- Start of U (U1) joins the end of W (W2) and is fed from L1

- Start of V (V1) joins the end of U (U2) and is fed from L2

- Start of W (W1) joins the end of V (V2) and is fed from L3

Left: the delta circuit, three windings joined end to end in a closed loop · Right: the terminal box to IEC 60034-8 with three vertical links; terminal colours match each phase winding

## Why the bottom row of the terminal box reads W2 U2 V2

In a six-terminal box the top row is U1 V1 W1, while the bottom row is shifted by one position to W2 U2 V2 (W2 sits under U1). The shift is deliberate: the same set of links serves both connections.

- Delta (Δ): place three vertical links to get exactly U1–W2, V1–U2, W1–V2

- Star (Y): place the links horizontally to join W2, U2 and V2 into the star point

The supply enters at U1, V1 and W1 in both cases. A side-by-side drawing of both link layouts, including the older U-X, V-Y, W-Z markings, is in the lesson star and delta motor connections.

## Voltage and current in a delta connection

In delta each winding sits directly between two lines, so the winding voltage equals the line voltage. The current at each corner is the phasor difference of two winding currents that are 120° apart.

$$V_{ph}=V_L, \qquad I_L=\sqrt{3}\,I_{ph}, \qquad P=\sqrt{3}\,V_L I_L\cos\varphi$$

- A motor connected in delta on a 400 V system draws a line current of 15 A. The voltage across each winding is

$$V_{ph}=V_L=400\ \text{V}$$

- The current in each winding is

$$I_{ph}=\frac{I_L}{\sqrt{3}}=\frac{15}{1.732}\approx 8.66\ \text{A}$$

A clamp meter around a supply cable reads the line current, not the winding current. Divide by √3 to get the current in a winding.

Where the $\sqrt{3}$ comes from, and the full comparison of star and delta, is covered in phasors and three-phase systems: Y and Δ (in Thai).

## Choosing delta or star from the nameplate

The common mistake is not placing the links but choosing the connection without reading the nameplate. Its two figures give the line voltage to use in delta (the lower value) and in star (the higher value).

| Nameplate (Δ / Y) | On a 400 V 3-phase supply connect in | If connected wrongly |

| 230/400 V (older plates: 220/380 V) | Star (Y) | In delta each winding sees √3 times its rating, the core saturates, the current is very high and it burns out quickly |

| 400/690 V (older plates: 380/660 V) | Delta (Δ) | In star each winding gets only 1/√3 of its voltage, torque falls to about 1/3, and under load it draws too much current and overheats |

Rule of thumb: the Δ figure on the nameplate must equal the supply's line voltage before you connect in delta. A 400/690 V motor on a 400 V supply is exactly the kind that can use a star-delta starter: it starts in star, cutting the starting current to about 1/3, then switches to delta once it is up to speed.

## Steps to connect delta at the terminal box

- Isolate the supply, apply lockout/tagout and prove that no voltage is present

- Read the nameplate: the Δ figure must match the supply's line voltage

- Fit three vertical links U1–W2, V1–U2, W1–V2 and tighten the nuts

- Connect L1 → U1, L2 → V1, L3 → W1 and the protective earth (PE) to the motor's earth terminal

- Test run. If it turns the wrong way, swap any two supply lines; see forward-reverse control of a 3-phase motor

## Continue in the library

- Star and delta motor connections: terminal box, nameplate and what happens when it is wrong

- How the 3-phase induction motor works: rotating field and slip

- The star-delta starter in detail

- Motor starter simulator: wire it yourself on screen

- Read next: what power factor is and why motors lower it

## Frequently asked questions

Which terminals are linked for a delta connection?
Three pairs: U1–W2, V1–U2 and W1–V2. In a standard IEC terminal box this means three vertical links, with L1 to U1, L2 to V1 and L3 to W1.

Can a 230/400 V motor be connected in delta on a 400 V supply?
No. The 230 V figure is the line voltage for delta. On a 400 V supply it must be connected in star. In delta each winding would see √3 times its rated voltage, the current becomes very high and the motor can burn out.

How do line current and winding current differ in delta?
In delta the winding voltage equals the line voltage, and the line current is √3 times the winding current. For example, a 15 A line current means about 8.66 A in each winding.

The motor runs backwards after connecting in delta. What should I do?
Switch off and swap any two supply lines, for example L1 and L2. The links in the terminal box stay as they are.

## More articles worth reading

Motors · research
How Many Seconds Should a Star–Delta Timer Be Set To? Numerical Experiments on a Squirrel-Cage Induction Motor: Changeover Time, Dead Time, Current and Energy
How many seconds for a star–delta timer? Research simulating a 7.5 kW squirrel-cage motor: t = c·τm, a c table by load, dead time, KM3 phase order,…
19 Oct 2026Read the article →

Power factor
How to Calculate the Size of a Power Factor Correction Capacitor (kvar) with an Example
The formula Qc = P(tan φ1 − tan φ2) with a 100 kW, 400 V load corrected from PF 0.75 to 0.95 giving 55.3 kvar, microfarads per phase, a multiplier…
16 Oct 2026Read the article →

Power factor
What Is Power Factor? The cos φ Formula and the Relationship between kW, kVA and kvar
Power factor is the ratio of real power to apparent power. See the P Q S power triangle, a worked current calculation at PF 0.8 versus 1.0, lagging…
16 Oct 2026Read the article →

All 4 articles in Power Systems & Motors → · All articles

## Frequently asked questions

**Which terminals are linked for a delta connection?**
Three pairs: U1–W2, V1–U2 and W1–V2. In a standard IEC terminal box this means three vertical links, with L1 to U1, L2 to V1 and L3 to W1.

**Can a 230/400 V motor be connected in delta on a 400 V supply?**
No. The 230 V figure is the line voltage for delta. On a 400 V supply it must be connected in star. In delta each winding would see √3 times its rated voltage, the current becomes very high and the motor can burn out.

**How do line current and winding current differ in delta?**
In delta the winding voltage equals the line voltage, and the line current is √3 times the winding current. For example, a 15 A line current means about 8.66 A in each winding.

**The motor runs backwards after connecting in delta. What should I do?**
Switch off and swap any two supply lines, for example L1 and L2. The links in the terminal box stay as they are.
