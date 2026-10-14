---
title: "PLC Commissioning, Machine Safety and Troubleshooting: Loop Checks, Forcing, Emergency Stop, IEC 60204-1, ISO 13849 and Documentation"
url: https://modsengineeringmath.com/learn/en/plc/commissioning-safety/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> The steps for testing and commissioning a PLC system: pre-energisation checks, point-by-point I/O testing, analog loop checks, the dangers of forcing bits, program backup and version control, stop categories 0, 1 and 2 per IEC 60204-1, emergency stop with a dual-channel safety relay, Performance Level (PL) per ISO 13849-1 and SIL per IEC 62061, light-curtain safety distances per ISO 13855, and a troubleshooting flow for when a machine will not run.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/commissioning-safety/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PLC Commissioning, Machine Safety and Troubleshooting: Loop Checks, Forcing, Emergency Stop, IEC 60204-1, ISO 13849 and Documentation

THภาษาไทยENEnglish

// Chapter 22.9 · PLC · Commissioning & Safety


A program that passes in the simulator is not yet a machine ready for use. Commissioning is when accidents happen most often, because the wiring is incomplete, people are not yet familiar with the machine and the program is being edited live. This page gives a systematic procedure, the safety principles the standards require, and a disciplined way to find faults.

In 30 seconds

- Test in layers: wiring → supplies → I/O point by point → logic without power → live run

- Emergency stop = stop category 0 or 1 through safety devices, not through a standard PLC program

- The required level (PLr) comes from the risk assessment · light-curtain distance $S = K\,T + C$

- Every force needs a procedure, and none may remain at handover

## Testing and commissioning procedure Basic

- Before power-up: check the wiring against the drawings, PE continuity, power-cable insulation resistance (with electronics disconnected) and that terminals are tight

- Energise section by section: 24 VDC control power first, measure the voltage at every I/O group · power circuit still isolated

- Test inputs one at a time: press the real button / trigger the real sensor in the field, watch the bit change in the software, record it on the I/O check sheet

- Test outputs one at a time: with the power circuit still isolated, command each output (using test mode or a force under procedure) and check the right contactor, valve or lamp operates

- Analog loop check: inject 4 · 12 · 20 mA with a calibrator and read the engineering value in the PLC and on the HMI

- Safety tests: every emergency stop, safety gate and light curtain — check that power is really removed and that reset must be done manually

- Dry logic test: run the whole sequence with the power circuit isolated, simulating sensors

- Live run: one motor at a time, checking direction and current, then the whole sequence, both normal and abnormal cases (pull a sensor, trip an overload)

- Handover: no forces left, program backed up with comments, documentation: I/O list, as-built drawings, drive parameters

Forcing: before forcing an output that makes the machine move, warn everyone in the area, have someone standing at the emergency stop, and log it. Most software shows a warning symbol while a force is active — check it every time before leaving site.

## Stop categories and emergency stop (IEC 60204-1) Intermediate

K1 Stop categories

$$\text{Cat 0: remove power immediately} \qquad \text{Cat 1: controlled stop, then remove power} \qquad \text{Cat 2: controlled stop, power kept on}$$

An emergency stop must be category 0 or 1 only. Category 1 is used when cutting power immediately is more dangerous, e.g. a large centrifuge that must be braked by the drive before power is removed (using a time-delayed safety relay). The emergency-stop button is a red mushroom head on a yellow background, latches when pressed, has positively driven (direct-opening) contacts, and releasing it must not restart the machine by itself.

Figure 1 · The safety relay monitors both channels and cross-channel shorts; its safety contacts are in series with the PLC output, so it can always cut the coil — the PLC only reads the status

## Safety levels: PL and SIL Advanced

ISO 13849-1 assesses risk from three factors: severity of injury (S1 slight / S2 serious), frequency of exposure to the hazard (F1 seldom / F2 frequent) and possibility of avoiding it (P1 possible / P2 scarcely possible). This gives the required level PLr from a to e. The safety function is then designed (category structure B, 1, 2, 3, 4; component lifetime MTTFd; diagnostic coverage DC) so that PL ≥ PLr.

K2 PL / SIL by dangerous failure rate

$$\text{PL d} \approx \text{SIL 2}: 10^{-7} \le PFH_D

| Example function | Typical PLr | Common implementation |

| Emergency stop on a general machine | c–d | Dual-channel button + safety relay + two contactors in series with feedback |

| Safety gate on a cutting machine / press | d–e | Two gate switches or a coded switch + safety PLC |

| Light curtain in front of a press | d–e | Type 4 light curtain + mounting distance per K3 |

K3 Minimum safety distance (ISO 13855)

$$S = K\,T + C \qquad K = 2000\ \text{mm/s (if } S \le 500\ \text{mm)},\ 1600\ \text{mm/s (otherwise)} \qquad C = 8(d - 14)\ \text{mm},\ d \le 40\ \text{mm}$$

Example K-1

### A 14 mm resolution light curtain with a total stopping time of 120 ms

- Total time T = light-curtain response + safety relay + machine stopping time (measured) = 0.12 s

- $C = 8(14 - 14) = 0$ · $S = 2000(0.12) + 0 = 240$ mm ≤ 500 ✓ so K = 2000 applies

- Mount the light curtain at least 240 mm from the hazard point (the standard's minimum is 100 mm) and prevent reaching over the top or around the sides

## Troubleshooting when the machine will not run Intermediate

- Check the PLC status: RUN/STOP, ERR lamp, battery lamp, event log (diagnostic buffer)

- Check the HMI: alarm messages, the step it is stuck in (if written as a state machine)

- Work back from the output: an output that should be on but is not → open that rung online → find the contact that is “not green” → is it an input or an internal bit?

- If it is an input: look at the module LED → if off, measure the voltage at the terminal → check the sensor / wiring / sensor supply

- If the output bit is 1 but the device does not operate: output LED → output fuse → interposing relay → coil → hard-wired interlocks (auxiliary NC, 95-96, safety relay)

Golden rule: “change one thing at a time and record every change”, especially when editing the program online. Keep a copy before every edit and name the file with the date and the reason.

## Documentation to hand over

- As-built electrical drawings with the bill of materials

- I/O list (address, tag name, description, signal type, scaling range)

- Commented PLC and HMI programs as source files (not just an upload from the PLC), with passwords handed to the owner

- Parameter settings of every drive and smart device

- Signed I/O check sheets, loop checks and safety-function test results

- Operating manual and recovery procedure after an emergency stop

## Frequently asked questions

Why is forcing bits in a PLC dangerous?
A force sets a bit regardless of the program conditions or the real state of the input. The machine may move when nobody expects it, software interlocks are bypassed, and if the force is forgotten it stays in place until an accident happens. There should be a procedure: get permission, warn everyone in the area, log it, and check that no forces remain before handing over the machine.

Can I wire the emergency-stop button into the PLC and let the program cut the outputs?
Not with a standard PLC. An emergency stop needs a reliability level assessed to ISO 13849-1 or IEC 62061, which general-purpose PLCs are not certified for. Use a safety relay or a safety PLC that removes power from the actuators directly, and bring its status into the PLC for display and for sequencing the restart.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why is forcing bits in a PLC dangerous?**
A force sets a bit regardless of the program conditions or the real state of the input. The machine may move when nobody expects it, software interlocks are bypassed, and if the force is forgotten it stays in place until an accident happens. There should be a procedure: get permission, warn everyone in the area, log it, and check that no forces remain before handing over the machine.

**Can I wire the emergency-stop button into the PLC and let the program cut the outputs?**
Not with a standard PLC. An emergency stop needs a reliability level assessed to ISO 13849-1 or IEC 62061, which general-purpose PLCs are not certified for. Use a safety relay or a safety PLC that removes power from the actuators directly, and bring its status into the PLC for display and for sequencing the restart.
