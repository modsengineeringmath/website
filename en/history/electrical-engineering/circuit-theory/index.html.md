---
title: "History of circuit theory: from Ohm's law to computer simulation"
url: https://modsengineeringmath.com/en/history/electrical-engineering/circuit-theory/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> Where Ohm's law, Kirchhoff's laws, the Thévenin and Norton theorems, Steinmetz's phasors, symmetrical components, network synthesis and SPICE came from, with a timeline and short biographies.

Markdown copy of https://modsengineeringmath.com/en/history/electrical-engineering/circuit-theory/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of circuit theory: from Ohm's law to computer simulation

THภาษาไทยENEnglish
// History · History of Electrical Engineering · 2/5


Circuit theory looks like a set of rules someone wrote down all at once. In fact it was assembled piece by piece over more than a century, partly by academics and partly by telegraph engineers with a practical problem in front of them.

Electrical Engineering1. Electromagnetism2. Circuit theory3. Power systems4. Electronics5. Communications & control

## The first three laws everyone learns

Every electrical student starts with Ohm's law and Kirchhoff's laws, then meets Thévenin and Norton. In the textbook these four names sit on neighbouring pages. Historically they are almost a hundred years apart, and the people involved barely knew of each other.

Circuit theory is one of the few subjects where theory ran only a little ahead of use. Ohm published before anyone did anything practical with electricity. But once telegraph lines began to stretch hundreds of kilometres in the 1840s, engineers needed calculation tools at once, and the laws were ready.

## Timeline

- 1827Georg Simon Ohm publishes Die galvanische Kette with the relation between voltage, current and resistance. It is badly received at first.

- 1843Charles Wheatstone popularises the bridge circuit, first described by Samuel Christie in 1833.

- 1845Gustav Kirchhoff, a 21-year-old student, publishes the current and voltage laws.

- 1853Hermann von Helmholtz states the equivalent-source principle later known as Thévenin's theorem.

- 1883Léon Charles Thévenin, a French telegraph engineer, publishes the theorem without knowing of Helmholtz's work.

- 1886Heaviside coins the word impedance and applies operational calculus to circuits.

- 1893Charles Steinmetz presents complex numbers for AC circuit analysis at the Chicago congress; Arthur Kennelly publishes a similar idea the same year.

- 1918Charles Fortescue publishes symmetrical components for unbalanced three-phase systems and faults.

- 1924–1931Ronald Foster, Wilhelm Cauer and Otto Brune lay the foundations of network synthesis: designing a circuit from the response you want.

- 1926Edward Norton at Bell Labs and Hans Ferdinand Mayer at Siemens arrive at the current-source equivalent independently in the same year.

- 1952Bernard Tellegen publishes Tellegen's theorem, valid for any network that obeys Kirchhoff's laws.

- 1970sSPICE from the University of California, Berkeley makes computer circuit simulation routine.

## Ohm was rejected, Kirchhoff was welcomed

Ohm used a thermocouple as his source because the batteries of the time sagged quickly, and measured the current through wires of different lengths. The current varied inversely with the length of wire plus a constant, which was the internal resistance of the source. He set it all out in an 1827 book using the same mathematics as Fourier's theory of heat conduction. German natural philosophers of the day disliked that style intensely. The book was dismissed as fancy, Ohm resigned his teaching post in Cologne and spent several lean years.

Kirchhoff had better luck. He wrote down the current and voltage laws in 1845 while studying at Königsberg, and they were noticed at once, since Ohm's law had by then been accepted. Two years later he showed how many equations a network needs, by counting the independent loops of its graph. Circuit simulators still use the same idea.

## Equivalent circuits: one idea, found more than once

The principle that any linear network, seen from a pair of terminals, behaves like one voltage source in series with one resistance was found at least twice. Helmholtz wrote it down in 1853 in a paper on animal electricity that engineers did not read. Thirty years later Thévenin of the French telegraph administration found it again for telegraph lines. Some European books still call it the Helmholtz–Thévenin theorem.

The current-source form was also found twice. In 1926 Norton at Bell Labs described it in an internal memorandum that was never published, and Mayer at Siemens published it in the same year. The lesson for engineers: good ideas tend to appear in several places once a problem is ripe, and whose name ends up in the textbook often depends on where the influential textbook was written.

## Alternating current and complex numbers

As AC systems spread in the 1880s, engineers faced a differential equation every time an inductor or capacitor appeared. In 1893 Steinmetz proposed representing sinusoidal voltages and currents by complex numbers, which turns the whole job into algebra. An inductor becomes $j\omega L$, a capacitor $1/(j\omega C)$, and Ohm's and Kirchhoff's laws apply unchanged.

The method spread quickly because Steinmetz worked at General Electric and wrote books practising engineers could actually read. Fortescue applied a similar idea to unbalanced three-phase systems in 1918, and Edith Clarke carried transmission-line analysis further. The inverter controller in an electric car still computes a Clarke transform thousands of times a second.

## Key people

### Georg Simon Ohm
1789–1854 · Germany
A mathematics teacher who experimented with wires of different lengths and with thermocouples, which gave a steadier voltage than the batteries of the day. Critics dismissed his work as fancy and he resigned his post; recognition came only with the Royal Society's Copley Medal in 1841.

### Gustav Kirchhoff
1824–1887 · Germany
Stated both laws while still a student, and two years later showed that the number of independent circuit equations depends on the network's graph, one of the first results in graph theory. Later, with Bunsen, he founded spectroscopy and discovered caesium and rubidium.

### Léon Charles Thévenin
1857–1926 · France
An engineer with the French Posts and Telegraphs who studied Kirchhoff's laws for long telegraph lines. The theorem that bears his name reduces any linear network to one source and one resistance.

### Charles Proteus Steinmetz
1865–1923 · Germany / United States
A mathematician who emigrated to America and worked for General Electric. He let ordinary engineers solve AC circuits with complex algebra instead of differential equations, and also found the empirical law for hysteresis loss in iron.

### Edith Clarke
1883–1959 · United States
The first woman employed professionally as an electrical engineer in the United States. She invented a graphical calculator for transmission lines and gave her name to the Clarke (αβ) transform used in every motor drive and inverter controller today. In 1947 she became the first woman professor of electrical engineering in the US.

### Charles LeGeyt Fortescue
1876–1936 · Canada / United States
A Westinghouse engineer who showed how to split an unbalanced three-phase system into positive, negative and zero sequences. The method is still at the heart of fault calculation and protection relay settings.

## Where this continues on the site

- DC circuit analysis: Ohm, Kirchhoff, Thévenin, Norton (in Thai)

- Matrices for mesh and nodal analysis (in Thai)

- The Laplace transform, heir to Heaviside's operational calculus (in Thai)

- Power systems and symmetrical components (in Thai)

- Phasors, power and power factor (in Thai)

## Frequently asked questions

When was Ohm's law discovered?
Georg Simon Ohm published it in Die galvanische Kette in 1827. Henry Cavendish had found a similar relation in the 1780s but never published it; Maxwell brought his notes to light in 1879.

Why is Thévenin's theorem sometimes called the Helmholtz–Thévenin theorem?
Because Helmholtz stated the same principle in 1853, thirty years before Thévenin, in a physiology paper engineers did not read. Thévenin rediscovered it independently in 1883.

Who first used complex numbers for AC circuits?
Charles Steinmetz, at the International Electrical Congress in Chicago in 1893. Arthur Kennelly published a closely related idea the same year.

## Sources and further reading

- Ohm, G. S. Die galvanische Kette, mathematisch bearbeitet. Berlin, 1827.

- Kirchhoff, G. “Ueber den Durchgang eines elektrischen Stromes durch eine Ebene.” Annalen der Physik 64 (1845).

- Johnson, D. H. “Origins of the Equivalent Circuit Concept: The Voltage-Source Equivalent.” Proceedings of the IEEE 91, no. 4 (2003): 636–640.

- Kline, R. R. Steinmetz: Engineer and Socialist. Johns Hopkins University Press, 1992.

- Fortescue, C. L. “Method of Symmetrical Co-ordinates Applied to the Solution of Polyphase Networks.” Transactions of the AIEE 37 (1918): 1027–1140.

- Belevitch, V. “Summary of the History of Circuit Theory.” Proceedings of the IRE 50, no. 5 (1962): 848–855.

← PreviousElectromagnetismNext →Power systems

## Frequently asked questions

**When was Ohm's law discovered?**
Georg Simon Ohm published it in Die galvanische Kette in 1827. Henry Cavendish had found a similar relation in the 1780s but never published it; Maxwell brought his notes to light in 1879.

**Why is Thévenin's theorem sometimes called the Helmholtz–Thévenin theorem?**
Because Helmholtz stated the same principle in 1853, thirty years before Thévenin, in a physiology paper engineers did not read. Thévenin rediscovered it independently in 1883.

**Who first used complex numbers for AC circuits?**
Charles Steinmetz, at the International Electrical Congress in Chicago in 1893. Arthur Kennelly published a closely related idea the same year.
