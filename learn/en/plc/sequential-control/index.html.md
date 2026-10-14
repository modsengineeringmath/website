---
title: "Sequential Control: State Machines, SFC/GRAFCET, Traffic Lights, Sorting Conveyors and a Batch Mixing Tank"
url: https://modsengineeringmath.com/learn/en/plc/sequential-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> Design sequential PLC programs systematically: state diagrams, steps and transitions per SFC/GRAFCET (IEC 60848), writing them as ladder with SET/RESET and as Structured Text with CASE, worked examples of a two-direction traffic light, a batch mixing tank and automatic tank filling, auto/manual modes, emergency stop, homing, and diagnosing which step a machine is stuck in, with a simulator.

Markdown copy of https://modsengineeringmath.com/learn/en/plc/sequential-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Sequential Control: State Machines, SFC/GRAFCET, Traffic Lights, Sorting Conveyors and a Batch Mixing Tank

THภาษาไทยENEnglish

// Chapter 22.7 · PLC · Sequential Control


Most machines run as a sequence: wait → fill → mix → drain → wait. Writing a sequence with nested self-holding circuits works for small jobs but becomes a tangle as the machine grows. The engineer's method is to think of it as a state machine first, then translate it into any language.

In 30 seconds

- Design steps: list the steps (states) → the transition conditions → the outputs of each step

- Exactly one step is active at a time (except parallel branches in SFC)

- Ladder: SET the next step + RESET the current step in the same rung · ST: CASE State OF

- Outputs are written at the end of the program as an OR of steps

## State machines: steps, transitions, outputs Intermediate

Figure 1 · Two-direction traffic light: six steps in a loop, each with its own timer; the transition condition is that timer elapsing

S1 Transition rule

$$X_{n+1} \leftarrow 1,\ X_n \leftarrow 0 \quad \text{when}\quad X_n \wedge t_{n\to n+1}$$

S2 One active step

$$\sum_i X_i = 1$$

S3 Outputs from steps

$$Q_j = \bigvee_{i \in A_j} X_i \cdot \text{(enable condition)}$$

JavaScript is required

The traffic-light example in the simulator uses a chain of timers (T1→T6) as a simple state machine: the current step is identified by which timers have already elapsed. This suits sequences that depend purely on time. Jobs with sensor conditions use the SFC method below.

## SFC / GRAFCET: a batch mixing tank Intermediate

Figure 2 · Boxes are steps, horizontal bars are transition conditions, and the boxes on the right are the actions performed while that step is active

### Converting to ladder with SET/RESET

// initial step at power-up (first scan)
S X0 = FirstScan
// each rung: current step AND condition → SET next step, RESET current step
S X1 = X0 & START & !LL R X0 = X0 & START & !LL
S X2 = X1 & LM R X1 = X1 & LM
S X3 = X2 & LH R X2 = X2 & LH
S X4 = X3 & T3.Q R X3 = X3 & T3.Q
S X0 = X4 & !LL R X4 = X4 & !LL
T3 = TON(X3, 60s)
// output section (S3)
V1 = X1 · V2 = X2 · M1 = X3 · V3 = X4

### Converting to Structured Text with CASE

CASE Step OF
0: IF Start AND NOT LL THEN Step := 10; END_IF
10: IF LM THEN Step := 20; END_IF // fill A
20: IF LH THEN Step := 30; END_IF // fill B
30: IF TMix.Q THEN Step := 40; END_IF // mix
40: IF NOT LL THEN Step := 0; END_IF // drain
END_CASE
TMix(IN := Step = 30, PT := T#60S);
V1 := Step = 10; V2 := Step = 20; M1 := Step = 30; V3 := Step = 40;
Step numbers go up in tens so new steps can be inserted later without renumbering the whole program. Show Step on the HMI and the technician knows at once what the machine is waiting for.

## Example: automatic tank filling (with a simulated plant)

Press START: the system fills until LH, stops, and refills when the level falls below LL. Open the tap (I0.4) to draw water. Watch pump Q0.0 being SET/RESET by the level switches — this is the same two-level circuit as the float-switch pump, but written in the program.

JavaScript is required

## Auto/manual modes, stopping and homing Advanced

- Auto / Manual: manual mode lets the operator drive outputs one at a time from the HMI, but still through the interlocks (e.g. the drain valve may not open while filling). The step sequence is frozen while in manual mode.

- Cycle stop: pressing stop lets the current cycle finish before stopping at step 0 — suited to processes where stopping mid-cycle wastes material.

- Immediate stop / E-stop: cut all outputs at once, remember the step where it stopped, and require a homing sequence or manual recovery before restarting.

- Per-step timeout: every step that waits on a sensor should have a watchdog timer, e.g. filling for more than 5 minutes means a stuck valve or a failed sensor → raise an alarm that names the step.

## Frequently asked questions

Why do sequential programs built from many layers of self-holding circuits tend to be buggy?
Because the machine's state is spread over many bits with no rule forcing exactly one of them to be active, so two steps can run at once or none at all. The state-machine approach keeps the state in a single variable (or in step bits that are SET/RESET in disciplined pairs), so exactly one step is always active and you know immediately where the machine is stuck.

Should outputs be written inside each step or at the end of the program?
It is better for the sequence section to compute only the “current step”, with a separate output section at the end of the program that writes each output once as an OR of the steps that need it, e.g. Pump = Step1 OR Step4. This prevents duplicate coils and lets you add manual-mode or emergency-stop conditions in one place.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Why do sequential programs built from many layers of self-holding circuits tend to be buggy?**
Because the machine's state is spread over many bits with no rule forcing exactly one of them to be active, so two steps can run at once or none at all. The state-machine approach keeps the state in a single variable (or in step bits that are SET/RESET in disciplined pairs), so exactly one step is always active and you know immediately where the machine is stuck.

**Should outputs be written inside each step or at the end of the program?**
It is better for the sequence section to compute only the “current step”, with a separate output section at the end of the program that writes each output once as an OR of the steps that need it, e.g. Pump = Step1 OR Step4. This prevents duplicate coils and lets you add manual-mode or emergency-stop conditions in one place.
