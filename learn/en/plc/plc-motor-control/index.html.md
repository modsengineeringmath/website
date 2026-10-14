---
title: "Motor Control with a PLC: DOL, Reversing, Star–Delta, I/O Lists, Wiring, Hard-Wired Interlocks and Contactor Feedback Monitoring"
url: https://modsengineeringmath.com/learn/en/plc/plc-motor-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Convert contactor circuits into PLC programs correctly and safely: what must stay in hardware (emergency stop, overload, K2/K3 interlocks), I/O lists, wiring the PLC to contactor coils, ladder and Structured Text for DOL, reversing and star–delta with a dead time, detecting welded contactors with feedback contacts, and a simulator to try it.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/plc-motor-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Motor Control with a PLC: DOL, Reversing, Star–Delta, I/O Lists, Wiring, Hard-Wired Interlocks and Contactor Feedback Monitoring

THภาษาไทยENEnglish

// Chapter 22.6 · PLC · Motor Control with a PLC


Moving the logic from a relay panel into a PLC gains flexibility, status display and fault detection — but the safety of the original circuit must not be lost. This page draws a clear line between what lives in software and what must stay in hardware, and gives working programs for all three motor circuits.

In 30 seconds

- Keep in hardware: emergency stop via a safety relay · overload 95-96 · NC + mechanical interlocks

- The PLC does: self-holding, sequencing, timers, feedback checks, alarms, run-hour counting

- Feedback: $\text{Fault} = \text{TON}(\text{Cmd} \oplus \text{FB},\ 0.5\text{–}2\ \text{s})$

- Star–delta: Y first → K1 → time elapsed → Y drops out → dead time → Δ

## Dividing the jobs: hardware vs software Basic

| Function | Where | Why |

| Emergency stop | Safety relay / safety PLC cuts coil power + PLC reads the status | Must work even if the standard PLC fails or its program is edited |

| Overload | 95-96 in series with the coil + 97-98 into the PLC | Trips even if the PLC hangs, and the cause can be displayed |

| Short-circuit interlock | Auxiliary NC + mechanical + in the program | A shorted transistor output or a forced bit must not cause a short circuit |

| Self-holding, sequencing, timers | Program | Easy to change, settable from the HMI |

| Detecting a welded / non-pulling contactor | Program + feedback contacts | Only possible when there is a controller with logic |

## DOL with a PLC and feedback checking Basic

| Address | Device | Type |

| I0.0 | -S0 STOP | NC (1 = healthy) |

| I0.1 | -S1 START | NO |

| I0.2 | -F2 97-98 or auxiliary 95-96 | NC (1 = healthy) |

| I0.3 | -K1 13-14 feedback | NO |

| Q0.0 | -K1 coil (via 95-96) | Relay or interposing relay |

| Q0.1 / Q0.2 | Run lamp / fault lamp | — |

M1 Run command

$$\text{Cmd} = I0.0\cdot I0.2\cdot\overline{\text{Fault}}\cdot(I0.1 + \text{Cmd})$$

M2 Feedback discrepancy

$$\text{Fault} \leftarrow \text{TON}(\text{Cmd} \oplus \text{FB},\ t_{fb}) \qquad t_{fb} \approx 0.5\text{–}2\ \text{s}$$

What M2 catches: commanded but not pulled in (blown coil fuse, open coil, 95-96 open) and not commanded but still pulled in (welded contacts, stuck output). The second case is dangerous: raise an alarm and disconnect with the upstream device.

JavaScript is required

## Reversing with a PLC Intermediate

M3 Software interlock

$$Q_F = \overline{S0}\,\overline{OL}\,(S_F + Q_F)\,\overline{S_R}\,\overline{Q_R}\,\overline{FB_R} \qquad Q_R = \overline{S0}\,\overline{OL}\,(S_R + Q_R)\,\overline{S_F}\,\overline{Q_F}\,\overline{FB_F}$$

Adding $\overline{FB}$ of the other direction (feedback from the real contactor) stops the program commanding the new direction until the old contactor has actually dropped out. A reversal delay timer of 0.5–2 s is also commonly added to let the motor slow down.

JavaScript is required

## Star–delta with a PLC Intermediate

Figure 1 · Outputs drive the coils through NC contacts of the opposing contactor (hard-wired) · inputs read the buttons, the overload and all three feedback contacts

M4 Star–delta sequence

$$K_Y = \text{Run}\,\overline{T_Y}\,\overline{K_\Delta} \quad K_1 = \text{Run}\,(K_Y + K_1) \quad K_\Delta = \text{Run}\,\text{TON}(T_Y,\ t_{dead})\,\overline{K_Y}\,\overline{FB_Y}$$

(* Structured Text: star–delta with feedback check *)
Run := (PB_Start OR Run) AND PB_Stop_NC AND OL_NC AND NOT Fault;
TY(IN := Run, PT := T#6S); // star period
KY := Run AND NOT TY.Q AND NOT KD; // K2 star
K1 := Run AND (FB_Y OR K1); // K1 after star has really pulled in
TDead(IN := TY.Q AND NOT FB_Y, PT := T#80MS); // wait for K2 to really drop out, then time the dead band
KD := Run AND TDead.Q; // K3 delta
TChk(IN := (K1 XOR FB_1) OR (KY XOR FB_Y) OR (KD XOR FB_D), PT := T#1S);
IF TChk.Q OR (FB_Y AND FB_D) THEN Fault := TRUE; END_IF
Note: the dead time starts when the feedback from K2 confirms it has dropped out, not when it is commanded off — this protects against a welded K2 contact. A plain relay circuit cannot do this. The simulator below is a simplified version without feedback.

JavaScript is required

Example M-1

### Test the sequence in the simulator and answer the questions

- Press START: record the order in which Q0.1 (Y) and Q0.0 (K1) turn on — why must Q0.1 come on first? (So the star point is made before the windings are energised.)

- Watch the ET bars of T1 and T2: how long is Q0.1 off while Q0.2 is not yet on? (80 ms = the PT of T2.)

- Edit the Q0.1 rung to remove the !Q0.2 condition and reload. Does the system still work, and why should this interlock stay anyway?

## Frequently asked questions

With a PLC, do I still need auxiliary-contact interlocks in the coil circuit?
Yes. The interlocks that prevent short circuits (K1/K2 for reversing, K2/K3 for star–delta) must work even if the PLC fails, a transistor output shorts on, or someone forces a bit. An NC contact of the opposing contactor in series with each coil, plus a mechanical interlock, is still required. The program is an additional layer, not the only one.

Can I wire the overload relay only to the PLC?
Technically yes, but good practice is to put 95-96 in series with the contactor coil directly (so it trips even if the PLC hangs) and bring 97-98 or an auxiliary contact into the PLC for status display and event logging.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**With a PLC, do I still need auxiliary-contact interlocks in the coil circuit?**
Yes. The interlocks that prevent short circuits (K1/K2 for reversing, K2/K3 for star–delta) must work even if the PLC fails, a transistor output shorts on, or someone forces a bit. An NC contact of the opposing contactor in series with each coil, plus a mechanical interlock, is still required. The program is an additional layer, not the only one.

**Can I wire the overload relay only to the PLC?**
Technically yes, but good practice is to put 95-96 in series with the contactor coil directly (so it trips even if the PLC hangs) and bring 97-98 or an auxiliary contact into the PLC for status display and event logging.
