---
title: "History of process control and safety: from pneumatic controllers to SIL"
url: https://modsengineeringmath.com/en/history/chemical-engineering/process-control-safety/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The history of process control in the chemical industry: pneumatic controllers, Ziegler–Nichols tuning, 4–20 mA, the DCS, model predictive control, and the safety lessons of Flixborough, Seveso, Bhopal and Piper Alpha that led to HAZOP and IEC 61511.

Markdown copy of https://modsengineeringmath.com/en/history/chemical-engineering/process-control-safety/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of process control and safety: from pneumatic controllers to SIL

THภาษาไทยENEnglish
// History · History of Chemical Engineering · 4/4


A chemical plant is where chemical, electrical and control engineers work most closely together, and where a small mistake can become a disaster. This part of the history is about both progress and lessons paid for in lives.

Chemical Engineering1. Origins & unit operations2. Thermodynamics & transport3. Industrial processes4. Process control & safety

## Compressed air as a signal

Before electronics were reliable on the plant floor, control in the chemical industry ran on compressed air. Instruments turned temperature or pressure into an air pressure, pneumatic controllers did the arithmetic with bellows and nozzles, and the output air pressure opened and closed valves. The advantage was no sparks in areas full of flammable vapour. In the 1930s makers such as Taylor and Foxboro added reset (integral) and pre-act (derivative) action, giving full PID.

The trouble was that nobody knew how to set the three terms. Ziegler and Nichols ran a great many experiments and published their rules in 1942. One method raises the gain until the loop oscillates steadily, then computes the settings from that gain and period. The result is rather oscillatory, but it is a workable starting point and is still taught.

## Timeline

- 1930sMakers such as Taylor Instrument and Foxboro sell pneumatic controllers with integral and derivative action.

- 1942John Ziegler and Nathaniel Nichols at Taylor Instrument publish their PID tuning rules.

- 1950sThe 3–15 psi pneumatic signal standard links instruments and valves in plants worldwide.

- 1959–1962Refineries and chemical plants begin using computers for process control, both supervisory and direct digital control (DDC).

- 1970sThe 4–20 mA current loop becomes the standard in place of pneumatic signals.

- 1974The Flixborough explosion in England kills 28, caused by a temporary pipe fitted without assessing the change.

- 1975Honeywell's TDC 2000 and Yokogawa's CENTUM, the first distributed control systems (DCS), reach the market.

- 1976Dioxin escapes at Seveso, Italy, leading to the European Seveso Directive of 1982.

- 1978–1979Model predictive control (MPC) appears in industry, with IDCOM in France and Shell's DMC.

- 1984Methyl isocyanate leaks at Bhopal, India, the worst industrial disaster in history.

- 1988The Piper Alpha platform in the North Sea explodes, killing 167.

- 2003IEC 61511 sets requirements for safety instrumented systems (SIS) and SIL levels in the process industries.

## From control rooms full of dials to the DCS

In the late 1950s refineries and chemical plants began trying computers, some only adjusting the setpoints of analogue controllers, others driving valves directly. But a single computer was a single point of failure for the whole plant. In 1975 Honeywell and Yokogawa launched distributed control systems, spreading control over many networked units with the displays gathered in the control room. The DCS became the standard of the process industries, while the PLC ruled discrete manufacturing.

Signals between instruments and the control system moved from 3–15 psi air to 4–20 mA current in the 1970s; the live zero at 4 mA lets the system tell a true zero from a broken wire. HART, fieldbus and plant Ethernet followed. Model predictive control, developed at Shell and in France in the late 1970s, handled several variables at once within constraints, and could raise a refinery's margin enough to pay for itself in months.

## Lessons paid for in lives

In 1974 a nylon intermediate plant at Flixborough in England had to take one reactor out for repair. Engineers bridged the gap with a temporary pipe that was never properly designed or assessed. It ruptured, cyclohexane escaped as a vapour cloud and exploded, killing 28. The lesson was management of change. In 1976 dioxin escaped at Seveso in Italy, leading to Europe's Seveso Directive. In 1984 methyl isocyanate leaked from a pesticide plant at Bhopal in India, killing thousands in one night and many more in the years after; several layers of protection were not working or had been switched off.

In 1988 the Piper Alpha platform in the North Sea exploded after a new shift started a pump whose relief valve had been removed for maintenance, because of a breakdown in the permit-to-work system; 167 died. From these events came methods such as HAZOP, developed at ICI and spread by Trevor Kletz, the idea of inherently safer design, and the IEC 61508/61511 standards with their SIL levels for safety instrumented systems, which electrical and instrument engineers in Thai petrochemical plants use every day.

## Key people

### John G. Ziegler
1909–1997 · United States
A Taylor Instrument engineer who, with Nathaniel Nichols, tuned controllers on many real and simulated processes until they had simple rules a plant technician could use without knowing the process transfer function. Ziegler–Nichols is still where PID tuning is taught to start.

### Trevor Kletz
1922–2013 · England
An ICI chemist who spent most of his career on process safety. He popularised the hazard and operability study (HAZOP) and the idea of inherently safer design. His line that what you don't have can't leak is still the first principle of plant design.

### Charles R. Cutler
Key work 1979 · United States
A Shell engineer who developed Dynamic Matrix Control in the late 1970s, using a step-response model to predict the process and find the best valve moves within constraints. MPC became the standard advanced control method in refineries and petrochemical plants worldwide.

## Where this continues on the site

- The PID controller (in Thai)

- PID tuning, including Ziegler–Nichols (in Thai)

- 4–20 mA signals and HART (in Thai)

- Installation, calibration, hazardous areas and SIL (in Thai)

- Virtual process plant lab with two PID loops (in Thai)

- P&ID drawings and ISA-5.1 tags (in Thai)

## Frequently asked questions

When did the DCS appear?
The first distributed control systems reached the market in 1975: Honeywell's TDC 2000 and Yokogawa's CENTUM, which spread control across many networked units.

What is HAZOP and where did it come from?
A hazard and operability study: a systematic, section-by-section review of a plant design using guidewords such as more, less, none and reverse to find what could go wrong. It was developed at ICI in Britain in the 1960s and spread by Trevor Kletz.

Why do industrial signals start at 4 mA instead of 0 mA?
To separate a measured zero from a broken wire. A broken loop reads 0 mA, below the normal range, so the control system knows at once; 4 mA is also enough to power a two-wire transmitter.

## Sources and further reading

- Ziegler, J. G., and Nichols, N. B. “Optimum Settings for Automatic Controllers.” Transactions of the ASME 64 (1942): 759–768.

- Kletz, T. What Went Wrong? Case Histories of Process Plant Disasters, 5th ed. Butterworth-Heinemann, 2009.

- Qin, S. J., and Badgwell, T. A. “A Survey of Industrial Model Predictive Control Technology.” Control Engineering Practice 11 (2003): 733–764.

- Health and Safety Executive. The Flixborough Disaster: Report of the Court of Inquiry. HMSO, 1975.

- Cullen, Lord. The Public Inquiry into the Piper Alpha Disaster. HMSO, 1990.

← PreviousIndustrial processesNext →History

## Frequently asked questions

**When did the DCS appear?**
The first distributed control systems reached the market in 1975: Honeywell's TDC 2000 and Yokogawa's CENTUM, which spread control across many networked units.

**What is HAZOP and where did it come from?**
A hazard and operability study: a systematic, section-by-section review of a plant design using guidewords such as more, less, none and reverse to find what could go wrong. It was developed at ICI in Britain in the 1960s and spread by Trevor Kletz.

**Why do industrial signals start at 4 mA instead of 0 mA?**
To separate a measured zero from a broken wire. A broken loop reads 0 mA, below the normal range, so the control system knows at once; 4 mA is also enough to power a two-wire transmitter.
