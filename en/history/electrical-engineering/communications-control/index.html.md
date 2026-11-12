---
title: "History of communications, signals and control: from the telegraph to the Kalman filter"
url: https://modsengineeringmath.com/en/history/electrical-engineering/communications-control/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The history of the telegraph, telephone, radio and Shannon's information theory, and of control from Watt's governor and Maxwell's On Governors to Routh–Hurwitz, Nyquist, Bode, PID, Ziegler–Nichols, the root locus and Kalman.

Markdown copy of https://modsengineeringmath.com/en/history/electrical-engineering/communications-control/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of communications, signals and control: from the telegraph to the Kalman filter

THภาษาไทยENEnglish
// History · History of Electrical Engineering · 5/5


Signals and control have the same parents: the problems of the telephone company. Nyquist, Bode, Black and Shannon all came out of Bell Labs. This page explains why.

Electrical Engineering1. Electromagnetism2. Circuit theory3. Power systems4. Electronics5. Communications & control

## Two subjects born of one problem

As telephone lines grew longer, signals weakened and distorted. The telephone companies needed two things. First, to know how fast data could be sent over a line of limited bandwidth. Second, amplifiers that neither distorted nor oscillated. The first question led to sampling theory and information theory; the second to negative feedback, the Nyquist criterion and the Bode plot.

That is why students of signals and of control meet the same toolkit, the Laplace transform, the Fourier transform and the frequency response, and sometimes the same names in both courses.

## Timeline

- 1788James Watt fits the flyball governor to steam engines, the first widely used feedback controller.

- 1844Samuel Morse sends a telegraph message from Washington to Baltimore (24 May).

- 1866A transatlantic telegraph cable works reliably after the 1858 failure; William Thomson (Lord Kelvin) supplies the theory.

- 1868Maxwell publishes On Governors, the first mathematical stability analysis of a control system.

- 1876Alexander Graham Bell is granted the telephone patent (7 March).

- 1877 / 1895Edward Routh (1877) and Adolf Hurwitz (1895) give stability tests based on polynomial coefficients.

- 1901Guglielmo Marconi receives a radio signal across the Atlantic.

- 1922Nicolas Minorsky analyses automatic ship steering and arrives at the PID control law.

- 1928Harry Nyquist publishes on telegraph signalling rates, a root of the sampling theorem.

- 1932Nyquist publishes his stability criterion based on the frequency response.

- 1942Ziegler and Nichols at Taylor Instrument publish PID tuning rules still used in plants.

- 1945Hendrik Bode publishes Network Analysis and Feedback Amplifier Design, the source of the Bode plot.

- 1948Claude Shannon publishes A Mathematical Theory of Communication; Walter Evans introduces the root locus.

- 1960Rudolf Kálmán introduces the Kalman filter and the state-space ideas of controllability and observability.

## Telegraph, telephone and radio

The electric telegraph was the first electrical business that really made money. Cooke and Wheatstone's system in Britain and Morse's in America came into use in the 1840s. The 1858 transatlantic cable worked for a few weeks and then failed, partly because engineers drove it at a voltage that broke down the insulation. The 1866 cable succeeded on William Thomson's theory. The problem of signals smearing out along long lines led to Heaviside's transmission-line equations, which electrical students still learn.

Bell was granted the telephone patent in 1876, and Marconi received a radio signal across the Atlantic in 1901. The early twentieth century was the golden age of radio: Edwin Armstrong invented the superheterodyne receiver (1918) and FM (1933), the basis of every receiver that followed.

## Control: from the governor to the root locus

Feedback is much older than electricity. Ktesibios's water clock in Alexandria used a float to regulate water level more than two thousand years ago. The example that forced engineers to think hard was Watt's flyball governor of 1788. As engines grew larger and faster, some governors made the speed hunt up and down without settling. Maxwell analysed the problem in 1868, and Routh and Hurwitz gave tests for stability that did not require finding the polynomial's roots.

Between the 1920s and 1940s knowledge arrived from several directions at once. Minorsky analysed PID from warship steering; Nyquist and Bode got frequency-domain tools from telephone amplifiers; Ziegler and Nichols drew tuning rules from chemical plants; and the Second World War pushed everyone together at the MIT Radiation Laboratory to build radar-directed anti-aircraft fire control. After the war Evans introduced the root locus in 1948 and Kálmán opened the state-space era in 1960, before digital control became routine in every microcontroller.

## Shannon and the bit

Shannon's 1948 paper answered the question communication engineers had always asked: how much information can a channel of bandwidth $B$ and signal-to-noise ratio $S/N$ carry? The answer is $C = B\log_2(1+S/N)$ bits per second, with almost no errors if the coding is good enough. Every technology from early modems to 5G has been an effort to get closer to that limit.

## Key people

### Harry Nyquist
1889–1976 · Sweden / United States
Emigrated from Sweden at 18 and worked at AT&T and Bell Labs. His name appears in two courses: the sampling rate in signals, and the stability criterion in control. With Johnson he also explained thermal noise in resistors.

### Hendrik Wade Bode
1905–1982 · United States
An applied mathematician at Bell Labs who made feedback amplifier design a repeatable engineering task with magnitude and phase plotted on log scales, and who defined gain and phase margin.

### Claude Shannon
1916–2001 · United States
His 1937 master's thesis showed that relay circuits are Boolean algebra, the root of digital logic. A decade later he created information theory, defining the bit and the capacity limit of a channel.

### Nicolas Minorsky
1885–1970 · Russia / United States
Noticed that a good helmsman watches not only how far the ship is off course but how long it has been off and how fast it is turning. Those three are P, I and D, and his 1922 paper was the first systematic analysis of PID.

### Rudolf E. Kálmán
1930–2016 · Hungary / United States
Moved control theory from transfer functions to state space. The Kalman filter was used in Apollo navigation and still runs in GPS receivers, drones and battery state estimators.

### Edward John Routh
1831–1907 · Canada / England
A Cambridge mathematics coach who trained more Senior Wranglers than anyone else. The Routh array control students use came from his Adams Prize essay of 1877, set on a topic that followed Maxwell's governor paper.

## Where this continues on the site

- Control systems: stability, root locus, Bode, Nyquist, PID (in Thai)

- The Routh–Hurwitz criterion (in Thai)

- The Nyquist stability criterion (in Thai)

- PID tuning guide, from Ziegler–Nichols onwards

- Signals and systems, sampling (in Thai)

- Control engineering online course, 17 units

## Frequently asked questions

Who invented the PID controller?
The first systematic analysis of PID came from Nicolas Minorsky in 1922, in a study of automatic ship steering. Pneumatic controllers with full PID action were on the industrial market in the 1930s, and Ziegler and Nichols published their tuning rules in 1942.

Why does Nyquist's name appear in both signals and control?
Because Harry Nyquist at AT&T and Bell Labs worked on both: telegraph signalling rates (1928), a root of the sampling theorem, and the stability of feedback amplifiers (1932), which became the Nyquist stability criterion.

When did modern control theory begin?
It is usually dated to Rudolf Kálmán's work around 1960 on state space, the Kalman filter, controllability and observability. The transfer-function tools (Nyquist, Bode, root locus) are called classical control.

## Sources and further reading

- Bennett, S. A History of Control Engineering 1800–1930 and 1930–1955. IET, 1979 and 1993.

- Mindell, D. A. Between Human and Machine: Feedback, Control, and Computing before Cybernetics. Johns Hopkins University Press, 2002.

- Maxwell, J. C. “On Governors.” Proceedings of the Royal Society of London 16 (1868): 270–283.

- Nyquist, H. “Regeneration Theory.” Bell System Technical Journal 11 (1932): 126–147.

- Shannon, C. E. “A Mathematical Theory of Communication.” Bell System Technical Journal 27 (1948): 379–423, 623–656.

- Gleick, J. The Information: A History, a Theory, a Flood. Pantheon, 2011.

← PreviousElectronicsNext →History

## Frequently asked questions

**Who invented the PID controller?**
The first systematic analysis of PID came from Nicolas Minorsky in 1922, in a study of automatic ship steering. Pneumatic controllers with full PID action were on the industrial market in the 1930s, and Ziegler and Nichols published their tuning rules in 1942.

**Why does Nyquist's name appear in both signals and control?**
Because Harry Nyquist at AT&T and Bell Labs worked on both: telegraph signalling rates (1928), a root of the sampling theorem, and the stability of feedback amplifiers (1932), which became the Nyquist stability criterion.

**When did modern control theory begin?**
It is usually dated to Rudolf Kálmán's work around 1960 on state space, the Kalman filter, controllability and observability. The transfer-function tools (Nyquist, Bode, root locus) are called classical control.
