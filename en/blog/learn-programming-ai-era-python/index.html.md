---
title: "Learning to Program in the AI Era: Why Start with Python"
url: https://modsengineeringmath.com/en/blog/learn-programming-ai-era-python/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-25
---

> AI writes code in any language, but if you cannot read code you cannot tell whether it is right. Why Python is the best first language, six core concepts, an RC-circuit check and a 4-week plan.

Markdown copy of https://modsengineeringmath.com/en/blog/learn-programming-ai-era-python/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Learning to Program in the AI Era: Why Start with Python

THภาษาไทยENEnglish
// Article · Programming & AI


Today you can type a request in plain Thai or English, “write a program that calculates my electricity bill,” and get runnable code in seconds. Programming languages are no longer the wall they were ten years ago. But code that runs is not code that is right. AI can use the wrong formula, mix up units or miss an edge case, and someone who cannot read code will never notice.

The 30-second summary

- The new goal of learning to program is not memorizing syntax but being able to read it, direct it and verify it

- Start with Python: it is the most readable, the main language of AI and engineering work, and runs in Google Colab right away

- Get the six core concepts solid and you can read AI-written code in almost any language

- Check AI's work with engineering knowledge, such as the time constant of an RC circuit, and write the checks into the code as assert statements

## AI took over the typing; the thinking is still yours

Programming skills now split into two groups: work AI already does well, and work that still needs human understanding. The second group matters more than ever.

| Skill | Before AI | In the AI era |

| Remembering syntax and function names | Memorize or look it up | AI handles almost all of it |

| Typing repetitive boilerplate | Write every line yourself | AI handles it |

| Translating code between languages | Must know both languages | AI handles it, but you must check |

| Breaking a problem into steps | Required | More important, because it is what you tell the AI |

| Reading and understanding code | Required | More important, because you must check AI's work |

| Testing and debugging | Required | More important |

| Domain knowledge (math, physics, circuits) | Required | Decides whether the code is right or wrong |

Think of an electrical engineer. They do not pull every cable themselves, but they must read the schematic and spot what is wrong. The programmer's role shifts the same way: from typist to designer and reviewer.

## Why Python should be your first language

Python is the most readable of the major languages, and it is the main language of AI, science and engineering work. That makes it the best fit for “read it, direct it, verify it.”

- Reads like plain language. No variable declarations, no curly braces or semicolons; indentation shows the structure. Code that is easy to read is code that is easy to check.

- The main language of AI work. GitHub's Octoverse 2025 report ↗ says Python powers nearly half of all new AI repositories.

- Covers real engineering work. NumPy and SciPy for numerical computing, Matplotlib for plots, pandas for lab data, and MicroPython for microcontrollers such as the ESP32. See NumPy/SciPy solving linear systems in the numerical methods chapter of the linear algebra lessons (in Thai).

- Start in a minute. Open Google Colab ↗ in a browser and you can write and run code with nothing to install.

- Ranked number one. The October 2026 TIOBE index puts Python first at 19.23%, well ahead of C in second at 11.33% (TechRepublic ↗).

The other side of the story: Octoverse 2025 also reports that TypeScript overtook Python in August 2025 as the language with the most contributors on GitHub. GitHub credits part of that to type systems catching errors in AI-generated code before production. The lesson for beginners is that checking AI code really matters, and Python's type hints are there to learn once you are ready.

## Six core concepts you must truly understand

Every program in every language is built from these six concepts. Master them and you can read AI-written code in almost any language.

| Concept | What it does | Python example | Question to ask of AI code |

| Variables and data types | Store values such as numbers and text | R = 4.7e3 | Are the value and unit right? Integer or float? |

| Conditions | Make decisions | if V > 5: | Are all cases covered? Should it be > or >=? |

| Loops | Repeat work | for t in times: | How many times? When does it stop? Can it loop forever? |

| Functions | Package work: inputs in, result out | def power(V, I): return V * I | What goes in, what comes out? Can it be tested on its own? |

| Data structures | Organize many pieces of data | parts = {"R": 1e3, "C": 1e-6} | How is the data stored and retrieved? |

| Testing and debugging | Prove the code is right and find faults | assert abs(tau - 0.1) < 1e-9 | Has it been tested against a case with a known answer? |

The last column is the heart of learning in the AI era: these are the questions you must answer yourself before trusting the output. The same concepts appear in PLC languages too; see one task written in five IEC 61131-3 languages (in Thai).

## Engineering example: let AI write it, then verify it yourself

AI does only one step in this loop; prompting, reading and testing are your job. The example below follows the loop step by step.

The task: an RC circuit charges from a 10 V source through R = 1 kΩ and C = 100 µF. We want a plot of the capacitor voltage from 0 to 0.5 s (review the theory in transients in DC circuits, in Thai).

-
Give a clear instruction. Any language works, but state the values, the units and the output you want.

Write Python that computes the capacitor voltage of an RC circuit charging from 10 V with R = 1 kΩ and C = 100 µF, and plot it from 0 to 0.5 seconds with labeled axes and units.

-
Read the code you get back. You should be able to explain every line.

import numpy as np
import matplotlib.pyplot as plt

Vs = 10 # source voltage (V)
R = 1e3 # 1 kΩ
C = 100e-6 # 100 µF
tau = R * C # time constant (s)

t = np.linspace(0, 0.5, 500)
v = Vs * (1 - np.exp(-t / tau))

plt.plot(t, v)
plt.xlabel("t (s)")
plt.ylabel("v_C (V)")
plt.grid(True)
plt.show()

-
Check it with circuit knowledge, not just by seeing that it runs. The code implements

$$v_C(t) = V_s\left(1 - e^{-t/RC}\right)$$

- Time constant τ = RC = 1000 × 0.0001 = 0.1 s

- At t = τ the voltage must be 63.2% of Vs, about 6.32 V

- At t = 5τ = 0.5 s the voltage must be nearly full, about 9.93 V

Write those checks into the code so they run again after every change.

assert abs(tau - 0.1) < 1e-9 # τ = RC = 0.1 s
assert abs(np.interp(0.1, t, v) - 6.32) < 0.01 # at t = τ expect ≈ 6.32 V

If the AI misreads µ as m and writes C = 100e-3, the code still runs with no error. But τ becomes 100 s and the plot is an almost flat line near 0 V (only about 0.05 V at 0.5 s). Anyone who knows τ should be 0.1 s catches it at once; anyone who does not ships a wrong answer. Compare the result with a real waveform on an oscilloscope in measuring the RC time constant τ (in Thai).

## A four-week starter plan, learning alongside AI

Spend 30–60 minutes a day in Google Colab and keep three rules throughout: try it yourself before asking AI, explain every line before you use it, and test against values you already know.

- Week 1: Variables, data types, input and output
Practice: an Ohm's law calculator and an electricity-bill calculator · Use AI to: explain code line by line; do not ask for whole programs yet

- Week 2: Conditions and loops
Practice: assign grades from scores, and total the resistance of several resistors · Use AI to: review code you wrote yourself and point out improvements

- Week 3: Functions and data structures
Practice: functions for series and parallel resistance; store component data in a dict · Use AI to: write the functions, while you write the assert tests yourself

- Week 4: NumPy, Matplotlib and a small project
Practice: plot an RC circuit response or data from a lab experiment · Use AI to: build the whole thing from a detailed instruction, then verify it with hand calculations

The AI's role grows from explainer to reviewer to author, while yours grows from learner to verifier.

## Traps for beginners in the AI era

The biggest risk today is ending up with a working program and no understanding to show for it.

- Copying without reading. Fast on day one, but once the code grows or breaks, you cannot fix it.

- Believing “it runs” means “it's right.” The most dangerous bugs raise no error, like the unit mistake in the example above.

- Skipping the basics for a big project. Without understanding the structure, you cannot tell the AI what to fix.

- Hopping between languages. The six concepts are the same everywhere; one language understood deeply beats several known on the surface.

- Pasting secrets into AI. Remove passwords, API keys and other people's personal data before you paste any code.

## What about other languages?

Once you understand the concepts through Python, a second language comes much faster: AI can translate the syntax, so you only need to learn what makes that language different.

| Language | Best for | Learn it next when |

| C / C++ | Firmware and microcontrollers (Arduino, ESP32, STM32) and speed-critical work, such as a PI controller in C for a converter (in Thai) | You need direct control of hardware, timing and memory |

| JavaScript / TypeScript | Websites, dashboards, browser apps | You want to build web pages or user interfaces |

| MATLAB / Simulink | Control systems (in Thai) and system simulation | Your course or workplace uses it as the standard |

| Ladder / Structured Text (IEC 61131-3) | PLCs and factory automation (English edition) | You work in industrial control |

Every language in this table still uses the same six concepts; only the notation and the environment the program runs in change.

## Conclusion

AI has not made learning to program unnecessary; it has changed what you need to learn. The focus moves from memorizing syntax to understanding logic, reading code and verifying results.

Start with Python, get the six core concepts solid, and practice checking AI's work with the math and engineering you already know. AI can write code quickly, but the person who knows whether that code is right is the one who understands both the program and the real problem.

Sources: GitHub, Octoverse 2025 (Oct 28, 2025, updated Feb 28, 2026) ↗ · TechRepublic, TIOBE Index for October 2026 (Oct 12, 2026) ↗

## Keep reading in the library

- Numerical methods for linear systems, with NumPy/SciPy/MATLAB code (in Thai)

- Circuit lab: try the RC circuit and compare it with your code's output

- PLC programming languages under IEC 61131-3 (English edition)

- Article: Gauss, LU, Jacobi or Gauss–Seidel — which should you use?

## Frequently asked questions

Do you still need to learn programming in the AI era?
Yes, but what you learn changes. AI can type the code and remember the syntax, but you still have to break the problem into steps to instruct it, read the code it returns, and test it against values you already know, because code that runs is not necessarily code that is right.

Why start learning to program with Python?
Python is the most readable of the major languages and uses indentation to show structure, so AI-written code is easy to check. It is the main language of AI, science and engineering work (NumPy, SciPy, Matplotlib), and you can start in Google Colab with nothing to install.

Which concepts should you understand before using AI to write code?
Six concepts that apply to every language: variables and data types, conditions, loops, functions, data structures, and testing and debugging. Once you understand them you can read AI-written code in almost any language.

How can you tell whether AI-generated code is correct?
Test it against cases with known answers from your own field. For an RC circuit with R = 1 kΩ and C = 100 µF the time constant must be 0.1 s, and at t = τ the voltage must be 63.2% of the source. Then write those checks into the code as assert statements.

Which language should you learn after Python?
Choose by the work: C/C++ for microcontrollers and firmware, JavaScript/TypeScript for the web, MATLAB/Simulink for control systems, and Ladder or Structured Text for PLCs. The same concepts carry over, and AI can translate the syntax for you.

## More articles worth reading

Control systems
PID Tuning: The Complete Guide from Step Test to Ziegler–Nichols, SIMC and Anti-Windup
A full PID tuning course in one article: identify the process with a step test, tune with Ziegler–Nichols, Cohen–Coon, SIMC or relay, compare the…
16 Oct 2026Read the article →

Linear algebra
Cramer's Rule: How to Use It, Why It Works, and When Not to Use It
Cramer's rule explained: replace a column by the constants and divide determinants, 2×2 and 3×3 examples, one unknown, a two-line proof, the Δ = 0…
25 Oct 2026Read the article →

Linear algebra
12 Determinant Properties That Appear on Every Exam: det(kA), det(A⁻¹), det(adj A) and the Traps
The 12 determinant properties used in entrance exams and engineering mathematics: row operations, det(kA) = kⁿ det A, products, inverses and the…
25 Oct 2026Read the article →

All 1 article in Programming & AI → · All articles

## Frequently asked questions

**Do you still need to learn programming in the AI era?**
Yes, but what you learn changes. AI can type the code and remember the syntax, but you still have to break the problem into steps to instruct it, read the code it returns, and test it against values you already know, because code that runs is not necessarily code that is right.

**Why start learning to program with Python?**
Python is the most readable of the major languages and uses indentation to show structure, so AI-written code is easy to check. It is the main language of AI, science and engineering work (NumPy, SciPy, Matplotlib), and you can start in Google Colab with nothing to install.

**Which concepts should you understand before using AI to write code?**
Six concepts that apply to every language: variables and data types, conditions, loops, functions, data structures, and testing and debugging. Once you understand them you can read AI-written code in almost any language.

**How can you tell whether AI-generated code is correct?**
Test it against cases with known answers from your own field. For an RC circuit with R = 1 kΩ and C = 100 µF the time constant must be 0.1 s, and at t = τ the voltage must be 63.2% of the source. Then write those checks into the code as assert statements.

**Which language should you learn after Python?**
Choose by the work: C/C++ for microcontrollers and firmware, JavaScript/TypeScript for the web, MATLAB/Simulink for control systems, and Ladder or Structured Text for PLCs. The same concepts carry over, and AI can translate the syntax for you.
