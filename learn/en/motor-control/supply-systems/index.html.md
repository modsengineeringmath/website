---
title: "The 230/400 V 50 Hz Low-Voltage Supply in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore for Motor Control"
url: https://modsengineeringmath.com/learn/en/motor-control/supply-systems/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-14
---

> The three-phase four-wire 230/400 V 50 Hz supply under IEC 60038 and the voltages actually found in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore: phase versus line voltage, ±10 % tolerance, TN-C-S and TT earthing, phase sequence, voltage unbalance and motor derating, and running 60 Hz motors on a 50 Hz supply.

Markdown copy of https://modsengineeringmath.com/learn/en/motor-control/supply-systems/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# The 230/400 V 50 Hz Low-Voltage Supply in Thailand, Laos, Cambodia, Vietnam, Myanmar, Malaysia and Singapore for Motor Control

THภาษาไทยENEnglish

// Chapter 21.2 · AC Motor Control · 230/400 V 50 Hz Supply


Motors and control gear are designed for one particular voltage and frequency. If you understand the supply on site — its real voltage, its earthing system and its power quality — you can choose the terminal connection and set the devices correctly from the start. This page collects what you need to know for seven countries that share the same kind of supply.

In 30 seconds

- Three-phase four-wire: phase voltage 230 V (L–N), line voltage 400 V (L–L) = √3 × 230

- Every country here uses 50 Hz · real voltages lie between 220/380 and 240/415 V

- Three-phase motors connect to L1 L2 L3 + PE, no N · 230 V control circuits use L–N

- 1 % voltage unbalance causes 6–10 % current unbalance → the motor must be derated

## The three-phase four-wire system Basic

The utility's distribution transformer (e.g. 22 kV/400 V or 33 kV/400 V) has its low-voltage side connected in Y with the neutral point earthed, giving conductors L1, L2, L3 and N. Between a phase conductor and neutral is the phase voltage, 230 V; between two phase conductors is the line voltage, 400 V.

Figure 1 · Three phase voltages 120° apart (325 V peak) and the line voltage v₁₂ = v₁ − v₂ (565 V peak), leading by 30°

S1 Line and phase voltage

$$V_L = \sqrt{3}\,V_{ph} \qquad 230 \times \sqrt3 = 398 \approx 400\ \text{V} \qquad V_{peak} = \sqrt2\, V_{rms}$$

S2 Three-phase power

$$P = \sqrt{3}\,V_L I_L \cos\varphi \qquad S = \sqrt{3}\,V_L I_L$$

## Voltage and frequency by country Basic

IEC 60038 sets the nominal value 230/400 V for 50 Hz systems, and countries in the region have been moving to it from 220/380 V or 240/415 V. Equipment rated “380–415 V 50 Hz” (the normal rating for IEC contactors, drives and motors) can be used in all of them.

| Country | Nominal value | Still found on site | Frequency | Things to know |

| Thailand | 230/400 V | 220/380 V in older systems | 50 Hz | Metropolitan Electricity Authority (MEA) and Provincial Electricity Authority (PEA) · installations to the Engineering Institute of Thailand (EIT) wiring code |

| Laos | 230/400 V | 220/380 V | 50 Hz | Grid interconnected with Thailand at many points; Thai equipment can be used |

| Cambodia | 230/400 V | 220/380 V | 50 Hz | Voltage varies a lot by area; measure before installing |

| Vietnam | 220/380 V | — | 50 Hz | A 400 V motor gets 5 % below its nameplate: starting torque ~10 % lower, full-load current slightly higher |

| Myanmar | 230/400 V | Large voltage swings | 50 Hz | Under/overvoltage and phase-loss protection relays recommended |

| Malaysia | 230/400 V | 240/415 V (before 2008) | 50 Hz | Older 415 V-rated motors and transformers are still compatible |

| Singapore | 230/400 V | — | 50 Hz | Installation to SS 638 (based on IEC 60364) |

This table is an overview for learning. The guaranteed voltage and its tolerance (e.g. +10 %/−6 % or ±10 %) are set by each country's utility and may be revised. Always check the local supplier's documents.

Example S-1

### A 400 V motor on 380 V and 415 V supplies

- 380 V is 95 % of the nameplate → torque at every point on the curve falls to $0.95^2 = 0.90$ (M8).

- At constant load the slip rises by about $1/0.90$ and full-load current increases by roughly 3–5 % → keep the overload set to the nameplate current; do not raise it.

- 415 V is 104 %: flux is higher and no-load current increases, but it is still within zone A of IEC 60034-1 (±5 %), so the motor runs normally.

## Earthing systems: TN-C-S and TT Intermediate

The earthing system tells you by which path the motor's metal frame is “earthed”, and that decides whether a fault current to the frame is large enough to trip the breaker. In Thailand the utility earths the neutral at the transformer and the customer joins N and PE at a single point in the main switchboard (TN-C-S). Other countries use both TN and TT, depending on the supplier and the type of installation.

Figure 2 · TN-C-S: a single PEN conductor runs from the transformer to the main switchboard; after the switchboard N and PE are separated and must never be joined again. The motor frame is always connected to PE.

| System | Path of an earth-fault current | Disconnecting device | Watch out for |

| TN-C-S / TN-S | Through PE back to the transformer; low impedance, high current | Breaker/fuse/MPCB disconnects quickly | Cable length must not be so long that the fault current is too small · never re-join N and PE after the split point |

| TT | Through the customer's earth electrode and the soil; low current | RCD (residual-current device) | A breaker alone often cannot disconnect in time · drives need a suitable RCD type |

## Phase sequence and direction of rotation Basic

The phase sequence L1→L2→L3 (some sites use R-S-T or A-B-C) sets the direction of the rotating field. With L1-L2-L3 connected to U1-V1-W1 in that order, an IEC motor turns clockwise viewed from the shaft end (IEC 60034-8). Before coupling to a pump or compressor that must not run backwards, check the phase sequence with a phase-rotation meter or bump the motor briefly uncoupled.

S3 Reversing rotation

$$(L1, L2, L3) \to (L3, L2, L1) \;\Rightarrow\; n_s \to -n_s$$

## Voltage unbalance and motor derating Advanced

When the three phase voltages are unequal, a negative-sequence voltage appears, which produces a field rotating “backwards”. The motor's negative-sequence impedance is very low (close to its starting impedance), so even a small voltage unbalance causes a large current unbalance and rotor heating.

S4 Voltage unbalance (NEMA working definition)

$$\%VU = \frac{\max |V_{L} - \bar V_L|}{\bar V_L} \times 100 \qquad \bar V_L = \frac{V_{12} + V_{23} + V_{31}}{3}$$

S5 Current unbalance estimate

$$\%I_{unb} \approx \frac{I_{st}}{I_n}\,\%VU \approx (6\text{–}10)\,\%VU$$

| %VU | 1 % | 2 % | 3 % | 4 % | 5 % |

| Derating factor (approx., per NEMA MG 1) | 0.98 | 0.95 | 0.88 | 0.82 | 0.75 |

Example S-2

### Measured 402 V · 396 V · 389 V

- Average $(402 + 396 + 389)/3 = 395.7$ V · largest deviation $|389 - 395.7| = 6.7$ V

- S4: $\%VU = 6.7/395.7 = 1.7\,\%$ → S5: current unbalance of about 10–17 %

- Derating factor ≈ 0.96 · find the cause first — poorly distributed single-phase loads, loose connections or a transformer problem — before upsizing the motor.

## 60 Hz motors on a 50 Hz supply Intermediate

Machines imported from North America, and some from Japan or Korea, may have 60 Hz motors. Core flux varies as $V/f$, so that ratio must be kept close to its original value.

S6 60 Hz motor on 50 Hz

$$\Phi \propto \frac{V}{f} \qquad V_{50} = V_{60}\cdot\frac{50}{60} \qquad n_{50} = \frac{5}{6} n_{60} \qquad P_{50} \approx \frac{5}{6} P_{60}$$

| 60 Hz nameplate | Suitable voltage at 50 Hz | Usable on a 400 V system? |

| 460 V 60 Hz | 383 V | Yes (380–400 V), speed −17 %, power −17 % |

| 380 V 60 Hz (some Japanese/Korean models) | 317 V | Not advisable: 400 V is 26 % too high, flux saturates, overheating |

| 230 V 60 Hz | 192 V | No — needs a transformer or a VFD |

The most flexible solution is a VFD: you can set the base frequency and base voltage directly to the 60 Hz nameplate (see VFD principles).

## Power-quality problems that affect motors

- Phase loss (single phasing): one fuse blows or a contact burns. A running motor keeps running with ~1.7 times the current in the two remaining phases and cannot restart → use an overload with phase-loss detection or a phase-protection relay.

- Voltage sags: AC contactors may drop out when the coil voltage falls below ~60 %, stopping a whole line — think about safe automatic restart.

- Harmonics: from drives and electronic loads; they add heating in direct-on-line motors and put PF-correction capacitors at risk of resonance (see True PF and harmonics (Thai)).

## Frequently asked questions

Is there a difference between 220 V and 230 V mains?
It is the same system with its nominal value changed under IEC 60038 from 220/380 V to 230/400 V. Equipment designed to IEC works on both because they fall within the ±10 % tolerance. The real voltage on site is usually between 215 and 240 V.

Can a 60 Hz motor from the USA run on 50 Hz?
Yes, if the voltage is reduced in proportion to frequency (keeping V/f the same). A 460 V 60 Hz motor, for example, can run at 380–400 V 50 Hz, with speed and power reduced to 5/6. A 230 V 60 Hz motor would need 190 V at 50 Hz, which our systems do not provide; fed with 230 V 50 Hz its flux is 20 % too high and it overheats.

Does a three-phase motor need the N conductor?
No. A three-phase motor is connected to L1, L2, L3 and the PE earth only. The N conductor is used for 230 V control circuits or single-phase loads.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**Is there a difference between 220 V and 230 V mains?**
It is the same system with its nominal value changed under IEC 60038 from 220/380 V to 230/400 V. Equipment designed to IEC works on both because they fall within the ±10 % tolerance. The real voltage on site is usually between 215 and 240 V.

**Can a 60 Hz motor from the USA run on 50 Hz?**
Yes, if the voltage is reduced in proportion to frequency (keeping V/f the same). A 460 V 60 Hz motor, for example, can run at 380–400 V 50 Hz, with speed and power reduced to 5/6. A 230 V 60 Hz motor would need 190 V at 50 Hz, which our systems do not provide; fed with 230 V 50 Hz its flux is 20 % too high and it overheats.

**Does a three-phase motor need the N conductor?**
No. A three-phase motor is connected to L1, L2, L3 and the PE earth only. The N conductor is used for 230 V control circuits or single-phase loads.
