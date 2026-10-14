---
title: "Magnetic Contactors, Overload Relays, Motor Protection Breakers and Control Devices: AC-3, Trip Classes, Timers, Push-Buttons and Pilot Lights"
url: https://modsengineeringmath.com/learn/en/motor-control/control-devices/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Every device in a motor control panel: how a magnetic contactor is built (coil, main and auxiliary contacts), utilization categories AC-1, AC-3, AC-3e and AC-4 to IEC 60947-4-1, a kW-at-400 V sizing table, overload relays and trip classes 10, 20 and 30, motor protection circuit breakers (MPCB), aM fuses, Type 1 and Type 2 coordination, timers, push-button and pilot-light colours to IEC 60204-1, and control transformers.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/control-devices/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Magnetic Contactors, Overload Relays, Motor Protection Breakers and Control Devices: AC-3, Trip Classes, Timers, Push-Buttons and Pilot Lights

THภาษาไทยENEnglish

// Chapter 21.4 · AC Motor Control · Contactors & Overloads


Every motor circuit is built from the same set of devices: a short-circuit protective device, a switching device, an overload protective device and the command devices. This page explains how each one works, what the ratings printed on it mean, and how to choose it so that it lasts on a 400 V 50 Hz system.

In 30 seconds

- Order of duties: short circuit (MPCB/MCCB/fuse) → switching (contactor) → overload (overload relay)

- Choose a contactor by its AC-3 rating at 400 V ≥ motor current, not by its AC-1 current

- Set the overload to the motor In (star–delta: 0.58 In) · class 10 in general · 20/30 for high-inertia loads

- Type 2: after a short circuit the contactor can still be used (light, easily separated contact welding is allowed)

## The magnetic contactor Basic

A contactor is an electromagnetically operated switch. When the coil (A1–A2) is energised, the iron core pulls in the armature, which is fixed to the contact bridge. The main contacts (NO) close the power circuit, while the auxiliary NO contacts close and the NC contacts open. When the coil is de-energised, a spring pushes everything back. The advantages: the 400 V power circuit is separated from the control circuit, it can switch millions of times, and it can be commanded remotely or from a PLC.

Figure 1 · An AC coil needs a shading ring because the flux passes through zero 100 times a second. If the ring cracks, the contactor chatters and hums loudly.

Figure 2 · Standard terminal numbers: main contacts have odd numbers on the line side and even numbers on the load side. Auxiliary contacts use two digits — the tens digit is the sequence number and the units digit gives the contact type.

### The coil: AC or DC

- AC coil (e.g. 230 VAC 50 Hz): at pick-up it draws an inrush current 6–10 times its holding current, because the air gap is large and the impedance is low

- DC coil (e.g. 24 VDC): silent, constant current, suits transistor PLC outputs; it needs a diode or varistor across it to limit the voltage spike at switch-off

- Coil voltage range to IEC 60947-4-1: picks up reliably at 85–110 % Uc and drops out at 20–75 % Uc (AC) — a deep momentary voltage dip can stop a whole production line

D1 Coil operating range

$$0.85\,U_c \le U_{pick\text{-}up} \le 1.1\,U_c \qquad U_{drop\text{-}out} \approx (0.2\text{–}0.75)\,U_c$$

## Utilization categories AC-1, AC-3, AC-4 Intermediate

How hard it is to break a circuit depends on the current that has to be interrupted, so IEC 60947-4-1 rates contactors by utilization category. One and the same contactor has a different rating in each category.

| Category | Application | What the contacts must do |

| AC-1 | Resistive loads, heaters (cos φ ≥ 0.95) | Make and break rated current — the easiest duty, the highest current rating |

| AC-2 | Wound-rotor (slip-ring) motors | Make 2.5 Ie, break 2.5 Ie |

| AC-3 | Squirrel-cage motors: starting, and switching off while running | Make the starting current ~8 Ie but break only the running current ~1 Ie |

| AC-3e | High-efficiency IE3/IE4 motors | As AC-3 but withstands a higher inrush current |

| AC-4 | Inching (jogging) and plugging (reversing while running) | Frequently break the starting current ~6–8 Ie — the heaviest duty |

| AC-15 / DC-13 | Auxiliary contacts switching AC / DC coils | Break small electromagnetic loads |

D2 Contactor selection

$$I_e(\text{AC-3},\,400\ \text{V}) \ge I_n \qquad \text{for AC-4 duty derate to about } 0.3\text{–}0.5\,I_e(\text{AC-3})$$

AC-3 contactor sizes at 400 V and approximate motor power (typical catalogue values)

| Ie AC-3 (A) | 9 | 12 | 18 | 25 | 32 | 38–40 | 50 | 65 | 80 | 95 | 115 | 150 |

| kW at 400 V | 4 | 5.5 | 7.5 | 11 | 15 | 18.5 | 22 | 30 | 37 | 45 | 55 | 75 |

## Overload relays and trip classes Intermediate

An overload relay models the heating of the motor winding. A thermal (bimetal) relay uses strips of two different metals that bend as current flows through a heater; an electronic relay measures current with CTs and calculates. When the threshold is reached, contact 95–96 (NC) opens to de-energise the contactor coil and 97–98 (NO) closes to signal an alarm. The overload relay does not break the power circuit itself — it tells the contactor to break it.

Figure 3 · Trip time falls as current rises. The class gives the maximum trip time at 7.2 times the setting (roughly the starting current) — loads with a long run-up need a higher class.

D3 Overload setting

$$I_r = I_n \;(\text{DOL, reversing, soft starter}) \qquad I_r = \frac{I_n}{\sqrt3} \approx 0.58\,I_n \;(\text{star–delta, in the phase-current path})$$

D4 Trip class check

$$t_{trip}(7.2\,I_r) \le \text{class [s]} \qquad t_{start}

| Class | Trip time at 7.2 Ir | Suitable for |

| 10A | 2–10 s | Submersible pump motors, hermetic compressors with poor cooling |

| 10 | 4–10 s | General duty: pumps, small fans, conveyors (run-up < 5 s) |

| 20 | 6–20 s | Large fans, mixers, crushers (run-up 5–10 s) |

| 30 | 9–30 s | Very high-inertia loads: grinding mills, centrifuges |

Features worth having: ambient temperature compensation (−20…+60 °C), phase-loss sensitivity (differential), manual/automatic reset (use manual for general duty so that the machine does not restart by itself after a trip), and a test button.

## Short-circuit protection: MPCB, MCCB, fuses Intermediate

A short-circuit current of several thousand amperes must be cleared within a few milliseconds. The device doing this must have a breaking capacity no lower than the prospective short-circuit current at the point of installation, and it must not trip falsely during starting.

D5 Breaking capacity

$$I_{cu} \ge I_{k,max}\ \text{at the point of installation} \qquad I_{k} \approx \frac{S_{tr}}{\sqrt3\,V_L\,u_k} \;(\text{at the transformer terminals})$$

D6 No nuisance trip at start

$$I_{m} > (1.5\text{–}2)\,I_{st} \approx (10\text{–}13)\,I_n \qquad (\text{allowing for the asymmetric first half-cycle inrush})$$

| Device | Advantages | Things to know |

| MPCB (e.g. 13–18 A range) | Short-circuit + overload + isolation in one device, adjustable, auxiliary contact signals a trip | Magnetic trip fixed at ~13 × the top of the range · Icu varies by model |

| Motor-type MCCB (magnetic only) | High breaking capacity, used for large motors | Needs a separate overload relay |

| aM fuse | Very good current limiting, withstands starting current | Short-circuit protection only, needs an overload relay · replace all three phases |

| gG fuse | General purpose | Must be a larger size to withstand the starting current |

### Type 1 and Type 2 coordination (IEC 60947-4-1)

Type 1: under a short circuit there is no danger to people or the enclosure, but the contactor and overload relay may be damaged and need replacing · Type 2: after a short circuit the devices remain usable; light contact welding that is easily separated is allowed. Where the line must be back in production quickly, use Type 2, which manufacturers test as a set and publish as coordination tables — use one manufacturer's table for the whole combination.

## Timers and auxiliary relays Basic

- On-delay: coil energised → time runs → contacts change state · coil de-energised → reset immediately — used in star–delta starters and sequential starting

- Off-delay: coil energised → contacts change immediately · coil de-energised → they hold for a set time — used for cooling fans that run on after the machine stops

- Dedicated star–delta timer: separate Y and Δ contacts with a fixed built-in dead time of ~50–100 ms — recommended over a general-purpose timer

- Common terminal numbers: common 15 · delayed NC 16 · delayed NO 18 (or 55-56 / 67-68 on add-on blocks)

## Push-buttons and pilot lights (IEC 60204-1) Basic

| Device | Colour to IEC 60204-1 | Notes |

| START / ON | White (preferred), grey, black, green | Never red |

| STOP / OFF | Black (preferred), grey, white · red allowed | Never green · avoid red if near an E-stop |

| Emergency stop | Red on a yellow background, mushroom head, latching | Contacts with positive opening operation |

| Red light | Emergency, hazardous condition | Immediate action required |

| Yellow light | Abnormal, approaching a critical condition (e.g. tripped) | Investigate |

| Blue light | Action required (e.g. waiting for reset) | — |

| Green light | Normal condition | — |

| White light | Neutral status (e.g. supply on) | — |

Many factories in the region still follow the old convention of green = “motor running” and red = “power available/stopped”. Follow the plant's own standard consistently, and state the meaning on a label on the panel door.

## Control circuit supply Intermediate

Small panels often use 230 VAC taken from L–N through a fuse. IEC 60204-1 requires machine control circuits to be fed through a transformer with separate windings (except for a machine with a single motor starter and no more than two control devices), to lower the voltage and limit the effect of an earth fault. Systems with a PLC usually use 24 VDC from a power supply.

D7 Control transformer sizing

$$S_{tr} \ge \sum S_{hold} + S_{inrush,\,max} \qquad \text{check voltage dip at pick-up} \le 5\text{–}10\,\%$$

Example D-1

### Select the devices for a 7.5 kW 400 V 14.6 A motor, direct-on-line

- D2: AC-3 contactor ≥ 14.6 A → 18 A (rated 7.5 kW at 400 V)

- MPCB 13–18 A range, set Ir = 14.6 A (D3), class 10 · magnetic trip about 13 × 18 = 234 A > peak inrush ~ 2 × 95 = 190 A (D6)

- D5: if a 1000 kVA, uk 6 % transformer is close by, $I_k \approx 1000/(\sqrt3 \times 0.4 \times 0.06) = 24$ kA → use an MPCB model with Icu ≥ 25 kA, or an upstream limiter/fuse according to the manufacturer's table

- D7: three contactors, each holding 8 VA and pulling in at 70 VA → $S \ge 3(8) + 70 = 94$ VA → a 100 VA transformer

## Symbols for all these devices

Figure 4 · The IEC 60617 symbols used in every diagram in this series. How to read drawings in detail is covered in Symbols · Reading diagrams.

## Frequently asked questions

What is the difference between a contactor and a relay?
The principle is the same: a coil pulls in the contacts. A contactor, however, has main contacts designed to break motor current, arc chutes, and ratings by utilization category such as AC-3. A control relay switches small currents in the control circuit (AC-15/DC-13) and is not used to switch a motor directly.

Can an MPCB replace an overload relay?
Yes. An MPCB (motor protection circuit breaker) combines an adjustable thermal overload element and a magnetic short-circuit trip in one device, so it is used with a contactor without a separate overload relay. The exception is a star–delta starter, where the protective device must sit in the phase-current path.

Does the START button have to be green?
IEC 60204-1 allows START/ON buttons in white, grey, black or green, recommends white, and forbids red. STOP/OFF buttons are black, grey or white (black preferred); red is allowed but should not be placed near an emergency-stop button. The emergency stop itself must be red on a yellow background. In practice, panels in Thailand and the region often use a green START and a red STOP, which is still within the accepted range.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between a contactor and a relay?**
The principle is the same: a coil pulls in the contacts. A contactor, however, has main contacts designed to break motor current, arc chutes, and ratings by utilization category such as AC-3. A control relay switches small currents in the control circuit (AC-15/DC-13) and is not used to switch a motor directly.

**Can an MPCB replace an overload relay?**
Yes. An MPCB (motor protection circuit breaker) combines an adjustable thermal overload element and a magnetic short-circuit trip in one device, so it is used with a contactor without a separate overload relay. The exception is a star–delta starter, where the protective device must sit in the phase-current path.

**Does the START button have to be green?**
IEC 60204-1 allows START/ON buttons in white, grey, black or green, recommends white, and forbids red. STOP/OFF buttons are black, grey or white (black preferred); red is allowed but should not be placed near an emergency-stop button. The emergency stop itself must be red on a yellow background. In practice, panels in Thailand and the region often use a green START and a red STOP, which is still within the accepted range.
