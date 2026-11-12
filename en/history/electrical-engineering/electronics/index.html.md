---
title: "History of electronics and power electronics: from vacuum tubes to SiC and GaN"
url: https://modsengineeringmath.com/en/history/electrical-engineering/electronics/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The history of electronics from the Edison effect, Fleming's valve and the triode to Black's feedback amplifier, the 1947 transistor, the integrated circuit, the MOSFET and the microprocessor, then the thyristor, IGBT and modern power electronics.

Markdown copy of https://modsengineeringmath.com/en/history/electrical-engineering/electronics/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of electronics and power electronics: from vacuum tubes to SiC and GaN

THภาษาไทยENEnglish
// History · History of Electrical Engineering · 4/5


Electronics is the control of one flow of electrons by another. That short definition covers everything from the first radio valves to the chip in your phone and the inverter in an electric train.

Electrical Engineering1. Electromagnetism2. Circuit theory3. Power systems4. Electronics5. Communications & control

## It started with a lamp that blackened too fast

Edison was trying to find out why the inside of his lamps darkened so quickly. He sealed a metal plate into a bulb and found that current flowed through the vacuum from the hot filament to the plate, in one direction only. He patented the effect in 1883 and moved on. Twenty years later Fleming, who had once advised Edison's London company, remembered it when he needed a radio detector. The result was the diode valve.

De Forest's 1906 triode added a grid in the middle, so that a small voltage on the grid controlled a large current. De Forest did not really understand how it worked. Engineers at AT&T had to refine it before it was a usable amplifier, and in 1915 those valves made the first coast-to-coast telephone call in America possible.

## Timeline

- 1874Ferdinand Braun finds that certain metal sulphide crystals conduct in one direction only, the first semiconductor rectifier.

- 1883Edison observes current flowing through a vacuum from a hot filament, the Edison effect.

- 1897J. J. Thomson shows that cathode rays are particles, later called electrons.

- 1904John Ambrose Fleming patents the vacuum diode valve.

- 1906Lee de Forest adds a grid to make the Audion triode, later developed into an amplifier.

- 1927Harold Black conceives the negative-feedback amplifier on the ferry to work; the patent is granted in 1937.

- 1947Bardeen and Brattain at Bell Labs make the point-contact transistor work in December; Shockley follows with the junction transistor.

- 1957General Electric introduces the thyristor (SCR), the first semiconductor power switch.

- 1958–1959Jack Kilby (Texas Instruments) builds the first integrated circuit; Robert Noyce (Fairchild) makes the planar IC that can be mass-produced; Atalla and Kahng at Bell Labs demonstrate the MOSFET.

- 1965Gordon Moore predicts the regular doubling of transistors per chip, later called Moore's law.

- 1971The Intel 4004, the first commercial microprocessor.

- 1973–1976William Newell defines power electronics (1973); Middlebrook and Ćuk introduce state-space averaging for converters (1976).

- 1980sThe IGBT, from the work of B. Jayant Baliga and others, reaches the market and becomes the workhorse switch of inverters and motor drives.

- 2000s–2010sSilicon carbide and gallium nitride switches make converters much smaller and faster.

## Negative feedback, an idea the patent office did not believe

Amplifiers strung along thousands of kilometres of telephone line had one big problem: distortion added up. In 1927 Black reasoned that if you built an amplifier with enormous gain and fed part of the output back to subtract at the input, the overall gain would fall, but it would depend only on the resistors in the feedback path and not on valves that drifted with age and temperature.

The patent office took nine years to grant it, treating the deliberate throwing away of gain as nonsense, on a par with perpetual motion. Students use the idea every time they set an op-amp's gain with a resistor ratio. The problem that came with it, that feedback amplifiers can oscillate, is exactly what led to Nyquist's and Bode's stability work.

## Transistor, integrated circuit and MOSFET

Bell Labs wanted a switch for telephone exchanges that was smaller, cooler and longer-lived than a valve. William Shockley's group worked for years before Bardeen and Brattain got the point-contact transistor working in December 1947. Shockley, annoyed to be left off the patent, worked out the easier-to-manufacture junction transistor within weeks. The three shared the Nobel Prize in 1956.

The next problem was wiring together enormous numbers of parts. Kilby solved it in 1958 by making everything on one piece of semiconductor; Noyce at Fairchild used Jean Hoerni's planar process to make ICs in volume in 1959. The same year Atalla and Kahng demonstrated the MOSFET, which used less power and scaled down better. Moore's law then ran for half a century.

## Power electronics: semiconductors at kilowatt level

Before semiconductors, high-power rectification used Cooper Hewitt's mercury-arc rectifier (1902) and thyratron valves, which were bulky and fragile. The thyristor that GE put on sale in 1957 changed that. Power MOSFETs followed in the late 1970s, then the IGBT in the 1980s, which became the main switch in inverters, VFDs and electric trains.

In 1973 William Newell drew a triangle showing power electronics as the meeting point of power, electronics and control. Three years later Middlebrook and Ćuk introduced state-space averaging, which lets us write the transfer function of a buck converter and design its compensator the way this site's lessons teach it. Over the last twenty years SiC and GaN switches have pushed switching frequencies into the hundreds of kilohertz, which is why a laptop charger now fits in a matchbox.

## Key people

### John Ambrose Fleming
1849–1945 · England
Adviser to the Marconi company, he needed a reliable radio detector and turned the Edison effect into a diode valve. The right- and left-hand rules every electrical student uses are also his.

### Harold Stephen Black
1898–1983 · United States
A Bell Labs engineer charged with reducing distortion in long-distance telephone repeaters. The idea of trading gain for precision through negative feedback was sketched on a newspaper on the ferry, and it underlies every op-amp circuit.

### John Bardeen
1908–1991 · United States
The theorist of the transistor team. He shared the 1956 Nobel Prize in Physics with Brattain and Shockley and won again in 1972 for the theory of superconductivity, the only person with two physics Nobels.

### Jack Kilby
1923–2005 · United States
A new Texas Instruments engineer with no holiday entitlement in summer 1958, he stayed behind and built an oscillator on a single piece of germanium. He received the Nobel Prize in Physics in 2000.

### Mohamed M. Atalla
1924–2009 · Egypt / United States
Found that thermally grown silicon dioxide passivates the silicon surface, which let him and Dawon Kahng build the MOSFET in 1959. The MOSFET is the most manufactured device in human history.

### R. David Middlebrook
1929–2010 · England / United States
A Caltech professor who built one of the most influential power electronics groups. The state-space averaging he developed with Slobodan Ćuk let engineers design the control loops of switching converters with linear control theory.

## Where this continues on the site

- Power electronics: buck, boost, Ćuk and control (in Thai)

- The averaged buck model, Middlebrook and Ćuk's legacy (in Thai)

- The Ćuk converter (in Thai)

- Function generators, oscilloscopes and op-amp circuits (in Thai)

- Rectifiers and harmonics (in Thai)

## Frequently asked questions

Who invented the transistor?
John Bardeen and Walter Brattain at Bell Labs made the point-contact transistor work in December 1947, and William Shockley followed with the junction transistor. The three shared the 1956 Nobel Prize in Physics.

When was the first integrated circuit made?
Jack Kilby at Texas Instruments demonstrated the first integrated circuit in September 1958, and Robert Noyce at Fairchild made the planar IC suitable for mass production in 1959.

Where does the term power electronics come from?
William E. Newell defined it in 1973 as the field that combines power, electronics and control, drawing the triangle that is still quoted today.

## Sources and further reading

- Riordan, M., and Hoddeson, L. Crystal Fire: The Invention of the Transistor and the Birth of the Information Age. Norton, 1997.

- Black, H. S. “Inventing the Negative Feedback Amplifier.” IEEE Spectrum 14, no. 12 (1977): 55–60.

- Kilby, J. S. “Invention of the Integrated Circuit.” IEEE Transactions on Electron Devices 23, no. 7 (1976): 648–654.

- Newell, W. E. “Power Electronics: Emerging from Limbo.” IEEE Power Electronics Specialists Conference, 1973.

- Middlebrook, R. D., and Ćuk, S. “A General Unified Approach to Modelling Switching-Converter Power Stages.” IEEE PESC, 1976.

- Computer History Museum. The Silicon Engine: A Timeline of Semiconductors in Computers (computerhistory.org).

← PreviousPower systemsNext →Communications & control

## Frequently asked questions

**Who invented the transistor?**
John Bardeen and Walter Brattain at Bell Labs made the point-contact transistor work in December 1947, and William Shockley followed with the junction transistor. The three shared the 1956 Nobel Prize in Physics.

**When was the first integrated circuit made?**
Jack Kilby at Texas Instruments demonstrated the first integrated circuit in September 1958, and Robert Noyce at Fairchild made the planar IC suitable for mass production in 1959.

**Where does the term power electronics come from?**
William E. Newell defined it in 1973 as the field that combines power, electronics and control, drawing the triangle that is still quoted today.
