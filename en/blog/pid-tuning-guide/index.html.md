---
title: "PID Tuning: The Complete Guide from Step Test to Ziegler–Nichols, SIMC and Anti-Windup"
url: https://modsengineeringmath.com/en/blog/pid-tuning-guide/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-16
---

> A full PID tuning course in one article: identify the process with a step test, tune with Ziegler–Nichols, Cohen–Coon, SIMC or relay, compare the results by simulation, then fix windup and noise.

Markdown copy of https://modsengineeringmath.com/en/blog/pid-tuning-guide/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# PID Tuning: The Complete Guide from Step Test to Ziegler–Nichols, SIMC and Anti-Windup

THภาษาไทยENEnglish
// Guide · PID Academy · Control systems


Tuning decides whether a PID loop runs quietly for ten years or rings every shift. This is the whole course in one article: how to read your controller's equation, how to measure the process, seven tuning methods with their formulas and limits, a simulated head-to-head comparison on one plant, the practical fixes that real loops need, and a troubleshooting table you can take to the plant floor. Every number is worked out and checked by simulation.

30-second summary

- Check the controller's equation first (ideal, series or parallel; seconds or minutes). The same numbers mean different things in different forms.

- One open-loop step test gives $K$, $L$, $T$. The ratio $L/T$ tells you how hard the loop is.

- Good default: SIMC with $\tau_c=L$: $K_p=\dfrac{T}{K(\tau_c+L)}$, $T_i=\min\big(T,\,4(\tau_c+L)\big)$. Ziegler–Nichols and Cohen–Coon are fast but leave thin margins.

- Real loops also need a filtered D term, anti-windup, sensible sample time and a check of valve stiction.

## 1. Decide what “well tuned” means

Tuning is choosing $K_p$, $T_i$ and $T_d$ so that the closed loop meets a specification. Before touching a number, write that specification down, because a loop cannot be best at everything at once. Four things compete:

- Setpoint tracking: rise time, overshoot and settling time after the setpoint moves.

- Disturbance rejection: how far the measurement is pushed by a load change and how fast it returns.

- Robustness: whether the loop stays well damped when the process gain, time constant or dead time drifts by 30–50%.

- Control effort: how much the valve, motor or heater moves, including noise. Excess movement wears actuators.

Aggressive tuning improves the first two and costs the last two. Most process loops are regulatory: the setpoint rarely moves and disturbances dominate, so integral action and disturbance rejection matter most. Motion-control loops are servo loops: the setpoint moves constantly and overshoot is the main enemy. If both matter, use setpoint weighting (section 13) to tune the two behaviours separately.

Rule of thumb. Start from a smooth, robust tuning and speed it up only if the process demands it. It is much easier to explain a slightly slow loop than an oscillating one.

## 2. Know the equation your controller really uses

The most common tuning mistake is entering correct numbers into the wrong form. Three forms are common.

| Form | Transfer function | Where you meet it |

| Ideal (ISA, standard) | $C(s)=K_c\left(1+\dfrac{1}{T_is}+T_ds\right)$ | Textbooks, most DCS and PLC function blocks |

| Parallel | $C(s)=K_p+\dfrac{K_i}{s}+K_ds$ | Many MATLAB/Python libraries, some drives and microcontroller code |

| Series (interacting) | $C(s)=K_c'\left(1+\dfrac{1}{T_i's}\right)(1+T_d's)$ | Older pneumatic and electronic controllers, some vendors |

Ideal and parallel convert directly: $K_p=K_c$, $K_i=K_c/T_i$, $K_d=K_cT_d$. The series form multiplies out to the ideal form with different numbers:

$$K_c=K_c'\left(1+\frac{T_d'}{T_i'}\right),\qquad T_i=T_i'+T_d',\qquad T_d=\frac{T_i'T_d'}{T_i'+T_d'}$$

When $T_d$ is small compared with $T_i$ the two forms nearly agree, but with strong derivative action they do not. Three more details change what a number means:

- Proportional band: some controllers ask for PB (%) instead of gain: $PB=100/K_c$ when input and output are both in percent of span.

- Integral units: $T_i$ may be in seconds or minutes, and some vendors use repeats per minute $=1/T_i$. A larger number then means more integral action, the opposite of $T_i$.

- Engineering units vs percent: if the controller works on percent of span, the process gain $K$ must be expressed in the same percent. A gain measured in °C per % must be divided by the span of the measurement before you use a rule.

Check before you enter. Read the manual's equation, confirm the time units, and confirm whether the output is direct or reverse acting. A reverse-acting controller on a direct-acting process turns negative feedback into positive feedback within seconds.

## 3. What P, I and D do to the response

Here is a short recap; the article “What is a PID controller?” has the longer story. With error $e=r-y$:

$$u(t)=K_p\left[e(t)+\frac{1}{T_i}\int_0^t e\,d\tau+T_d\frac{de}{dt}\right]$$

- P acts on the present error. For a process with gain $K$ and no integrator, a P-only loop settles with a permanent offset $e_{ss}=\dfrac{1}{1+KK_p}$ for a unit setpoint step.

- I acts on the accumulated error, so it removes that offset. Its price is phase lag: more integral action (smaller $T_i$) means a slower, more oscillatory loop.

- D acts on the trend. It adds phase lead and damping, but its gain grows in proportion to frequency, so it amplifies high-frequency noise.

| Raise | Rise time | Overshoot | Settling | Offset | Stability |

| $K_p$ | Shorter | Larger | Little change | Smaller | Worse |

| Integral action (smaller $T_i$) | Shorter | Larger | Longer | Removed | Worse |

| $T_d$ | Little change | Smaller | Shorter | No change | Better, up to a point |

Figure 1. P-only control of the example plant $G(s)=2e^{-2s}/(10s+1)$. The final value is $KK_p/(1+KK_p)$: 0.50, 0.75 and 0.857 for $K_p=0.5,\,1.5,\,3$, exactly as the formula predicts. At $K_p=K_u=4.25$ the loop oscillates continuously; this is the experiment behind the Ziegler–Nichols closed-loop method.

## 4. Classify the process before you tune

Every tuning rule assumes a process model. Nearly all industrial processes can be described well enough by one of two shapes:

- Self-regulating (FOPDT): “first order plus dead time”, $G(s)=\dfrac{Ke^{-Ls}}{Ts+1}$. After a step in the output the measurement settles to a new value. Temperature, flow, pressure in a vented volume, speed.

- Integrating: $G(s)=\dfrac{K'e^{-Ls}}{s}$. The measurement ramps for as long as the input is nonzero. Tank level with a pump, the position of a motor driven by velocity.

The three FOPDT numbers are the process gain $K$ (change in measurement per change in output), the dead time $L$ (also called delay or $\theta$) and the time constant $T$ (also $\tau$). Dead time is the enemy: no controller can react before the measurement moves, and every extra second of delay lowers the gain you can safely use. The ratio $L/T$ summarises how hard the loop is.

| $L/T$ | Character | What it means for tuning |

| below 0.1 | Lag-dominant | High gain is possible; integral action should be fast; derivative can help; SIMC limits $T_i$ to $4(\tau_c+L)$. |

| 0.1 to 0.5 | Balanced | The “textbook” case. PI is usually enough; PID gives modest gains. |

| 0.5 to 1 | Delay matters | Lower the gain; derivative adds little; expect slower loops. |

| above 1 | Delay-dominant | Use low gain and mostly integral action. Consider dead-time compensation (Smith predictor) or feedforward. |

The example plant used throughout this article is $K=2$ (°C per % of heater output), $L=2$ s, $T=10$ s, so $L/T=0.2$. The numbers are scaled so they are easy to follow; the method is the same for a furnace measured in minutes.

## 5. Measure the process with a step test

A step test (also called a bump test) is the single most valuable half hour you can spend on a loop. It turns guesswork into three numbers.

### Procedure

- Prepare. Put the loop in manual and wait until the measurement is steady. Make sure other loops and operators are not changing the process.

- Step the output by 5–10% of its range. The measurement change should be at least 5–10 times the noise band, but small enough to stay in the linear region and within safety limits.

- Record the measurement and the output at a sample time of about one twentieth of the expected $T$ or faster, until the measurement is flat again (about 4–5 $T$ after the dead time).

- Restore the output and, if you can, repeat in the other direction and at another operating point. A large difference tells you the process is nonlinear.

### Reading K, L and T

The process gain is $K=\Delta y/\Delta u$ in the same units the controller uses. For $L$ and $T$ there are two standard readings.

Figure 2. Simulated step test of the example plant with $\Delta u=10\%$. The tangent at the steepest point cuts the starting value at $t=L$ and the final value at $t=L+T$. The two circles mark 28.3% and 63.2% of the final change.

- Tangent (reaction-curve) method. Draw the tangent at the steepest point. $L$ is where it crosses the initial value; $T$ is the time it takes to rise from there to the final value. It is quick but sensitive to how you draw the line, particularly with noise.

- Two-point method (28.3% and 63.2%). For a first-order response with delay, $y$ reaches 28.3% of its final change at $t_{28}=L+0.333T$ and 63.2% at $t_{63}=L+T$. Subtracting gives $T=1.5\,(t_{63}-t_{28})$ and $L=t_{63}-T$. This is more repeatable than a hand-drawn tangent.

Example 1

### Reading the step test in Figure 2

The heater output is stepped by $\Delta u=10\%$. The temperature rises by $\Delta y=20\,^\circ\text{C}$. It reaches 28.3% of the change (5.7 °C) at $t_{28}=5.3$ s and 63.2% (12.6 °C) at $t_{63}=12.0$ s.

-
$$K=\frac{\Delta y}{\Delta u}=\frac{20}{10}=2\ ^\circ\text{C}/\%$$

-
$$T=1.5\,(t_{63}-t_{28})=1.5\,(12.0-5.3)=10.05\approx 10\ \text{s}$$

-
$$L=t_{63}-T=12.0-10.05=1.95\approx 2\ \text{s}$$

$K=2$, $L=2$ s, $T=10$ s, so $L/T=0.2$. The tangent construction in Figure 2 gives the same values.

### Integrating processes

If the measurement ramps instead of settling (a tank level), step the output and measure the slope after the dead time. Then $K'=\text{slope}/\Delta u$, and $L$ is the time from the step to the start of the steady ramp. The tuning rules for this case are in section 10.

## 6. Manual tuning: the procedure that always works

When you cannot run a clean step test, or you only need to refine a loop that already runs, tune by trial and error, but in a fixed order.

- Verify the loop first. Is the sensor reading sensible, does the valve move the right way, is the controller direct or reverse acting as required, is the output not already at a limit?

- Remove I and D. Set integral action off ($T_i$ at maximum) and $T_d=0$. Start with a low gain.

- Find the proportional gain. Make setpoint steps of 5–10%. Raise $K_p$ by factors of about 1.5–2 until the response begins to ring, then back off to roughly half. In practice this lands near $0.5K_u$.

- Add integral action. Begin with $T_i\approx T$ (or the time the measurement takes to reach 63% of its change). Shorten it step by step until the offset disappears in an acceptable time. Stop as soon as a slow, rolling overshoot appears.

- Add derivative only if needed. Try $T_d\approx 0.25$–$0.5\,L$, with its filter on. Increase until overshoot is acceptable and the output is not jittery.

- Test properly. Check a setpoint step and a disturbance (a load change or an output bump), at more than one operating point, and watch the controller output as well as the measurement.

| What you see | Probable cause | What to change |

| Fast ringing with short period, grows or persists | $K_p$ too high (or D too high with noise) | Lower $K_p$ by 30–50% |

| Slow rolling oscillation, period several times $T$ | Integral action too strong | Increase $T_i$ (or lower $K_i$) |

| Approaches setpoint very slowly and stops short | Gain too low, little integral action | Raise $K_p$; shorten $T_i$ |

| Large overshoot after a big setpoint change, controller output pinned at a limit | Integral windup | Enable anti-windup (section 13) |

| Output jumps wildly, measurement looks fine | D acting on noise | Filter D, lower $T_d$, or drop D |

| Sawtooth measurement with square-wave output | Valve stiction or backlash | Fix the valve (positioner); do not retune |

Manual tuning is slow for processes with long time constants, because each trial takes minutes or hours. That is when a model-based rule pays off.

## 7. Ziegler–Nichols closed-loop (ultimate gain) method

Published in 1942, this method needs no model. With $T_i$ at maximum and $T_d=0$, raise $K_p$ until the loop oscillates with constant amplitude. The gain at that point is the ultimate gain $K_u$ and the oscillation period is the ultimate period $P_u$. Then read the table.

| Controller | $K_p$ | $T_i$ | $T_d$ |

| P | $0.5K_u$ | – | – |

| PI | $0.45K_u$ | $P_u/1.2$ | – |

| PID | $0.6K_u$ | $P_u/2$ | $P_u/8$ |

| PI, Tyreus–Luyben | $K_u/3.2$ | $2.2P_u$ | – |

| PID, Tyreus–Luyben | $K_u/2.2$ | $2.2P_u$ | $P_u/6.3$ |

The classic rules aim for a quarter-amplitude decay ratio, in which each overshoot is a quarter of the previous one. That is fast but very oscillatory. The Tyreus–Luyben variant (1992) keeps $K_u$ and $P_u$ but is much gentler, and is a better default for chemical processes.

Example 2

### ZN closed-loop on the example plant

For $G(s)=2e^{-2s}/(10s+1)$, the phase reaches $-180^\circ$ at $\omega_u=0.844$ rad/s, where $|G|=0.2352$. So $K_u=1/0.2352=4.25$ and $P_u=2\pi/\omega_u=7.44$ s. (On the real plant you would find these values by experiment, as in Figure 1.)

-
$$K_p=0.6K_u=0.6\times4.25=2.55$$

-
$$T_i=\frac{P_u}{2}=3.72\ \text{s},\qquad T_d=\frac{P_u}{8}=0.93\ \text{s}$$

-
$$K_i=\frac{K_p}{T_i}=0.686\ \text{s}^{-1},\qquad K_d=K_pT_d=2.37$$

PID: $K_p=2.55$, $T_i=3.72$ s, $T_d=0.93$ s. Section 12 shows what this does to the real response: 56% overshoot.

Safety and limits. The experiment drives the process to the edge of stability. Do not run it on a boiler, reactor or anything that cannot tolerate sustained oscillation. It also needs enough phase lag: a pure first-order process with no dead time never reaches $-180^\circ$, so $K_u$ does not exist. On slow processes the test can take hours. The relay method in section 11 is a safer way to get $K_u$ and $P_u$.

## 8. Ziegler–Nichols open-loop (reaction-curve) method

The second ZN method uses the step test of section 5 instead of a stability experiment, and is safer. With $K$, $L$ and $T$ from the recording:

| Controller | $K_p$ | $T_i$ | $T_d$ |

| P | $\dfrac{T}{KL}$ | – | – |

| PI | $\dfrac{0.9\,T}{KL}$ | $3.33\,L$ | – |

| PID | $\dfrac{1.2\,T}{KL}$ | $2L$ | $0.5L$ |

Example 3

### ZN open-loop PID for $K=2,\ L=2\ \text{s},\ T=10\ \text{s}$

-
$$K_p=\frac{1.2\,T}{KL}=\frac{1.2\times10}{2\times2}=3.0$$

-
$$T_i=2L=4\ \text{s},\qquad T_d=0.5L=1\ \text{s}$$

$K_p=3.0$, $T_i=4$ s, $T_d=1$ s. Notice the formula: the gain is inversely proportional to $KL$, so a larger dead time or a larger process gain lowers the controller gain, which is exactly right.

The rule aims for quarter-amplitude decay on moderate-delay processes. It becomes poor when the dead time is very small compared with $T$ (the gain $T/(KL)$ grows without limit) or very large (the loop is then too aggressive).

## 9. Cohen–Coon

Cohen and Coon (1953) refined the step-test rules by adding terms that depend on the ratio $\tau=L/T$, so they cope better with a larger dead time than the ZN open-loop table. They still aim at quarter-amplitude decay. With $\tau=L/T$:

| Controller | $K_p$ | $T_i$ | $T_d$ |

| PI | $\dfrac{1}{K}\dfrac{T}{L}\left(0.9+\dfrac{\tau}{12}\right)$ | $L\,\dfrac{30+3\tau}{9+20\tau}$ | – |

| PID | $\dfrac{1}{K}\dfrac{T}{L}\left(\dfrac43+\dfrac{\tau}{4}\right)$ | $L\,\dfrac{32+6\tau}{13+8\tau}$ | $\dfrac{4L}{11+2\tau}$ |

Example 4

### Cohen–Coon PID for the same plant

Here $\tau=L/T=0.2$ and $T/(KL)=2.5$.

-
$$K_p=2.5\left(\tfrac43+\tfrac{0.2}{4}\right)=2.5\times1.3833=3.46$$

-
$$T_i=2\,\frac{32+1.2}{13+1.6}=4.55\ \text{s},\qquad T_d=\frac{8}{11+0.4}=0.70\ \text{s}$$

$K_p=3.46$, $T_i=4.55$ s, $T_d=0.70$ s. It is the most aggressive of the rules in this article (85% overshoot in section 12), so treat it as a starting point to be detuned.

## 10. IMC, lambda and SIMC: tune by choosing the speed

The earlier rules are fitted to a performance criterion. The internal model control (IMC) idea turns it around: decide how fast you want the closed loop to be and calculate the controller that gives exactly that. Ask for the response $\dfrac{y}{r}=\dfrac{e^{-Ls}}{\tau_cs+1}$, a first-order response with the unavoidable dead time. Approximating the delay as $e^{-Ls}\approx1-Ls$, the controller for a FOPDT process is a PI controller:

$$K_p=\frac{T}{K(\tau_c+L)},\qquad T_i=T \qquad\text{(IMC / lambda, with }\lambda=\tau_c\text{)}$$

Skogestad's SIMC rule (2003) modifies one number. For lag-dominant processes $T_i=T$ makes the loop slow to recover from a load disturbance, so SIMC caps it:

$$T_i=\min\big(T,\ 4(\tau_c+L)\big)$$

The single tuning knob $\tau_c$ is the desired closed-loop time constant. A practical recommendation is $\tau_c=L$: about as fast as the dead time allows. Larger values give smoother, more robust loops; values below $L$ buy little speed and cost a lot of robustness.

Example 5

### SIMC PI for $K=2,\ L=2\ \text{s},\ T=10\ \text{s}$

- With $\tau_c=L=2$ s:
$$K_p=\frac{10}{2\,(2+2)}=1.25,\qquad T_i=\min(10,\ 4\times4)=10\ \text{s}$$

- With $\tau_c=2L=4$ s (smoother):
$$K_p=\frac{10}{2\,(4+2)}=0.833,\qquad T_i=\min(10,\ 24)=10\ \text{s}$$

$K_p=1.25$, $T_i=10$ s for the tight setting; $K_p=0.83$, $T_i=10$ s for the smooth one. Computed exactly, the first has a gain margin of 3.14 and a phase margin of 61°.

### Other process shapes

- Integrating process $K'e^{-Ls}/s$ (tank level): $K_p=\dfrac{1}{K'(\tau_c+L)}$, $T_i=4(\tau_c+L)$.

- Second-order plus delay $\dfrac{Ke^{-Ls}}{(T_1s+1)(T_2s+1)}$: use the series form $K_c=\dfrac{T_1}{K(\tau_c+L)}$, $T_i=\min\big(T_1,4(\tau_c+L)\big)$, $T_d=T_2$ (convert to ideal form with the formulas of section 2).

- Lambda tuning is the same PI rule with $T_i=T$ always. It is popular in the paper and chemical industries because a large $\lambda$ gives smooth, non-interacting loops.

Because the response is specified rather than discovered, SIMC and lambda tuning fit well into a procedure: a model, a speed, a controller. That is why they are a good default.

## 11. Relay auto-tuning

The relay experiment of Åström and Hägglund (1984) finds $K_u$ and $P_u$ without taking the loop to the edge of stability. Replace the controller with a relay that switches the output between $u_0+d$ and $u_0-d$. Most processes then settle into a steady oscillation whose amplitude is limited by $d$. If the measurement oscillates with amplitude $a$, the describing-function approximation gives

$$K_u\approx\frac{4d}{\pi a},\qquad P_u=\text{measured period of the oscillation}$$

Then you apply the Ziegler–Nichols or Tyreus–Luyben table of section 7. This is how most commercial “auto-tune” buttons work.

Example 6

### Auto-tune of an oven

A relay of $d=5\%$ makes the oven temperature oscillate with amplitude $a=1.2\,^\circ\text{C}$ and period $P_u=7.5$ s.

-
$$K_u=\frac{4d}{\pi a}=\frac{4\times5}{\pi\times1.2}=5.31\ \%/^\circ\text{C}$$

- Tyreus–Luyben PI:
$$K_p=\frac{K_u}{3.2}=1.66,\qquad T_i=2.2P_u=16.5\ \text{s}$$

PI: $K_p=1.66\ \%/^\circ\text{C}$, $T_i=16.5$ s.

Practical points: use some hysteresis on the relay so measurement noise does not cause false switching; choose $d$ small enough that the oscillation is harmless but large enough to be clear of noise; and keep in mind that the approximation assumes the process filters out the harmonics of the square wave, which is true for most lag-type processes.

## 12. Head-to-head: the same plant, many rules

Each rule was applied to the plant $2e^{-2s}/(10s+1)$ and simulated: a unit setpoint step at $t=0$, then a load step of $-0.5$ at the process input at $t=70$ s. The D term acts on the measurement with a filter $T_d/10$. “Settling” is the time after which the response stays within 2%; IAE is the integrated absolute error (smaller is better), measured separately for the setpoint step and the load step.

| Rule | $K_p$ | $T_i$ (s) | $T_d$ (s) | Overshoot | Settling (s) | IAE setpoint | IAE load | Gain margin | Phase margin |

| ZN closed-loop PID | 2.55 | 3.72 | 0.93 | 56% | 19.1 | 5.50 | 0.90 | 1.63 | 40° |

| ZN closed-loop PI | 1.91 | 6.20 | – | 44% | 20.8 | 5.40 | 1.62 | 1.92 | 36° |

| ZN open-loop PID | 3.00 | 4.00 | 1.00 | 64% | 19.6 | 5.33 | 0.79 | 1.33 | 39° |

| Cohen–Coon PID | 3.46 | 4.55 | 0.70 | 85% | 24.2 | 6.08 | 0.79 | 1.31 | 27° |

| Tyreus–Luyben PI | 1.33 | 16.4 | – | 0% | 40.2 | 6.08 | 6.05 | 3.06 | 69° |

| Tyreus–Luyben PID | 1.93 | 16.4 | 1.18 | 0% | 13.7 | 4.22 | 4.16 | 1.76 | 75° |

| SIMC PI, $\tau_c=L$ | 1.25 | 10.0 | – | 4% | 12.1 | 4.34 | 3.99 | 3.14 | 61° |

| SIMC PI, $\tau_c=2L$ | 0.83 | 10.0 | – | 0% | 15.7 | 5.99 | 5.99 | 4.71 | 71° |

Figure 3. Closed-loop response of four of the rules on the same plant. The setpoint step is at $t=0$, the load disturbance at $t=70$ s. The orange and purple curves (ZN and Cohen–Coon) are fast but overshoot heavily; the blue and green curves (SIMC) are smooth.

### What the numbers say

- The ZN and Cohen–Coon PID rules reject the load four to five times better (IAE 0.8–0.9 versus 4.0 for SIMC) but overshoot by 56–85% and run with gain margins of 1.3–1.6, so a 30–60% rise in process gain would push them toward instability.

- The load-rejection difference is explained by one number, $K_i=K_p/T_i$. For a response with little overshoot, the area under the error after a load step of size $\Delta d$ is $\text{IAE}\approx\Delta d/K_i$. For SIMC: $K_i=1.25/10=0.125$ so $0.5/0.125=4.0$, matching the simulated 3.99. For ZN PID $K_i=0.686$, predicting 0.73 (the simulated 0.90 is higher because that response oscillates).

- SIMC with $\tau_c=L$ is the best all-rounder here: the fastest settling of every row (12.1 s), a setpoint error area (4.34) close to the best (4.22 for Tyreus–Luyben PID), only 4% overshoot, and a gain margin above 3. Its price is slower disturbance recovery, which you can buy back by choosing a smaller $T_i$ if the margins allow.

- Tyreus–Luyben PI is very slow on this plant because $T_i=16.4$ s exceeds the process time constant; adding D (the PID row) helps the setpoint response but narrows the gain margin to 1.76.

| Situation | Reasonable choice |

| You have a step test and want a smooth, safe loop | SIMC with $\tau_c=L$ (or $2L$ if the process varies) |

| You can only run experiments on the closed loop | Relay test, then Tyreus–Luyben (or ZN detuned) |

| Load disturbances dominate and some overshoot is acceptable | ZN open-loop, then detune $K_p$ by 20–30% |

| Level of a buffer tank | Integrating-process SIMC with a large $\tau_c$, or P-only/low-gain PI |

| Very long dead time ($L/T>1$) | Low-gain PI, then consider Smith predictor or feedforward |

| Process is nonlinear or varies | Tune at the worst operating point; use gain scheduling for the rest |

These results are for one plant. Different $L/T$ values change the picture, which is why you should always check a new tuning by simulation or a careful field test.

## 13. Practical fixes every real loop needs

### Filter the derivative and keep it off the setpoint

A pure derivative has infinite gain at high frequency. Use a first-order filter:

$$D(s)=\frac{K_pT_ds}{1+\dfrac{T_d}{N}s},\qquad N\approx 5\text{ to }20$$

so the high-frequency gain is limited to $K_pN$. Also apply the derivative to the measurement $y$, not the error $e$: a setpoint step then does not cause a huge “derivative kick” on the output. Most commercial controllers do this by default; check yours. If the signal is noisy, a first-order low-pass filter on the measurement is a better cure than a lower $N$.

### Setpoint weighting (two degrees of freedom)

The same $K_p$ that rejects disturbances makes the setpoint response overshoot. Weighting the proportional term of the setpoint, $u=K_p(b\,r-y)+\dots$ with $0If the actuator saturates (valve fully open, heater at 100%) while an error remains, the integral keeps growing. When the error finally reverses, the integral takes a long time to unwind and the measurement overshoots. Two common remedies:

- Clamping (conditional integration): stop integrating while the output is saturated and the error would push it further.

- Back-calculation: feed the saturation difference back into the integrator, $\dot I=K_ie+\dfrac{u_{sat}-u}{T_t}$. A common choice is $T_t\approx T_i$ for PI and $T_t=\sqrt{T_iT_d}$ for PID.

Figure 4. The same SIMC PI controller ($K_p=1.25$, $T_i=10$ s) with the actuator limited to $0\le u\le1$ and a setpoint step to 1.6. Without anti-windup the measurement overshoots by 19% and needs 57 s to settle; with back-calculation ($T_t=T_i$) the overshoot is 0.5% and it settles in 17.5 s.

### Bumpless transfer

When switching from manual to auto (or changing a setpoint source), initialise the integrator so that the output starts from its present value. Otherwise the output jumps and the process is bumped.

### Sample time

Digital controllers sample the measurement every $T_s$. As a rule of thumb, take $T_s$ at most one tenth of the time constant $T$, and no more than about half the dead time when $L$ is small. A zero-order hold also adds about $T_s/2$ of delay, so tune with $L_{eff}=L+T_s/2$. The lesson on digital control covers this in detail.

### When the hardware is the problem

- Stiction and backlash: a sticky valve sticks, then jumps. The result is a limit cycle (sawtooth measurement, square-wave output) that gets worse as you add integral action. Fix the valve or add a positioner; do not retune around it.

- Dead band and resolution: a coarse output (a few percent steps) or low-resolution input forces the loop to hunt. Reduce integral action or add a dead band in the controller.

- Nonlinearity: valve characteristics, pH curves and furnace gains change with the operating point. Tune at the most difficult point, or schedule the gain with the operating point.

- Saturation of your own range: if the output is saturated most of the time, no tuning will help; the loop is mis-sized.

## 14. Typical loop types and where to begin

Use these as qualitative starting points, then refine with a step test; plants differ widely.

| Loop | Typical character | Usual controller | Notes |

| Flow | Fast, small dead time, noisy signal | PI, low gain, no D | Filter the measurement; the valve is often the slowest element. |

| Pressure (gas) | Fast, often nearly integrating | PI, sometimes PID | Fast loops need fast sampling. |

| Level (buffer tank) | Integrating | P or low-gain PI | Averaging level control passes flow changes smoothly to the next unit; do not tune it tight. |

| Temperature | Slow, significant dead time | PI or PID | Large $T$ rewards D; large $L$ rewards patience. |

| Speed (motor) | Lag-dominant, fast | PI | Often inside a current loop; tune inner loops first. |

| Position | Integrating | P, PD or PID | Friction can need a little integral action and anti-windup. |

| pH, composition | Strongly nonlinear, long delay | PI with gain scheduling | Tune where the slope is steepest, then schedule. |

For cascade loops (temperature outer, flow or valve position inner) always tune the inner loop first and make it several times faster than the outer loop.

## 15. How to judge a tuning

Judge the loop with numbers, not by how the trend “feels”.

- Time-domain: overshoot, settling time (±2% or ±5%), peak deviation after a load step, and recovery time.

- Error integrals: IAE $=\int|e|\,dt$, ISE $=\int e^2dt$, ITAE $=\int t|e|\,dt$. Compare tunings on the same test; the lower the better. IAE for a load step is about $\Delta d/K_i$.

- Robustness: gain margin at least 2 (6 dB), phase margin 45–60° and peak sensitivity $M_s$ of 1.4–2. In the comparison table above, only the two SIMC rows and Tyreus–Luyben PI have both a gain margin above 2 and a phase margin above 45°.

- Control effort: look at the standard deviation or total variation of the output. Noise amplified by D shows up here first.

Quick robustness test in the field. Increase $K_p$ by 50% and run a setpoint step. If the loop stays stable and reasonably damped, you have real margin; if it rings badly, back the gain off. (On the example plant the ZN PID has a gain margin of only 1.63, so a 50% increase would leave it on the edge of instability.)

## 16. Troubleshooting guide

| Symptom | Check | Action |

| Loop runs away immediately after switching to auto | Direct/reverse action, sensor scaling, setpoint source | Fix action and scaling; initialise for bumpless transfer |

| Steady oscillation with period near $P_u$ | Is $K_p$ near $K_u$? | Halve $K_p$; verify with a 50% gain test |

| Slow oscillation, a few times $T$ | $T_i$ too small for the dead time | Double $T_i$ (or lower $K_p$ and $T_i$ together) |

| Never reaches setpoint, sits short | No integral action, or output clamped | Enable I; check output limits and mode |

| Reaches setpoint but crawls the last few percent | $T_i$ much too long | Shorten $T_i$ toward $T$ |

| Overshoots only after large moves | Windup | Anti-windup; limit the setpoint rate |

| Output noisy, valve chatters | D on noise, unfiltered measurement | Filter the measurement and D; lower $K_pN$ |

| Good at one load, bad at another | Nonlinear process | Tune at the hardest point or schedule the gain |

| Limit cycle that gets worse with more I | Valve stiction | Repair or add a positioner |

## 17. A repeatable tuning workflow

- Write the specification: tracking or regulation, allowed overshoot, allowed actuator movement.

- Check the hardware and the equation: sensor, valve, direct/reverse, form of the PID block, time units.

- Run a step test (section 5) and read $K$, $L$, $T$; compute $L/T$.

- Choose the rule: SIMC $\tau_c=L$ by default; a relay test if you cannot open the loop; Ziegler–Nichols only as a first guess.

- Convert to the controller's form and units (section 2).

- Add the practical items: D filter, anti-windup, output limits, sample time.

- Test a setpoint step, a disturbance and a 50% gain increase at the relevant operating points.

- Refine and document the final values, the date and the test results, so the next engineer does not start from zero.

## 18. Practice problems

Try each one on paper, then open the answer.

Problem 1

### Form conversion

A series-form controller has $K_c'=2$, $T_i'=10$ s, $T_d'=2$ s. Find the ideal-form values.

Show the answer

$$K_c=2\left(1+\frac{2}{10}\right)=2.4,\qquad T_i=10+2=12\ \text{s},\qquad T_d=\frac{10\times2}{12}=1.67\ \text{s}$$

Problem 2

### Ziegler–Nichols from an experiment

A closed-loop test gives $K_u=6$ and $P_u=4$ s. Find the ZN PID values and the parallel-form gains $K_i$ and $K_d$.

Show the answer

$$K_p=0.6\times6=3.6,\quad T_i=\frac{4}{2}=2\ \text{s},\quad T_d=\frac{4}{8}=0.5\ \text{s},\quad K_i=\frac{3.6}{2}=1.8\ \text{s}^{-1},\quad K_d=3.6\times0.5=1.8\ \text{s}$$

Problem 3

### SIMC for a delay-heavy process

A step test gives $K=0.5$, $L=3$ s, $T=12$ s. Find the SIMC PI values with $\tau_c=L$. What is $L/T$?

Show the answer

$$K_p=\frac{12}{0.5\,(3+3)}=4,\qquad T_i=\min(12,\ 4\times6)=12\ \text{s},\qquad \frac{L}{T}=0.25$$

Problem 4

### Estimating disturbance rejection

A PI loop has $K_p=2$ and $T_i=8$ s, with little overshoot. A load disturbance of 0.4 (in controller-output units) arrives. Estimate the IAE. How does it change if $T_i$ is halved?

Show the answer

$$K_i=\frac{2}{8}=0.25,\qquad \text{IAE}\approx\frac{0.4}{0.25}=1.6;\qquad T_i=4\Rightarrow K_i=0.5,\ \text{IAE}\approx0.8$$

Halving $T_i$ halves the error area, but it also lowers the margins, so check the response.

## Keep learning in the library

The full lessons are in Thai, with English technical terms and the same formulas; the interactive labs run in the browser.

- The PID controller: structure, effects and a simulation lab (in Thai)

- PID tuning: Ziegler–Nichols, Cohen–Coon, SIMC, relay and a try-it lab (in Thai)

- Gain and phase margins, the robustness numbers used here (in Thai)

- Time response: rise time, overshoot, settling time (in Thai)

- Digital control and choosing the sample time (in Thai)

- Analog I/O, PID blocks and VFDs in a PLC (English)

- Short article: what is a PID controller?

## Frequently asked questions

What is the fastest reliable way to tune a PID loop?
Run one open-loop step test, read the gain K, dead time L and time constant T from the recording, then apply the SIMC rule $K_p=T/(K(\tau_c+L))$, $T_i=\min(T,4(\tau_c+L))$ with $\tau_c=L$. It needs one experiment, has one knob, and gives a smooth response with a gain margin near 3.

Should I use Ziegler–Nichols?
Use it as a starting point when you have nothing else, and expect 40–80% overshoot and thin stability margins, because it was designed for a quarter-amplitude decay ratio. Most engineers detune it (lower $K_p$, larger $T_i$) or use SIMC or Tyreus–Luyben instead.

Do I always need the D term?
No. Most industrial loops run PI. Derivative action helps lag-dominant processes with clean measurements (temperature, some position and speed loops) and is of little use when dead time dominates or the signal is noisy. If you use it, always filter it.

How do I choose the integral time $T_i$?
For a self-regulating process a good first value is $T_i\approx T$ (the process time constant), limited to $4(\tau_c+L)$ when that is smaller. A $T_i$ that is too short gives slow, rolling oscillation; too long leaves the error hanging around. The load-disturbance error area is about $\Delta d/K_i$ with $K_i=K_p/T_i$.

What sample time should the controller use?
Roughly one tenth of the process time constant or smaller, and no more than about half the dead time when the dead time is small. Sampling adds about $T_s/2$ of extra delay, so slow sampling forces lower gains.

Why does my loop oscillate even with small gains?
Suspect the hardware first: valve stiction, backlash or a dead band produces a limit cycle that no gain setting removes, and a noisy or badly filtered measurement can do the same. Look at the controller output: a sawtooth in the measurement with a square-wave output is the classic sign of stiction.

What is integral windup and how do I stop it?
Windup is the integral term growing while the actuator is saturated, which causes large overshoot afterwards. Stop it with anti-windup: clamp the integrator, or use back-calculation $\dot I=K_ie+(u_{sat}-u)/T_t$. In the simulation in this guide, back-calculation cut the overshoot from 19% to 0.5%.

How can I tell whether a tuning is robust enough?
Aim for a gain margin of at least 2, a phase margin of 45–60° and a peak sensitivity $M_s$ of 1.4–2. A quick field check is to raise $K_p$ by 50% (or let the process gain double) and confirm that the response stays damped.

## More articles worth reading

Control systems
What Is a PID Controller? How Kp, Ki and Kd Work and How to Tune Them
A PID controller adds proportional, integral and derivative action on the error. See what Kp, Ki and Kd do, the step-response table, a…
16 Oct 2026Read the article →

Python · AI
Learning to Program in the AI Era: Why Start with Python
AI writes code in any language, but if you cannot read code you cannot tell whether it is right. Why Python is the best first language, six core…
25 Oct 2026Read the article →

Linear algebra
Cramer's Rule: How to Use It, Why It Works, and When Not to Use It
Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0…
25 Oct 2026Read the article →

All 2 articles in Control Systems & PID → · All articles

## Frequently asked questions

**What is the fastest reliable way to tune a PID loop?**
Run one open-loop step test, read the gain K, dead time L and time constant T from the recording, then apply the SIMC rule $K_p=T/(K(\tau_c+L))$, $T_i=\min(T,4(\tau_c+L))$ with $\tau_c=L$. It needs one experiment, has one knob, and gives a smooth response with a gain margin near 3.

**Should I use Ziegler–Nichols?**
Use it as a starting point when you have nothing else, and expect 40–80% overshoot and thin stability margins, because it was designed for a quarter-amplitude decay ratio. Most engineers detune it (lower $K_p$, larger $T_i$) or use SIMC or Tyreus–Luyben instead.

**Do I always need the D term?**
No. Most industrial loops run PI. Derivative action helps lag-dominant processes with clean measurements (temperature, some position and speed loops) and is of little use when dead time dominates or the signal is noisy. If you use it, always filter it.

**How do I choose the integral time \(T_i\)?**
For a self-regulating process a good first value is $T_i\approx T$ (the process time constant), limited to $4(\tau_c+L)$ when that is smaller. A $T_i$ that is too short gives slow, rolling oscillation; too long leaves the error hanging around. The load-disturbance error area is about $\Delta d/K_i$ with $K_i=K_p/T_i$.

**What sample time should the controller use?**
Roughly one tenth of the process time constant or smaller, and no more than about half the dead time when the dead time is small. Sampling adds about $T_s/2$ of extra delay, so slow sampling forces lower gains.

**Why does my loop oscillate even with small gains?**
Suspect the hardware first: valve stiction, backlash or a dead band produces a limit cycle that no gain setting removes, and a noisy or badly filtered measurement can do the same. Look at the controller output: a sawtooth in the measurement with a square-wave output is the classic sign of stiction.

**What is integral windup and how do I stop it?**
Windup is the integral term growing while the actuator is saturated, which causes large overshoot afterwards. Stop it with anti-windup: clamp the integrator, or use back-calculation $\dot I=K_ie+(u_{sat}-u)/T_t$. In the simulation in this guide, back-calculation cut the overshoot from 19% to 0.5%.

**How can I tell whether a tuning is robust enough?**
Aim for a gain margin of at least 2, a phase margin of 45–60° and a peak sensitivity $M_s$ of 1.4–2. A quick field check is to raise $K_p$ by 50% (or let the process gain double) and confirm that the response stays damped.
