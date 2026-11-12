---
title: "History of chemical thermodynamics, transport phenomena and reaction engineering"
url: https://modsengineeringmath.com/en/history/chemical-engineering/thermo-transport-reaction/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The scientific history of chemical engineering: Gibbs's thermodynamics, Fick's law, the Arrhenius equation, McCabe–Thiele, the Thiele modulus, Danckwerts's residence time distribution, the Transport Phenomena textbook and process simulation software.

Markdown copy of https://modsengineeringmath.com/en/history/chemical-engineering/thermo-transport-reaction/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of chemical thermodynamics, transport phenomena and reaction engineering

THภาษาไทยENEnglish
// History · History of Chemical Engineering · 2/4


Heat, mass and momentum are transferred by equations of the same form, the same form as Ohm's law in a circuit. Seeing that likeness is what turned chemical engineering from a set of formulas into an engineering science.

Chemical Engineering1. Origins & unit operations2. Thermodynamics & transport3. Industrial processes4. Process control & safety

## Gibbs and equilibrium

The chemical engineer's first question is always whether a reaction or separation is possible and how far it can go. The answer lies in the chemical thermodynamics Gibbs laid down in the 1870s: free energy gives the direction, the phase rule says how many variables must be fixed, and chemical potential says which way a substance moves between phases. His work was so hard to read that most European chemists knew nothing of it until Ostwald translated it into German and Le Chatelier into French in the 1890s.

On how fast, Arrhenius answered in 1889 that reaction rate rises exponentially with temperature, governed by an activation energy. That equation explains why a reactor that warms slightly can run away, the central concern of process safety.

## Timeline

- 1855Adolf Fick gives the law of mass diffusion, the same form as Fourier's law of heat conduction.

- 1874Osborne Reynolds proposes the analogy between momentum and heat transfer.

- 1875–1878Josiah Willard Gibbs publishes On the Equilibrium of Heterogeneous Substances, with the phase rule and free energy.

- 1889Svante Arrhenius gives the equation relating reaction rate to temperature.

- 1915Wilhelm Nusselt applies dimensional analysis to heat transfer and obtains the Nusselt number.

- 1925McCabe and Thiele publish the graphical design method for binary distillation columns.

- 1939Ernest Thiele gives the Thiele modulus, showing how much diffusion in a catalyst pellet limits the reaction.

- 1953Peter Danckwerts publishes the theory of residence time distribution in reactors.

- 1960Bird, Stewart and Lightfoot publish Transport Phenomena, uniting momentum, heat and mass transfer in one subject.

- 1962Octave Levenspiel publishes Chemical Reaction Engineering.

- 1976–1981The ASPEN project at MIT develops a process simulator that becomes Aspen Plus.

## Heat, mass and momentum move the same way

Fick set out the law of diffusion in 1855 and said openly that he had copied Fourier's law of heat conduction, with concentration in place of temperature and mass flux in place of heat flux. Reynolds pointed out in 1874 that momentum transfer in turbulent flow and heat transfer are linked. An electrical student will see that all of them have the form $I = V/R$: flux equals driving force divided by resistance.

In the first half of the twentieth century chemical engineers worked with separate empirical correlations, such as Nusselt numbers for heat transfer and McCabe and Thiele's graphical method for distillation. Bird, Stewart and Lightfoot's Transport Phenomena of 1960 unified everything through one set of differential conservation equations and changed chemical engineering curricula worldwide within a decade. Some call it the discipline's second paradigm, after unit operations.

## Reactors are not ideal

Textbooks have two ideal reactors: the perfectly mixed stirred tank and the plug-flow tube. Danckwerts showed in 1953 that real ones lie in between, and that you can measure where by injecting a tracer and watching when it comes out. Thiele showed in 1939 that in a porous catalyst pellet the reaction may be limited by diffusion rather than by the chemistry itself. Those two ideas and Levenspiel's 1962 textbook made chemical reaction engineering a clear sub-discipline.

When computers arrived, chemical engineers were among the first to simulate whole plants with them. The ASPEN project at MIT in the 1970s became the software used to design refineries and petrochemical plants worldwide, which underneath is the numerical solution of very large systems of nonlinear equations.

## Key people

### Josiah Willard Gibbs
1839–1903 · United States
Published a work of over three hundred pages in a small Connecticut journal that laid the whole foundation of chemical thermodynamics. Gibbs free energy tells whether a reaction will go on its own, and the phase rule counts the free variables in a multiphase system. Chemical engineers use both daily.

### Adolf Fick
1829–1901 · Germany
A physiologist who set up the law of mass diffusion by analogy with Fourier's law of heat conduction and Ohm's law. He also made an early contact lens and devised a way to measure cardiac output.

### Ernest Thiele
1895–1993 · United States
An engineer with Standard Oil of Indiana whose name is on two tools every chemical engineering student knows: the McCabe–Thiele method for distillation and the Thiele modulus for catalysts.

### Peter Danckwerts
1916–1984 · England
Won the George Cross defusing bombs in wartime London before becoming professor of chemical engineering at Cambridge. His 1953 paper showed that real reactors are neither perfectly mixed tanks nor ideal plug-flow tubes, and gave a way to measure how far from ideal they are.

### R. Byron Bird
1924–2020 · United States
A University of Wisconsin professor who co-wrote Transport Phenomena (1960), which moved chemical engineering teaching from empirical correlations to the differential conservation equations. Known simply as BSL, it is still taught worldwide.

## Where this continues on the site

- Multivariable calculus, the language of transport phenomena (in Thai)

- Fourier series, invented to solve the heat equation (in Thai)

- Solving differential equations with the Laplace transform (in Thai)

- Numerical methods, the heart of process simulators (in Thai)

## Frequently asked questions

What is transport phenomena?
The study of momentum, heat and mass transfer through a single set of conservation equations. The standard text is Transport Phenomena by Bird, Stewart and Lightfoot (1960).

What is the McCabe–Thiele method?
A graphical method for finding the number of theoretical stages in a binary distillation column, published by Warren McCabe and Ernest Thiele in 1925. It is still taught to build understanding before using software.

How is Fick's law related to Ohm's law?
They have the same form: flux proportional to driving force over resistance. Fick's law uses a concentration difference to drive mass diffusion, Fourier's law a temperature difference to drive heat, and Ohm's law a potential difference to drive current.

## Sources and further reading

- Gibbs, J. W. “On the Equilibrium of Heterogeneous Substances.” Transactions of the Connecticut Academy of Arts and Sciences 3 (1875–1878).

- Bird, R. B., Stewart, W. E., and Lightfoot, E. N. Transport Phenomena. Wiley, 1960.

- Danckwerts, P. V. “Continuous Flow Systems: Distribution of Residence Times.” Chemical Engineering Science 2 (1953): 1–13.

- Levenspiel, O. Chemical Reaction Engineering. Wiley, 1962.

- Peppas, N. A., ed. One Hundred Years of Chemical Engineering. Kluwer, 1989.

← PreviousOrigins & unit operationsNext →Industrial processes

## Frequently asked questions

**What is transport phenomena?**
The study of momentum, heat and mass transfer through a single set of conservation equations. The standard text is Transport Phenomena by Bird, Stewart and Lightfoot (1960).

**What is the McCabe–Thiele method?**
A graphical method for finding the number of theoretical stages in a binary distillation column, published by Warren McCabe and Ernest Thiele in 1925. It is still taught to build understanding before using software.

**How is Fick's law related to Ohm's law?**
They have the same form: flux proportional to driving force over resistance. Fick's law uses a concentration difference to drive mass diffusion, Fourier's law a temperature difference to drive heat, and Ohm's law a potential difference to drive current.
