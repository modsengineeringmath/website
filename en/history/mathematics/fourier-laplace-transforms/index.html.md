---
title: "History of the Fourier and Laplace transforms: from heat flow to circuits and the FFT"
url: https://modsengineeringmath.com/en/history/mathematics/fourier-laplace-transforms/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> Where the Fourier series came from in the theory of heat, how the Laplace transform grew from probability through Heaviside's operational calculus, the Gibbs phenomenon, the z-transform and the Cooley–Tukey FFT.

Markdown copy of https://modsengineeringmath.com/en/history/mathematics/fourier-laplace-transforms/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of the Fourier and Laplace transforms: from heat flow to circuits and the FFT

THภาษาไทยENEnglish
// History · History of Mathematics · 4/6


The two tools electrical students use most were not invented for circuits at all. Fourier was thinking about heat, Laplace about probability. The person who turned them on real circuits was a telegraph engineer the mathematicians would not take seriously.

Mathematics1. Ancient mathematics2. Algebra & analytic geometry3. Calculus4. Fourier & Laplace5. Linear algebra & vectors6. Probability & computing

## Heat in an iron bar

Fourier was prefect of the Isère department in France and spent his spare time studying how heat spreads through a solid. He found that if the initial temperature profile is split into a sum of sine shapes, each shape fades away exponentially at its own rate. A complicated problem became many simple ones added together. That is the idea of splitting a signal into frequencies that electrical engineers use for everything from harmonics to 5G.

The memoir he submitted in 1807 met objections from Lagrange, because it claimed that functions with corners or jumps could be written as sums of smooth sines, which mathematicians of the day considered impossible. Fourier was mostly right, but proving exactly when took decades. Dirichlet gave the first convergence conditions in 1829, and the effort to understand Fourier series led to the integration theories of Riemann and Lebesgue, and to Cantor's set theory.

## Timeline

- 1748Euler publishes $e^{ix} = \cos x + i\sin x$ in the Introductio.

- 1750sEuler, d'Alembert and Daniel Bernoulli argue over the vibrating string and whether it can be written as a sum of sines.

- 1782–1785Laplace uses integrals of the form $\int f(x)e^{-sx}dx$ in his work on probability.

- 1807Fourier submits his memoir on heat conduction to the French Institute; Lagrange objects.

- 1822Fourier publishes the Théorie analytique de la chaleur.

- 1825Cauchy publishes his integral theorem, later developed into the residue theorem.

- 1829Dirichlet proves conditions for the convergence of Fourier series.

- 1880s–1890sHeaviside solves circuit and transmission-line problems with operational calculus, without proof.

- 1898–1899Michelson's harmonic analyser shows an overshoot that will not go away; Gibbs explains it in 1899 (Wilbraham had found it in 1848).

- 1916–1926Bromwich and Carson put Heaviside's method on a firm footing with the inversion integral and the Laplace transform.

- 1937Gustav Doetsch publishes his Laplace transform book; in 1942 Gardner and Barnes bring the method to American engineers.

- 1952Ragazzini and Zadeh name and develop the z-transform for sampled-data systems.

- 1965Cooley and Tukey publish the FFT algorithm (Gauss had used a similar idea around 1805 but never published it).

## An overshoot that would not go away

In 1898 Albert Michelson built a mechanical harmonic analyser that could sum 80 Fourier terms. When he synthesised a square wave he saw a spike at each edge that did not shrink as he added terms. He suspected the machine. Josiah Willard Gibbs explained in 1899 that the spike is a real mathematical feature and always about 9 per cent of the jump. It later emerged that Henry Wilbraham had described it in 1848, unnoticed.

## Laplace did not invent the Laplace transform we use

Integrals of the form $\int f(t)e^{-st}dt$ appear in eighteenth-century work by Euler and Laplace, especially Laplace's probability theory, but nobody used them to solve the differential equations of electrical systems. The person who actually solved circuit problems was Heaviside. In the 1880s and 1890s he replaced $d/dt$ with an operator $p$, treated it like an algebraic variable, and obtained correct responses for transmission lines and circuits, with no proof behind them.

It took mathematicians about forty years to explain why Heaviside's method worked. Bromwich in 1916 and Carson at AT&T in 1917–1926 showed it was equivalent to the Laplace transform and an inversion integral in the complex plane. Doetsch's 1937 book completed the theory, and Gardner and Barnes's 1942 textbook moved American engineers from the operator method to the Laplace transform. Laplace's name became attached to the tool only in the twentieth century.

## The digital era: the z-transform and the FFT

When control systems began to use sampled data, Ragazzini and Zadeh at Columbia developed the z-transform in 1952. Computing spectra became routine after Cooley and Tukey published the FFT in 1965. Historians later found that Gauss had used a similar idea to compute asteroid orbits around 1805, but recorded it in Latin in papers not published in his lifetime. Today an FFT runs inside every phone, power-quality analyser and digital oscilloscope.

## Key people

### Joseph Fourier
1768–1830 · France
A tailor's son orphaned young, he nearly went to the guillotine in the Revolution, went to Egypt with Napoleon and became prefect of Isère. There he studied heat conduction and claimed that any function could be written as a series of sines and cosines. The claim was not quite right, but the effort to prove it created several new branches of mathematics.

### Pierre-Simon Laplace
1749–1827 · France
Called the Newton of France for the Mécanique céleste, which explained the stability of the solar system, and for probability work that used the integral we now call the Laplace transform. He never used it to solve circuit equations as we do; his name was attached to the method much later.

### Peter Gustav Lejeune Dirichlet
1805–1859 · Germany
The first to prove rigorously when a Fourier series converges and to what value at a jump. Along the way he gave the modern definition of a function: a rule pairing each x with a y, with no formula required.

### Oliver Heaviside
1850–1925 · England
Replaced differentiation with an operator $p$ and handled circuit differential equations as algebra, getting correct answers without proof. Cambridge mathematicians would not accept it. He replied that he would not refuse his dinner because he did not fully understand digestion. The unit step $u(t)$ is still called the Heaviside function.

### Gustav Doetsch
1892–1977 · Germany
The mathematician who turned the Laplace transform into a complete, teachable theory with his 1937 book and decades of further work. The transform tables and rules in today's engineering texts trace back to him.

### John Tukey
1915–2000 · United States
A statistician at Princeton and Bell Labs who, with James Cooley of IBM, published the FFT in 1965, cutting the cost of a discrete Fourier transform from $N^2$ to about $N\log N$. He also coined the word bit and used software in its modern sense.

## Where this continues on the site

- Fourier series and harmonic analysis (in Thai)

- Convergence, the Gibbs phenomenon and Parseval (in Thai)

- The DFT and FFT (in Thai)

- The Laplace transform (in Thai)

- The inverse Laplace transform and residues (in Thai)

- What is the Laplace transform? A plain explanation

- Fourier series calculator

## Frequently asked questions

Who invented the Laplace transform?
Integrals of this form appear in eighteenth-century work by Euler and Laplace, but the use for solving circuit differential equations comes from Heaviside's operational calculus (1880s–1890s), which Bromwich, Carson and Doetsch put on a rigorous footing between 1916 and 1937.

Why did Fourier invent Fourier series?
To solve the equation of heat conduction in solids. He first presented the idea in 1807 and published the full theory in the Théorie analytique de la chaleur in 1822.

Who is the Gibbs phenomenon named after?
Josiah Willard Gibbs, who explained it in 1899 after Michelson saw it on his harmonic analyser. Henry Wilbraham had described it in 1848, so it is sometimes called the Gibbs–Wilbraham phenomenon.

When was the FFT invented?
James Cooley and John Tukey published it in 1965, but Carl Friedrich Gauss had used a similar idea around 1805 in work not published in his lifetime.

## Sources and further reading

- Grattan-Guinness, I. Joseph Fourier, 1768–1830. MIT Press, 1972.

- Deakin, M. A. B. “The Development of the Laplace Transform, 1737–1937.” Archive for History of Exact Sciences 25 (1981): 343–390 and 26 (1982): 351–381.

- Lützen, J. “Heaviside's Operational Calculus and the Attempts to Rigorise It.” Archive for History of Exact Sciences 21 (1979): 161–200.

- Heideman, M. T., Johnson, D. H., and Burrus, C. S. “Gauss and the History of the Fast Fourier Transform.” IEEE ASSP Magazine 1, no. 4 (1984): 14–21.

- Hewitt, E., and Hewitt, R. E. “The Gibbs–Wilbraham Phenomenon: An Episode in Fourier Analysis.” Archive for History of Exact Sciences 21 (1979): 129–160.

- Gardner, M. F., and Barnes, J. L. Transients in Linear Systems. Wiley, 1942.

← PreviousCalculusNext →Linear algebra & vectors

## Frequently asked questions

**Who invented the Laplace transform?**
Integrals of this form appear in eighteenth-century work by Euler and Laplace, but the use for solving circuit differential equations comes from Heaviside's operational calculus (1880s–1890s), which Bromwich, Carson and Doetsch put on a rigorous footing between 1916 and 1937.

**Why did Fourier invent Fourier series?**
To solve the equation of heat conduction in solids. He first presented the idea in 1807 and published the full theory in the Théorie analytique de la chaleur in 1822.

**Who is the Gibbs phenomenon named after?**
Josiah Willard Gibbs, who explained it in 1899 after Michelson saw it on his harmonic analyser. Henry Wilbraham had described it in 1848, so it is sometimes called the Gibbs–Wilbraham phenomenon.

**When was the FFT invented?**
James Cooley and John Tukey published it in 1965, but Carl Friedrich Gauss had used a similar idea around 1805 in work not published in his lifetime.
