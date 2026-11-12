---
title: "State-Space Models"
url: https://modsengineeringmath.com/en/courses/control-engineering/state-space/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> What state variables are, writing the state equations of an RLC circuit and a DC motor, converting to a transfer function, eigenvalues and poles, controllability and observability, and pole placement by state feedback.

Markdown copy of https://modsengineeringmath.com/en/courses/control-engineering/state-space/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# State-Space Models

// Unit 14 · Control Engineering


What state variables are, writing the state equations of an RLC circuit and a DC motor, converting to a transfer function, eigenvalues and poles, controllability and observability, and pole placement by state feedback.

## What you can do after this unit

- Choose the state variables of electrical and electromechanical systems and write the state equations in matrix form
- Convert a state-space model to a transfer function
- Find the poles of a system from the eigenvalues of the matrix A
- Test controllability and design a state feedback gain to place the poles of a second-order system

## The picture to keep in mind: what must you know to predict the future?

Stop the clock and ask what values must be noted down so that the behaviour of a circuit can be worked out once time runs again. For an electric circuit the answer is the voltage of every capacitor and the current of every inductor, because they give the stored energy. Everything else in the circuit follows from these and the input.

The smallest set of quantities that sums up the whole past of a system is its state. A transfer function gives only the relation between input and output. A state-space model opens up what happens inside.

|
|
Transfer function |
State space |

|
Views the system as |
A black box, input → output |
All the internal variables |

|
Mathematics |
Polynomials in $s$ |
Matrices and first-order differential equations |

|
Initial conditions |
Taken as zero |
Included directly |

|
Several inputs and outputs |
Awkward |
Same form, larger matrices |

|
Suits |
Hand design, frequency methods |
Computer calculation, simulation, modern control |

## Standard form

$$\dot{\mathbf{x}} = A\mathbf{x} + B\mathbf{u}, \qquad \mathbf{y} = C\mathbf{x} + D\mathbf{u}$$

|
Symbol |
Name |
Size ($n$ states, one input, one output) |

|
$\mathbf{x}$ |
State vector |
$n \times 1$ |

|
$A$ |
System matrix |
$n \times n$ |

|
$B$ |
Input matrix |
$n \times 1$ |

|
$C$ |
Output matrix |
$1 \times n$ |

|
$D$ |
Feedthrough matrix (usually zero) |
$1 \times 1$ |

The number of states $n$ equals the number of independent energy-storing elements and the order of the system.

Example 14.1 Series RLC circuit

Write the state-space model of the RLC circuit of Example 3.1 ($R = 10\ \Omega$, $L = 10$ mH, $C = 100\ \mu\text{F}$) with the capacitor voltage as output.

Step 1. Choose the states: $x_1 = i_L$ and $x_2 = v_C$. Input $u = v_i$.

Step 2. Write the equation of each energy-storing element.

$$L\frac{di_L}{dt} = v_i - Ri_L - v_C, \qquad C\frac{dv_C}{dt} = i_L$$

Step 3. Isolate each derivative on the left and write in matrix form.

$$\begin{bmatrix}\dot{x}_1\\ \dot{x}_2\end{bmatrix} = \begin{bmatrix}-R/L & -1/L\\ 1/C & 0\end{bmatrix}\begin{bmatrix}x_1\\ x_2\end{bmatrix} + \begin{bmatrix}1/L\\ 0\end{bmatrix}u, \qquad y = \begin{bmatrix}0 & 1\end{bmatrix}\mathbf{x}$$

Step 4. Substitute.

$$A = \begin{bmatrix}-1000 & -100\\ 10^{4} & 0\end{bmatrix}, \qquad B = \begin{bmatrix}100\\ 0\end{bmatrix}, \qquad C = \begin{bmatrix}0 & 1\end{bmatrix}$$

## Eigenvalues are poles

Transform the state equation with zero initial conditions: $sX = AX + BU$, so $X = (sI - A)^{-1}BU$ and

$$G(s) = C(sI - A)^{-1}B + D$$

The denominator of $G(s)$ comes from $\det(sI - A)$, therefore

Poles of the system = eigenvalues of A

The roots of $\det(sI - A) = 0$ are the eigenvalues of the matrix $A$ and the poles of the system. The system is stable when every eigenvalue has a negative real part: the condition of Unit 8, written in the language of matrices.

Example 14.2 Check against the transfer function

For Example 14.1 find the poles and the transfer function.

$$sI - A = \begin{bmatrix}s + 1000 & 100\\ -10^{4} & s\end{bmatrix}, \qquad \det(sI - A) = s^2 + 1000s + 10^{6}$$

Roots: $s = -500 \pm j866$, in agreement with $\omega_n = 1000$ rad/s and $\zeta = 0.5$ in Example 3.1.

The inverse of the $2 \times 2$ matrix is $\dfrac{1}{\det}\begin{bmatrix}s & -100\\ 10^{4} & s + 1000\end{bmatrix}$, so

$$G(s) = \begin{bmatrix}0 & 1\end{bmatrix}\frac{1}{\det}\begin{bmatrix}s & -100\\ 10^{4} & s + 1000\end{bmatrix}\begin{bmatrix}100\\ 0\end{bmatrix} = \frac{10^{6}}{s^2 + 1000s + 10^{6}}$$

the same as the impedance method gave.

## The DC motor in state space

The motor has two energy stores: the armature inductance (current $i_a$) and the inertia (speed $\omega$). From the equations of Unit 3,

$$\begin{bmatrix}\dot{i}_a\\ \dot{\omega}\end{bmatrix} = \begin{bmatrix}-R_a/L_a & -K/L_a\\ K/J & -b/J\end{bmatrix}\begin{bmatrix}i_a\\ \omega\end{bmatrix} + \begin{bmatrix}1/L_a\\ 0\end{bmatrix}v_a$$

With $C = \begin{bmatrix}0 & 1\end{bmatrix}$ the output is speed; with $C = \begin{bmatrix}1 & 0\end{bmatrix}$ it is current. One model gives both at once, which matches the structure of a drive that measures and controls both current and speed.

## Controllability and observability

|
Property |
Question |
Test ($n$ states) |

|
Controllability |
Can the input take every state to any required value? |
$\mathcal{C} = \begin{bmatrix}B & AB & \cdots & A^{n-1}B\end{bmatrix}$ has rank $n$ |

|
Observability |
Can every state be found from measurements of the output? |
$\mathcal{O} = \begin{bmatrix}C\\ CA\\ \vdots\\ CA^{n-1}\end{bmatrix}$ has rank $n$ |

For a single-input single-output system both matrices are square, so a non-zero determinant is the test.

A picture: two batteries in parallel with one charger. We cannot charge one fully while leaving the other empty, so the system is not completely controllable. Observability is the basis of sensorless control in drives, which calculates the speed from measured voltage and current with no encoder.

## Pole placement by state feedback

Instead of feeding back only the output, feed back every state.

$$u = -K\mathbf{x} + r, \qquad K = \begin{bmatrix}k_1 & k_2 & \cdots & k_n\end{bmatrix}$$

The closed loop is $\dot{\mathbf{x}} = (A - BK)\mathbf{x} + Br$, and its poles are the eigenvalues of $A - BK$. If the system is controllable, $K$ can be chosen to put the closed-loop poles anywhere, which is more freedom than the compensators of Unit 10 give.

Example 14.3 Placing the poles of a servo

The plant is $G(s) = \dfrac{1}{s(s + 1)}$ (the system of Example 10.1). Choose the states $x_1$ = position and $x_2$ = speed.

$$A = \begin{bmatrix}0 & 1\\ 0 & -1\end{bmatrix}, \qquad B = \begin{bmatrix}0\\ 1\end{bmatrix}$$

Find $K$ to place the poles at $s = -2 \pm j3.464$.

Step 1. Controllability: $\mathcal{C} = \begin{bmatrix}B & AB\end{bmatrix} = \begin{bmatrix}0 & 1\\ 1 & -1\end{bmatrix}$ has determinant $-1 \ne 0$. The system is controllable.

Step 2. Required characteristic polynomial.

$$(s + 2)^2 + 3.464^2 = s^2 + 4s + 16$$

Step 3. Closed-loop characteristic polynomial.

$$A - BK = \begin{bmatrix}0 & 1\\ -k_1 & -1 - k_2\end{bmatrix}, \qquad \det(sI - A + BK) = s^2 + (1 + k_2)s + k_1$$

Step 4. Match coefficients: $k_1 = 16$ and $1 + k_2 = 4$.

$$K = \begin{bmatrix}16 & 3\end{bmatrix}$$

In workshop language: feed back position with a gain of 16 and speed with a gain of 3, which is the structure of a servo with both a position encoder and a tachometer. The closed loop has no zero, so it overshoots by exactly the 16.3 % of the second-order formula, unlike the lead compensator of Example 10.1, which overshot 27 %.

When not every state can be measured

State feedback needs every state, but sensors cost money and some quantities cannot be measured directly. The answer is an observer: a model of the plant that runs in parallel in the processor and corrects itself with the difference between the measured output and its predicted output. A Kalman filter is an observer whose gain is chosen to suit the noise levels, and it is used to estimate battery state of charge (SOC) in electric vehicles.

## Exercises

Exercise 14.1

A series RL circuit has $R = 10\ \Omega$ and $L = 0.1$ H. Write the state-space model with the resistor voltage as output.

Show answer

One state, $x = i$: $\dot{x} = -\dfrac{R}{L}x + \dfrac{1}{L}u = -100x + 10u$ and $y = Rx = 10x$

$A = -100$, $B = 10$, $C = 10$, $D = 0$. The eigenvalue is $-100$, in agreement with $\tau = 10$ ms.

Exercise 14.2

Find the eigenvalues of $A = \begin{bmatrix}0 & 1\\ -6 & -5\end{bmatrix}$ and say whether the system is stable.

Show answer

$\det(sI - A) = s(s + 5) + 6 = s^2 + 5s + 6 = (s + 2)(s + 3)$

The eigenvalues are $-2$ and $-3$, both real and negative. The system is stable and overdamped.

Exercise 14.3

For the system of Exercise 14.2 with $B = \begin{bmatrix}0\\ 1\end{bmatrix}$, find $K$ to place the poles at $s = -4 \pm j4$.

Show answer

We want $s^2 + 8s + 32$. The closed loop has $\det(sI - A + BK) = s^2 + (5 + k_2)s + (6 + k_1)$.

So $k_1 = 26$ and $k_2 = 3$, that is $K = \begin{bmatrix}26 & 3\end{bmatrix}$.

## Summary of Unit 14

- The state is the smallest set of variables giving the stored energy of a system. In a circuit these are the inductor currents and capacitor voltages.

- The model is $\dot{\mathbf{x}} = A\mathbf{x} + B\mathbf{u}$, $\mathbf{y} = C\mathbf{x} + D\mathbf{u}$, and $G(s) = C(sI - A)^{-1}B + D$.

- The poles are the eigenvalues of $A$.

- A controllable system can have its closed-loop poles placed anywhere with $u = -K\mathbf{x} + r$.

- An observer estimates unmeasured states from the measured output.
