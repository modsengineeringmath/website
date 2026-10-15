---
title: "Direct-On-Line (DOL) Motor Starter: Power Circuit, Self-Holding Control Circuit, Two-Location Control, Jogging and Step-by-Step Device Selection"
url: https://modsengineeringmath.com/learn/en/motor-control/dol-starter/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> The direct-on-line circuit for 400 V three-phase motors: power circuit with MPCB, contactor and overload relay; the self-holding (seal-in) control circuit; why the STOP button must be NC and wired in series; multi-location control; jog buttons; pilot lights; the sequence of operation; panel wiring; and a complete device-selection example for a 7.5 kW motor.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/dol-starter/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Direct-On-Line (DOL) Motor Starter: Power Circuit, Self-Holding Control Circuit, Two-Location Control, Jogging and Step-by-Step Device Selection

THภาษาไทยENEnglish

// Chapter 21.6 · AC Motor Control · Direct-On-Line Starter


DOL is the simplest and most common motor circuit, and the template for all the others: a reversing starter is two interlocked DOL starters, and a star–delta starter is a DOL starter with extra contactors and a timer. Understand this page in depth and the following pages become much easier.

In 30 seconds

- Power circuit: Q1 (short circuit) → K1 (switching) → F2 (overload) → motor

- Control circuit: F2 95-96 → STOP (NC) → [START (NO) ∥ K1 13-14] → coil K1

- All STOP buttons in series, all START buttons in parallel

- Self-holding gives no-volt release safety: after a power failure the motor does not restart by itself

- 7.5 kW motor: MPCB 13–18 A · 18 A AC-3 contactor · 2.5 mm² cable (≤ 60 m)

## Power circuit Basic

Figure 1 · DOL power circuit: three devices perform three different duties, and none may stand in for another (e.g. using the breaker to switch the motor on and off every day).

L1 DOL starting current

$$I_{st} = k_{st}\,I_n \qquad k_{st} = I_a/I_n \approx 6\text{–}8$$

L2 Voltage dip at the transformer

$$\Delta U\% \approx \frac{S_{st}}{S_{sc} + S_{st}}\times 100 \qquad S_{st} = \sqrt3\,V_L\,I_{st} \qquad S_{sc} = \frac{S_{tr}}{u_k}$$

L3 Cable voltage drop

$$\Delta V = \sqrt3\, I\, L\,(R\cos\varphi + X\sin\varphi) \qquad \cos\varphi_{start} \approx 0.3$$

## The self-holding control circuit Basic

Figure 2 · Column 1 drives the coil (STOP · START · K1) · column 2 is the hold-in contact · column 3 the run lamp (K1 43-44) · column 4 the trip lamp (F2 97-98) · the box under coil K1 gives the columns of its contacts

### Sequence of operation

- Normal state: F2 95-96 closed · S0 closed · S1 open · K1 13-14 open → coil not energised

- Press S1: current flows through S1 to coil K1 → K1 pulls in → main contacts connect the motor · 13-14 closes · 43-44 lights the run lamp

- Release S1: current still reaches the coil through 13-14, which is in parallel with S1 → self-holding

- Press S0: every path is broken → K1 drops out → 13-14 opens → releasing S0 does not bring it back

- Overload: F2 95-96 opens just like pressing STOP · 97-98 closes and the trip lamp lights · remove the cause, then reset

- Power failure: the coil loses supply, K1 drops out and the latch is lost → when power returns the motor does not start by itself

L4 Seal-in logic

$$K1_{\text{new}} = \overline{F2}\cdot\overline{S0}\cdot(S1 + K1_{\text{old}})$$

Why STOP must be NC: if you used an NO button wired as “press to break”, a loose wire or a dirty contact would mean pressing STOP does nothing. With an NC button wired in series, a broken wire stops the machine by itself — it fails safe. The same reasoning applies to overload contact 95-96 and to the emergency stop.

JavaScript is needed for the simulator

## NEMA/JIC version: the same circuit drawn the American way Intermediate

Machines from North America and plants designed to NFPA 79 / the NEC draw a DOL starter as a power circuit plus a control ladder on one sheet. This is the same circuit as figures 1–2 at 480 V 3Φ 60 Hz with 120 V control from a control transformer.

Figure 2a · NEMA/JIC direct-on-line starter: disconnect + fuses → starter M (L1 L2 L3 → T1 T2 T3) → OL heaters → motor · 480/120 V control transformer (X2 grounded) → ladder STOP – START ∥ M – coil M – OL

### Compared with the IEC figures 1–2

- Three-wire ladder: STOP (NC) – START (NO) in parallel with auxiliary contact M (NO) – coil M – OL (NC) — the same logic as IEC, read left to right

- OL sits next to the coil near grounded rail X2 (IEC puts the overload contact at the head of the circuit); the OL heaters are in the power circuit

- Numbers under the coil “1 2 3”: M has NO contacts on rung 1 (hold-in) and rung 2 (RUN lamp) and an NC contact on rung 3 (OFF lamp)

- Control transformer: primary fuses FU1 FU2 on H1 H4, secondary fuse FU3 on X1 and X2 grounded — the same reason as IEC’s “coil on N”: an earth fault in the control wiring must not pick up the coil

- No terminal numbers 1-2, 13-14 or 95-96 — device names (M, OL) and wire numbers 1–6 take their place · NEMA starters are chosen by hp: a 10 hp 460 V motor (FLA 14 A) takes size 1 — see the table on the symbols page

## Multi-location control and jogging Intermediate

Machines often need to be controlled both at the panel and out on the floor. The rule is all STOP buttons in series (any one stops it) and all START buttons in parallel (any one starts it). A jog (inching) button runs the motor only while it is held, for positioning a conveyor or a tool. It is made with a combined NO+NC button: the NC part breaks the self-holding path and the NO part feeds the coil directly.

Figure 3 · Combined jog button: the NC contact must open before the NO contact closes (break-before-make), otherwise the motor stays latched after the button is released.

Frequent jogging is AC-4 duty: the contactor breaks the starting current every time, so derate the contactor or choose a larger size, and watch for motor overheating from frequent starts.

## Selecting the complete set of devices step by step Intermediate

Example L-1

### A 7.5 kW 400 V 14.6 A water pump, 60 m from the panel, fed by a 500 kVA uk 4 % transformer

- L1: $I_{st} = 6.5 \times 14.6 = 95$ A

- L2: $S_{st} = \sqrt3(400)(95) = 65.8$ kVA · $S_{sc} = 500/0.04 = 12.5$ MVA → $\Delta U = 65.8/(12{,}500 + 65.8) = 0.5\,\%$ at the transformer — direct-on-line starting is easily acceptable

- 18 A AC-3 contactor · MPCB 13–18 A range set to 14.6 A, class 10 (the pump runs up in < 2 s)

- L3 with 2.5 mm² cable (R = 0.0225/2.5 = 9 mΩ/m): while running $\Delta V = \sqrt3(14.6)(60)(0.009 \times 0.82 + 0.00008 \times 0.57) = 11.3$ V = 2.8 % ✓

- During starting $\Delta V = \sqrt3(95)(60)(0.009 \times 0.3 + 0.00008 \times 0.95) = 27.4$ V = 6.9 % — together with the transformer dip still below 10 % ✓

- Control circuit 230 VAC through a 2 A fuse · START/STOP buttons · run/trip lamps

## Wiring inside the panel: good practice

- Power-circuit wire colours to the applicable standard (in Thailand, per the EIT (Engineering Institute of Thailand) wiring code: L1 brown, L2 black, L3 grey, N blue, PE green-yellow); use a distinct colour for control wiring, e.g. red (AC) and dark blue (DC)

- Fit wire-number markers on both ends as per the drawing, and crimp a lug or ferrule on every stranded conductor

- Connect door-mounted push-buttons through terminal strip -X1, not directly from devices inside the panel, so the door can be removed for service

- Test the control circuit before connecting the motor: isolate the power circuit, press START/STOP and check that the contactors and lamps operate in the right sequence

- Test the overload relay with its TEST button while running: the motor must stop and the trip lamp must light

## Frequently asked questions

Why use a self-holding auxiliary contact instead of a maintained switch?
For safety: when the power fails and returns, a self-holding circuit does not restart the motor by itself (no-volt release), because the contactor drops out when the supply is lost and someone has to press START again. With a maintained switch the motor would start the moment power returns, which is dangerous for anyone working on the machine (IEC 60204-1 requires protection against unexpected restarting).

How large a motor can be started direct-on-line?
There is no single number. It depends on the strength of the supply (transformer size, cable length) and the utility's requirements. The general rule is that the voltage dip at the main switchboard during starting should not exceed 10–15 % and must not disturb other equipment. Check it with the voltage-drop calculator on this page, and check the local utility's connection requirements.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why use a self-holding auxiliary contact instead of a maintained switch?**
For safety: when the power fails and returns, a self-holding circuit does not restart the motor by itself (no-volt release), because the contactor drops out when the supply is lost and someone has to press START again. With a maintained switch the motor would start the moment power returns, which is dangerous for anyone working on the machine (IEC 60204-1 requires protection against unexpected restarting).

**How large a motor can be started direct-on-line?**
There is no single number. It depends on the strength of the supply (transformer size, cable length) and the utility's requirements. The general rule is that the voltage dip at the main switchboard during starting should not exceed 10–15 % and must not disturb other equipment. Check it with the voltage-drop calculator on this page, and check the local utility's connection requirements.
