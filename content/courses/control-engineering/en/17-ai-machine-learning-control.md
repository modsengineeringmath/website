---
title: AI and Machine Learning Fundamentals for Control Engineers
description: Machine learning in the language of a control engineer: system identification from data by least squares, gradient descent, neural networks, reinforcement learning, the IAE, ISE and ITAE indices for loop performance analysis, and the limits on stability and safety.
keywords: machine learning for control engineers, AI in control systems, system identification least squares, gradient descent learning rate stability, neural network neuron op-amp analogy, reinforcement learning control, IAE ISE ITAE, control loop performance monitoring, predictive maintenance motors
published: 2026-11-12
updated: 2026-11-12
time: 50
outcomes:
  - Explain machine learning as finding a function from data, and distinguish the three kinds of learning
  - Find a first-order plant model from recorded data by least squares
  - Explain gradient descent and the structure of a neuron by comparison with a feedback loop and an op-amp circuit
  - Calculate the IAE and ISE performance indices and say how AI helps analyse loop performance and machine condition
  - State the limits of data-trained controllers in stability and safety
deeper:
  - Article: Learning to program in the AI era with Python | /en/blog/learn-programming-ai-era-python/
  - Linear algebra (Thai) | /learn/linear-algebra/
  - Nonlinear systems and robust control (Thai) | /learn/control-systems/nonlinear-robust/
---

## The picture to keep in mind: from writing the rules to letting data write them {#idea}

In the first 15 units we built models from **physical laws** (Kirchhoff, Newton) and designed controllers from those models. Unit 16 used **expert rules**. This unit introduces a third source of knowledge: **data**.

**Machine learning (ML)** means having a computer find a function $y = f(x)$ from many examples of $x$ and $y$, instead of a person writing the function. **Artificial intelligence (AI)** is the wider term for systems that do work normally needing human intelligence, and ML is the main way AI is built today.

Good news for students of this course: several central ideas of ML are things control engineers already know under other names.

| ML term | Control engineer's term |
|---|---|
| Training a model on data | System identification |
| Loss function | Performance index, such as ISE |
| Gradient descent | A feedback loop that adjusts parameters from the error |
| Learning rate | Loop gain |
| Reinforcement learning | Optimal control learned by trial and error |

## Three kinds of learning {#types}

| Kind | Data used | Examples in electrical and control work |
|---|---|---|
| Supervised | Inputs with the correct answers | Identifying a plant model, forecasting electrical load, classifying faults from current waveforms |
| Unsupervised | Inputs only | Detecting anomalies in motor vibration, clustering consumption patterns |
| Reinforcement | Rewards from acting | Learning a control policy, managing energy in batteries and microgrids |

## Identifying a plant model from data {#identification}

Unit 5 found $K$ and $\tau$ from a curve by reading the 63.2 % point. That uses a single data point and is sensitive to noise. The **least squares** method uses every point.

From Unit 15, a sampled first-order plant obeys

$$y[k+1] = a\,y[k] + b\,u[k]$$

This is **linear in the parameters** $a$ and $b$. With $N$ data pairs it can be written as $\mathbf{y} = \Phi\boldsymbol{\theta}$, where each row of $\Phi$ is $\begin{bmatrix}y[k] & u[k]\end{bmatrix}$ and $\boldsymbol{\theta} = \begin{bmatrix}a & b\end{bmatrix}^T$. The value that minimises the sum of squared errors is

$$\hat{\boldsymbol{\theta}} = (\Phi^T\Phi)^{-1}\Phi^T\mathbf{y}$$

The physical parameters then follow from the formulas of Unit 15.

$$\tau = -\frac{T}{\ln a}, \qquad K = \frac{b}{1 - a}$$

:::example Example 17.1 A model from recorded data
A step $u = 1$ is applied to a plant and the output is recorded every $T = 0.1$ s: $y = 0,\ 0.200,\ 0.360,\ 0.488$. Find $a$, $b$, $\tau$ and $K$.

**Step 1.** Write an equation for each data pair.

| $k$ | $y[k+1] = a\,y[k] + b\,u[k]$ |
|---|---|
| 0 | $0.200 = a(0) + b$ |
| 1 | $0.360 = a(0.200) + b$ |
| 2 | $0.488 = a(0.360) + b$ |

**Step 2.** The first row gives $b = 0.200$. In the second row, $a = \dfrac{0.360 - 0.200}{0.200} = 0.800$.

**Step 3.** Check with the third row: $0.800 \times 0.360 + 0.200 = 0.488$, exactly. These data contain no noise, so all three equations agree. With real, noisy data the equations conflict slightly and the least squares formula gives the best compromise.

**Step 4.** Convert to physical parameters.

$$\tau = -\frac{0.1}{\ln 0.8} = 0.448\ \text{s}, \qquad K = \frac{0.200}{1 - 0.800} = 1.00$$

The model is $G(s) = \dfrac{1}{0.448s + 1}$, ready for PI tuning by the method of Unit 13.
:::

This is machine learning in its simplest form: choose a model structure, collect data and find the parameters that minimise the prediction error. The autotuning functions of drives and temperature controllers do this behind the scenes.

:::warn The data must contain enough excitation
Data recorded while the plant sits still at one operating point say nothing about its dynamics, however many million points there are. The input must change enough for the plant to show its behaviour (persistent excitation). The principle holds for every kind of ML: a model can know only what its data cover.
:::

## Gradient descent {#gradient-descent}

When a model is not linear in its parameters there is no closed formula. The parameters are adjusted a little at a time in the direction that lowers the loss function $J$.

$$w \leftarrow w - \eta\,\frac{\partial J}{\partial w}$$

Here $\eta$ is the learning rate. It can be seen as a feedback loop: measure the error, adjust the parameter against it, and repeat, like an integral controller. It has the same problem: if $\eta$ (the gain) is too high, the adjustment oscillates and diverges.

:::example Example 17.2 Gradient descent by hand
Find $w$ in the model $y = wx$ from two data points $(x, y) = (1, 2)$ and $(2, 4)$, with the loss $J = \dfrac{1}{2}\sum (y_i - wx_i)^2$, starting from $w = 0$ with $\eta = 0.1$.

The gradient is $\dfrac{\partial J}{\partial w} = -\sum x_i(y_i - wx_i)$.

| Pass | $w$ before | Errors $y_i - wx_i$ | Gradient | $w$ after |
|---|---|---|---|---|
| 1 | 0 | 2, 4 | $-(1 \cdot 2 + 2 \cdot 4) = -10$ | $0 + 0.1(10) = 1.0$ |
| 2 | 1.0 | 1, 2 | $-(1 \cdot 1 + 2 \cdot 2) = -5$ | $1.0 + 0.5 = 1.5$ |
| 3 | 1.5 | 0.5, 1 | $-2.5$ | $1.75$ |

The error halves on every pass and $w$ converges to 2, the correct answer. This is a discrete-time first-order system with its pole at $z = 1 - \eta\sum x_i^2 = 0.5$. With $\eta > 0.4$ the pole leaves the unit circle and the learning diverges. The stability theory of Unit 15 explains the choice of learning rate directly.
:::

## Neural networks {#neural-network}

One **neuron** computes a weighted sum of its inputs and passes it through a nonlinear function.

$$y = \sigma\!\left(\sum_i w_ix_i + b\right)$$

Electrical students have built this circuit: an **op-amp summing amplifier** gives a weighted sum, with weights set by resistor ratios, and when the output hits the supply rail the op-amp saturates, which is the same kind of nonlinearity as an activation function. A neuron is a summing amplifier with saturation whose weights are set by gradient descent instead of by choosing resistors.

Connect many neurons in layers and the network can approximate almost any nonlinear function. In control there are three main uses.

| Use | What the network learns | Example |
|---|---|---|
| Plant model | A nonlinear relation from input to output | Battery models, solar cell characteristics |
| Estimator (soft sensor) | A quantity that cannot be measured, from quantities that can | Estimating rotor temperature or battery state of charge |
| Controller | The command from the state | Used with MPC or reinforcement learning |

## Reinforcement learning {#rl}

In **reinforcement learning (RL)** an agent observes the **state** of an environment, chooses an **action** and receives a **reward**. The aim is the policy that collects the most reward. It maps directly onto a control loop.

| RL | Control system |
|---|---|
| Agent | Controller |
| Environment | Plant |
| State | State vector $\mathbf{x}$ (Unit 14) |
| Action | Control signal $u$ |
| Reward | The negative of a performance index |
| Policy | Control law $u = \pi(\mathbf{x})$ |

The key difference is that RL needs no plant model but learns from thousands or millions of trials. It must therefore be trained in simulation first, because trial and error on a real transformer or machine is expensive and dangerous.

## Using AI to analyse performance {#performance}

Before a computer can judge whether a loop works well, "well" must be a number. The standard indices are computed from the error $e(t)$ after a setpoint change or a disturbance.

| Index | Definition | Character |
|---|---|---|
| IAE | $\displaystyle\int_0^\infty \lvert e(t)\rvert\,dt$ | Counts errors of every size equally |
| ISE | $\displaystyle\int_0^\infty e^2(t)\,dt$ | Penalises large errors more heavily |
| ITAE | $\displaystyle\int_0^\infty t\,\lvert e(t)\rvert\,dt$ | Penalises errors that persist |

:::example Example 17.3 Indices of a first-order loop
The closed loop of Example 13.1 is first order with $\tau_c = 20$ ms. After a unit step the error is $e(t) = e^{-t/\tau_c}$. Find the IAE and ISE.

$$\text{IAE} = \int_0^\infty e^{-t/\tau_c}\,dt = \tau_c = 0.020, \qquad \text{ISE} = \int_0^\infty e^{-2t/\tau_c}\,dt = \frac{\tau_c}{2} = 0.010$$

Both indices are proportional to $\tau_c$: a loop twice as fast has half the index. If the values computed from real data are much higher, the loop is not working as designed.
:::

With numbers in hand, AI helps at three levels.

1. **Control loop performance monitoring.** A process plant has thousands of PID loops. Software computes the indices continuously from DCS data and uses pattern classification to name the cause: poor tuning, valve stiction or a degrading sensor. Engineers then know which loop to look at first.
2. **Predictive maintenance.** A model learns the normal pattern of vibration, temperature and motor current spectrum (motor current signature analysis) and raises an alarm when the data start to drift, pointing to bearing wear, a broken rotor bar or failing insulation before the machine stops.
3. **Optimisation.** Search algorithms such as genetic algorithms find the PID values that minimise ITAE on a model, and forecasts of load and solar generation are used to plan unit commitment in power systems.

## Limits and engineering responsibility {#limits}

| Aspect | Classical controller | Data-trained controller |
|---|---|---|
| Guarantee of stability | Provable by Routh, Nyquist, margins | Generally not provable; relies on testing |
| Behaviour outside the training data | Predictable from the model | Unpredictable; may be badly wrong |
| Explanation | Readable from the equations | Often a black box |
| Computing resources | Very small | Larger, especially in training |

For these reasons industrial architectures put AI in the **upper layer**, where it recommends setpoints, tunes parameters or raises alarms. The real-time closed loop remains a PID or another controller whose stability can be analysed, and protection (relays, interlocks and emergency stop circuits) is an independent layer that does not depend on AI at all.

:::key AI does not replace the fundamentals; it makes them matter more
Someone who understands transfer functions, stability and margins knows what data to give a model, when to believe its output and where to set the safety limits. Someone who uses AI tools without the fundamentals cannot tell a correct answer from a convincing one. The same applies when an AI assistant helps with calculations or control code: always check the result by hand calculation or simulation, as you would check a colleague's work.
:::

## Exercises {#exercises}

:::exercise Exercise 17.1
A step test with $u = 2$ at $T = 0.5$ s gives $y = 0,\ 3.0,\ 4.5,\ 5.25$. Find $a$, $b$, $\tau$ and $K$.

:::answer Show answer
First row: $3.0 = 2b$, so $b = 1.5$. Second row: $4.5 = 3.0a + 3.0$, so $a = 0.5$. Check: $0.5 \times 4.5 + 3.0 = 5.25$.

$\tau = -\dfrac{0.5}{\ln 0.5} = 0.721$ s and $K = \dfrac{1.5}{1 - 0.5} = 3.0$ (the final value is $3 \times 2 = 6$).
:::
:::

:::exercise Exercise 17.2
In Example 17.2 use $\eta = 0.5$, calculate $w$ for the first three passes and explain the result.

:::answer Show answer
Pass 1: $w = 0 + 0.5(10) = 5$. Pass 2: the errors are $-3, -6$, the gradient is $-(1 \cdot (-3) + 2 \cdot (-6)) = 15$, so $w = 5 - 7.5 = -2.5$. Pass 3: the errors are $4.5, 9$, the gradient is $-22.5$, so $w = 8.75$.

$w$ swings about 2 with growing size ($3, -4.5, 6.75$) because the pole is at $z = 1 - 0.5 \times 5 = -1.5$, outside the unit circle. The learning is unstable.
:::
:::

:::exercise Exercise 17.3
Two loops have step errors $e_1(t) = e^{-t}$ and $e_2(t) = e^{-4t}$. Compare their IAE and ISE.

:::answer Show answer
Loop 1 ($\tau = 1$): IAE = 1, ISE = 0.5. Loop 2 ($\tau = 0.25$): IAE = 0.25, ISE = 0.125.

Loop 2 is 4 times better on both indices.
:::
:::

## Summary of Unit 17 and of the course {#summary}

- Machine learning is finding a function from data. System identification by least squares is its simplest form and is usable at once.
- Gradient descent is a feedback loop in parameter space. The learning rate is the gain, with the same kind of stability limit.
- A neuron is a weighted sum followed by a nonlinearity, comparable to a summing amplifier with saturation.
- The IAE, ISE and ITAE indices turn loop performance into numbers, the basis of loop monitoring and predictive maintenance with AI.
- In real systems AI works in the upper layer, while the real-time loop and the protection must remain analysable for stability and safety.

The whole course has followed the three questions of Unit 1: how the system behaves (Part 1), how the output changes and whether it is stable (Part 2), and how to design the controller (Parts 3–5). The tools change from op-amps to microcontrollers and from equations to data, but the three questions stay the same.
