---
title: "Motor Terminals U1 V1 W1 U2 V2 W2: Meaning, Star and Delta Wiring, Wire Colours and Identifying Leads"
url: https://modsengineeringmath.com/en/blog/motor-terminal-markings-u1-v1-w1/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-14
---

> U1 V1 W1 U2 V2 W2 name the 3-phase motor windings (IEC 60034-8): letter = phase, 1 = start, 2 = end. Star and delta box layouts, wire colours, reversing, single-phase U1 U2 Z1 Z2 and finding leads.

Markdown copy of https://modsengineeringmath.com/en/blog/motor-terminal-markings-u1-v1-w1/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Motor Terminals U1 V1 W1 U2 V2 W2: Meaning, Star and Delta Wiring, Wire Colours and Identifying Leads

THภาษาไทยENEnglish
// Article · 3-phase motors


Open the terminal box of a 3-phase motor and you find six terminals: U1 V1 W1 U2 V2 W2. The names are not arbitrary. They tell you which winding sits between which terminals and which end is the start. This article covers what they mean, how to place the links for star and delta, wire colours, reversing, single-phase motors, and how to identify leads when the markers have fallen off.

In 30 seconds

- Letter = winding: U, V, W are the three phase windings · 1 = start, 2 = end (IEC 60034-8)

- The supply L1 L2 L3 always goes to U1 V1 W1, in star and in delta

- Star (Y): join W2–U2–V2 together · Delta (Δ): U1–W2, V1–U2, W1–V2

- Reversing: swap any two supply lines

- Choose star or delta from the voltage on the nameplate, not from habit

## What do U1 V1 W1 U2 V2 W2 mean?

A 3-phase induction motor has three windings displaced by 120 electrical degrees. IEC 60034-8 names their ends with a letter for the winding and a number for the end.

Each winding has two ends: 1 is the start and 2 is the end. A six-terminal motor brings all six ends out to the terminal box.

| Winding | IEC (current) | Older (German/European) | NEMA (US, 6-lead) |

| Phase U | U1 – U2 | U – X | T1 – T4 |

| Phase V | V1 – V2 | V – Y | T2 – T5 |

| Phase W | W1 – W2 | W – Z | T3 – T6 |

What this means in practice: no winding connects U1 to V1. With the links removed, the resistance between U1 and V1 must read open circuit, while U1 to U2 reads the winding resistance (usually a few ohms). That is the basis of finding leads when the markers are lost, at the end of this article.

## The six-terminal box: star and delta

The top row reads U1 V1 W1 and the bottom row is shifted by one place to W2 U2 V2 (W2 sits under U1). The shift is deliberate: the same set of links fits both connections without crossing wires.

The supply goes to U1 V1 W1 in both cases; only the direction of the links changes.

| | Star (Y) | Delta (Δ) |

| Links | horizontal, joining W2–U2–V2 | vertical: U1–W2, V1–U2, W1–V2 |

| Voltage per winding | $V_L/\sqrt{3}$ | $V_L$ |

| Line current | $I_L = I_{ph}$ | $I_L = \sqrt{3}\,I_{ph}$ |

| Use when the nameplate reads (on a 400 V supply) | 230/400 V | 400/690 V |

The delta pairs U1–W2, V1–U2, W1–V2 connect the start of each winding to the end of the previous one, going round U → V → W → U. The memory trick and the nameplate rule are in 3-Phase Motor Delta Connection.

## Wire colours: motor leads and supply conductors

- Motor leads have no standard colour. IEC 60034-8 specifies letters and numbers, not colours. Many manufacturers use one colour for all leads and print the marking on a sleeve; others use colours that differ from brand to brand. Go by the printed marking and the diagram inside the terminal-box lid.

- Supply conductors to IEC 60445 (and Thai standard TIS 11-2553): L1 brown · L2 black · L3 grey · N blue · PE green-yellow.

- Wiring brown → U1, black → V1, grey → W1 makes inspection easy, but colour does not guarantee phase sequence. Older installations may use older colour codes. Confirm with a phase-sequence meter or a short test run.

- Always connect PE to the earth terminal ⏚ in the terminal box, whether the motor is in star or delta.

## Direction of rotation and reversing

Under IEC 60034-8, when L1 L2 L3 in phase sequence are connected to U1 V1 W1, the motor turns clockwise looking at the drive-end shaft. To reverse it:

- Swap any two supply lines, for example L1 and L2. The rotating magnetic field reverses.

- Do not change the links in the terminal box, and never reverse the start and end of only one winding: in delta that drives a very large circulating current.

- For frequent reversing, use a reversing circuit with two interlocked contactors.

## Motors with only three terminals

Some small motors are connected in star or delta internally and bring out only three terminals (often marked U V W or U1 V1 W1). Such a motor cannot be reconnected: it runs only at the single nameplate voltage and cannot use a star–delta starter. To reduce starting current, use a soft starter or a variable-frequency drive (VFD) instead.

## Single-phase motors: U1 U2 Z1 Z2

Single-phase induction motors use different markings. In IEC 60034-8 the main winding is U1–U2 and the auxiliary winding is Z1–Z2, which is in series with the capacitor. To reverse the motor, swap Z1 and Z2 of the auxiliary winding relative to the main winding, following the diagram for that model.

To run a 3-phase motor from a single-phase supply, the proper method is a VFD with single-phase input and 3-phase 230 V output, with a 230/400 V motor connected in delta. Connecting a capacitor directly to a 3-phase motor also works, but the output drops considerably and the capacitor has to suit the load.

## Markers lost: how to identify the leads

- Find the winding pairs. Measure the leads two at a time on the ohms range. Ends that are connected belong to the same winding; you will find three pairs with similar resistance. Call them U, V and W.

- Find start and end. An ohmmeter cannot tell you this. You need a polarity test, for example pulsing a low DC voltage into one winding and watching the meter deflection on another, following the manufacturer's or rewinder's procedure.

- Test the insulation with an insulation-resistance tester between each winding and the frame, and between windings, before energising.

If one winding is reversed in a delta connection, the voltages round the delta no longer cancel and a very large circulating current flows even with no load. If in doubt, have a motor rewinder check it.

## Checks before energising

- The nameplate voltage matches the connection (the Δ figure must equal the supply line voltage to use delta)

- All three links fitted (delta) or the bottom row fully joined (star), with nuts tightened

- Earth connected, terminal-box lid closed and sealed

- Overload set to the nameplate current for the voltage in use

- A short test run to check direction before coupling the load

## Keep learning

The full lessons are available in English, with Thai versions alongside.

- 3-Phase Motor Delta Connection: U1–W2, V1–U2, W1–V2

- Star and delta motor connections and choosing from the nameplate

- Star–delta starters: reducing starting current

- Forward–reverse motor control circuits

- How to set a star–delta timer

## Frequently asked questions

What do U1 V1 W1 U2 V2 W2 mean?
They name the winding ends of a 3-phase motor under IEC 60034-8. The letters U, V and W are the three phase windings; 1 is the start of a winding and 2 is its end. The U winding therefore lies between U1 and U2, and likewise V1–V2 and W1–W2.

How do I wire a motor in star at the terminal box?
Connect L1 L2 L3 to U1 V1 W1 and place horizontal links joining the bottom row W2 U2 V2 together to form the star point.

How do I wire a motor in delta at the terminal box?
Connect L1 L2 L3 to U1 V1 W1 and place three vertical links, giving U1–W2, V1–U2 and W1–V2.

What colour are the U1 V1 W1 wires?
IEC 60034-8 does not specify colours for the motor leads; follow the printed markings and the diagram inside the terminal-box lid. Supply conductors to IEC 60445 are L1 brown, L2 black, L3 grey, N blue and PE green-yellow.

How do I reverse a 3-phase motor?
Swap any two of the three supply lines, for example L1 and L2. Do not change the links inside the terminal box.

## More articles worth reading

Motors · research
How Many Seconds Should a Star–Delta Timer Be Set To? Numerical Experiments on a Squirrel-Cage Induction Motor: Changeover Time, Dead Time, Current and Energy
How many seconds for a star–delta timer? Research simulating a 7.5 kW squirrel-cage motor: t = c·τm, a c table by load, dead time, KM3 phase order,…
19 Oct 2026Read the article →

3-phase motors
3-Phase Motor Delta (Δ) Connection: Remember U1–W2, V1–U2, W1–V2 and Choose from the Nameplate
What U1 V1 W1 U2 V2 W2 mean on a 3-phase motor (IEC 60034-8), which wire colours go where, and how to link U1-W2, V1-U2, W1-V2 for delta, with line…
17 Oct 2026Read the article →

Power factor
How to Calculate the Size of a Power Factor Correction Capacitor (kvar) with an Example
The formula Qc = P(tan φ1 − tan φ2) with a 100 kW, 400 V load corrected from PF 0.75 to 0.95 giving 55.3 kvar, microfarads per phase, a multiplier…
16 Oct 2026Read the article →

All 5 articles in Power Systems & Motors → · All articles

## Frequently asked questions

**What do U1 V1 W1 U2 V2 W2 mean?**
They name the winding ends of a 3-phase motor under IEC 60034-8. The letters U, V and W are the three phase windings; 1 is the start of a winding and 2 is its end. The U winding therefore lies between U1 and U2, and likewise V1–V2 and W1–W2.

**How do I wire a motor in star at the terminal box?**
Connect L1 L2 L3 to U1 V1 W1 and place horizontal links joining the bottom row W2 U2 V2 together to form the star point.

**How do I wire a motor in delta at the terminal box?**
Connect L1 L2 L3 to U1 V1 W1 and place three vertical links, giving U1–W2, V1–U2 and W1–V2.

**What colour are the U1 V1 W1 wires?**
IEC 60034-8 does not specify colours for the motor leads; follow the printed markings and the diagram inside the terminal-box lid. Supply conductors to IEC 60445 are L1 brown, L2 black, L3 grey, N blue and PE green-yellow.

**How do I reverse a 3-phase motor?**
Swap any two of the three supply lines, for example L1 and L2. Do not change the links inside the terminal box.
