---
title: "Celtic Cross Tarot Reading (10 Cards)"
url: https://modsengineeringmath.com/en/tools/tarot/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-10-26
---

> A 10-card Celtic Cross tarot reading: type your question, shuffle with physical models (riffle, overhand, table wash, three-pile cut) and get a detailed reading with elements, zodiac, numbers and the Tree of Life. Free, in your browser.

Markdown copy of https://modsengineeringmath.com/en/tools/tarot/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Celtic Cross Tarot Reading (10 Cards)

THภาษาไทยENEnglish
// Tools · Tarot · Celtic Cross


Type your question, shuffle the deck yourself, cut it into three piles and lay out ten cards in the Celtic Cross. The reader interprets every position in the light of your question and analyses elements, zodiac signs, planets, numbers and the Tree of Life. Everything happens in your browser.

## Your online tarot reading

This page needs JavaScript to shuffle and read the cards.

How this differs from a random card draw

- Real shuffling, not random draws. Every card moves as a riffle, overhand or table wash moves it, and you cut the deck into three piles yourself.

- The deck remembers. Like a real deck left on the table, a short shuffle leaves traces of your last reading, and the meter shows it.

- Reads your question. The reader detects the topic and the type of question (yes/no, when, what should I do) and interprets accordingly.

- Many layers. Elements and their dignities, signs, decans, planets, the energy trend, numbers, the Tree of Life and keys from your birth date.

Already laid out real cards on the table? Photograph them and name the cards in Tarot reading from a photo.

## The 10 positions of the Celtic Cross

The Celtic Cross is the most popular tarot spread, published by A. E. Waite in 1910. The first six cards form a cross that shows the situation and its time line; the four cards on the right form a staff for you, your surroundings, your hopes and fears, and the outcome.

| Position | Meaning |

| 1 Heart of the matter | the situation and main energy now |

| 2 Challenge | the crossing card: the obstacle or force to handle |

| 3 Foundation | the root: the distant past or a subconscious drive |

| 4 Recent past | what is fading out |

| 5 Crown | your conscious aim and the best possible result |

| 6 Near future | what comes next |

| 7 Yourself | your attitude and approach |

| 8 Environment | other people and your surroundings |

| 9 Hopes and fears | what you hope for or fear, often the same thing |

| 10 Outcome | where things are heading on the present course |

The reader also reads the axes between positions: the time line 4 → 1 → 6, root and aim 3 ↔ 5, you and your surroundings 7 ↔ 8, hopes and outcome 9 → 10, and aim and outcome 5 → 10.

## The mathematics of shuffling: why shuffle for real

78 cards can be ordered in $78! \approx 1.13\times10^{115}$ ways; counting upright and reversed it is $78!\cdot 2^{78} \approx 3.42\times10^{138}$, about 460 bits. Shuffling is a random walk on this enormous set, one step at a time. So this page never draws a fresh random order in one go; the cards move according to a model of each shuffle.

### The riffle: the Gilbert–Shannon–Reeds model

The shuffler splits the deck into two packets. The split is not exactly in the middle but binomial, $P(K=k)=\binom{n}{k}\big/2^{n}$. Cards then drop from the bottom of the left or right packet: with $a$ cards left on the left and $b$ on the right, the next card comes from the left with probability $\frac{a}{a+b}$. Diaconis found that this model fits real human shuffles closely.

Bayer and Diaconis (1992) proved that after $k$ riffles, a permutation with $r$ rising sequences has probability

$$P_k(\pi)=\frac{1}{2^{kn}}\binom{2^{k}+n-r}{n}$$

so the distance from perfect randomness (total variation distance) can be computed exactly. For 78 cards:

| Riffles | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

| TV distance | 1.000 | 0.893 | 0.571 | 0.307 | 0.153 | 0.078 | 0.039 | 0.020 |

The distance collapses around $\tfrac{3}{2}\log_2 n \approx 9.4$ riffles, so a 78-card tarot deck needs more shuffling than a 52-card deck (about 7). With reversals on, the shuffler turns the bottom packet 180° half of the time before riffling, so reversed cards come from a real action rather than a separate coin toss.

### The overhand shuffle and the table wash

The overhand shuffle pulls packets off the top with the thumb into the other hand; each packet lands on the last, so the packet order reverses while the order inside a packet is kept. Here a break happens between two cards with probability 0.16 (packets of about 6 cards). Pemantle (1989) and Jonasson (2006) showed that it takes on the order of $n^{2}\log n$ shuffles, compared with $\log n$ for the riffle, so the overhand mixes very slowly.

The table wash is modelled as diffusion of position and angle. After washing for $t$ seconds, card $i$ drifts to $i+\sigma(t)Z_i$ with $\sigma(t)=4t^{0.85}$ and turns to $\theta_i+0.9\sqrt{t}\,Z_i'$. When the cards are swept together they are ordered by their new places, and a card ends reversed when $\cos\theta_iThe meter compares the current order with the order before this round of shuffling, using three statistics, and reports the worst.

- Rising sequences count how many runs of formerly neighbouring cards are still in order. A well-shuffled deck averages $\frac{n+1}{2}=39.5$; after $k$ riffles there can be at most $2^{k}$.

- Neighbour pairs: a well-shuffled deck keeps only about $\frac{2(n-1)}{n}\approx 2$ pairs together.

- Spearman correlation $\rho=1-\frac{6\sum d_i^{2}}{n(n^{2}-1)}$ between old and new positions should be near 0.

Note that such statistics can look random before the deck truly is: after 7 riffles they look excellent, yet the TV distance is still 0.57. That is why the page also shows the Bayer–Diaconis theoretical bound when you riffle.

### The imprecision of a hand

A computer cannot reproduce every detail of your hands, so the models reproduce the structure of real shuffles and use randomness only where a human hand is imprecise: the split point, which card falls first, packet sizes and drift. The randomness comes from the browser's crypto.getRandomValues, mixed with the timing of your mouse moves, taps, keystrokes and how long you hold the wash button, and fed to an sfc32 generator for every shuffle.

## How the cards are interpreted: elements, zodiac, numbers and the Tree of Life

Each card carries the correspondences of the Hermetic Order of the Golden Dawn, the system behind the Rider–Waite–Smith deck.

| Suit | Element | Decans (cards 2–10) | World on the Tree of Life |

| Wands | Fire | 2–4 Aries · 5–7 Leo · 8–10 Sagittarius | Atziluth (will) |

| Cups | Water | 2–4 Cancer · 5–7 Scorpio · 8–10 Pisces | Briah (feeling) |

| Swords | Air | 2–4 Libra · 5–7 Aquarius · 8–10 Gemini | Yetzirah (thought) |

| Pentacles | Earth | 2–4 Capricorn · 5–7 Taurus · 8–10 Virgo | Assiah (matter) |

- Cards 2–10 each rule one decan (10° of the zodiac) with a planet in Chaldean order, e.g. 2 of Wands = Mars in Aries, 9 of Swords = Mars in Gemini, 7 of Pentacles = Saturn in Taurus. The number also places the card on a Sephirah (Ace = Kether … 10 = Malkuth).

- Court cards: King = Fire of the suit's element, Queen = Water, Knight = Air, Page = Earth. Kings, Queens and Knights span 20° of one sign to 20° of the next; Aces and Pages rule a quarter of the zodiac.

- Major Arcana carry the 22 Hebrew letters and the 22 paths (11–32) of the Tree of Life, with a sign, planet or element, e.g. The Emperor = ה Heh, Aries; Death = נ Nun, Scorpio.

### Elemental dignities

Cards of the same element strengthen each other strongly; Fire and Air, and Water and Earth, are friendly; Fire and Water, and Air and Earth, are contrary; the other pairs are neutral. The reader uses this to judge how much the challenge (position 2) weakens the heart of the matter, whether root and aim pull together, and whether the neighbouring cards strengthen or weaken the outcome.

### Trend, score and statistics

Every card has a valence $v$ from −3 to +3, upright and reversed separately. Positions 3, 4, 1, 6 and 10 sit on a time line $t=-2,\dots,2$, and the trend is the least-squares slope

$$b=\frac{\sum t_i\,(v_i-\bar v)}{\sum t_i^{2}}$$

The overall score $S=\dfrac{\sum w_p v_p}{3\sum w_p}$ lies between −1 and 1, weighting the outcome 1.6, the near future 1.2 and the present 1.0 above the other positions. For yes/no questions it is blended with the outcome card. The number of Major Arcana is compared with its expectation $10\cdot\tfrac{22}{78}\approx 2.8$ and the hypergeometric tail $P(X\ge k)=\sum_{x\ge k}\binom{22}{x}\binom{56}{10-x}\big/\binom{78}{10}$.

### Timing from decans and the Sun's position

When the outcome card rules a span of the zodiac, the reader finds the next dates on which the Sun stands in that span, using a solar position formula good to about 0.01° ($d$ is days since 1 January 2000, 12:00 UT):

$$\lambda_\odot = q + 1.915^\circ\sin g + 0.020^\circ\sin 2g,\quad q=280.459^\circ+0.98564736^\circ d,\quad g=357.529^\circ+0.98560028^\circ d$$

Cards ruled by a planet take the planet's speed as their pace, and the suit sets how fast events move: Wands and Swords fast, Cups moderate, Pentacles slow but sure.

### Key of Life: quintessence, the Tree of Life and your birth date

- Quintessence: add the numbers of the Major Arcana and of the cards 1–10, and reduce until the total is 22 or less; the Major Arcana card with that number is the core of the reading.

- Tree of Life: Minor Arcana land on the Sephirah of their number and Major Arcana on their path; the weights add up to the Pillar of Mercy, the Pillar of Severity or the Middle Pillar, and to the upper, middle or lower level.

- Birth date: your sun sign comes from the Sun's actual position (with a warning near a sign boundary); the Life Path number keeps the master numbers 11, 22 and 33; the birth cards follow Mary K. Greer (day + month + year reduced to 22 or less); the year card uses the current year in place of the birth year.

## Before you use it

This page makes every step of the reading transparent, from the shuffle to the rules of interpretation, so you can see where each result comes from. Still, there is no scientific evidence that tarot predicts the future. Detailed interpretation does not make a reading statistically more accurate; it gives you more angles to think with. Use the result for reflection, and never in place of advice on health, law or money.

If the mathematics behind it interests you — probability, least squares, angles — explore the English lessons or the articles.

## Frequently asked questions

Why does this page make me shuffle instead of drawing random cards?
Most tarot programs generate a whole new random order in one step. This page simulates real shuffling step by step: every card moves the way that shuffle moves it, the deck keeps its order from your last reading, and a short shuffle leaves traces of the previous order, just like a real deck on the table. Randomness enters only where a hand is imprecise, such as where the deck is split or which card falls first.

How many times should I shuffle?
With riffles alone, the Bayer–Diaconis theory says a 78-card deck needs about 9–10 riffles before its order is close to perfectly random. A table wash should total about 30 seconds or more. The overhand shuffle mixes very slowly. Watch the mixing meter on the page.

What do reversed cards mean?
A reversed card usually means its energy is blocked, delayed or internal rather than outward; for a difficult card it can mean the situation is easing. Here reversals arise from turning half the deck during a riffle and from the table wash, not from a separate coin toss, and you can switch them off.

How does the reader interpret the cards?
It classifies your question by topic (love, work, money, health, family) and type, reads each card in its Celtic Cross position, links related positions, and applies Golden Dawn elemental dignities, zodiac decans, planets, numbers, the quintessence and the Tree of Life. With a birth date it also computes your sun sign from the Sun's position, your Life Path number and your tarot birth cards.

Is anything I type stored or sent anywhere?
No. Everything runs in your browser; your question and birth date are never sent anywhere. Only the deck order and your reversal setting are kept on your device, so the deck continues from your last reading.

How accurate is a tarot reading?
There is no scientific evidence that tarot predicts the future. This reader applies traditional reading rules carefully and consistently, so use the result as a perspective for reflection, never as a substitute for a doctor, lawyer or financial adviser.

## Frequently asked questions

**Why does this page make me shuffle instead of drawing random cards?**
Most tarot programs generate a whole new random order in one step. This page simulates real shuffling step by step: every card moves the way that shuffle moves it, the deck keeps its order from your last reading, and a short shuffle leaves traces of the previous order, just like a real deck on the table. Randomness enters only where a hand is imprecise, such as where the deck is split or which card falls first.

**How many times should I shuffle?**
With riffles alone, the Bayer–Diaconis theory says a 78-card deck needs about 9–10 riffles before its order is close to perfectly random. A table wash should total about 30 seconds or more. The overhand shuffle mixes very slowly. Watch the mixing meter on the page.

**What do reversed cards mean?**
A reversed card usually means its energy is blocked, delayed or internal rather than outward; for a difficult card it can mean the situation is easing. Here reversals arise from turning half the deck during a riffle and from the table wash, not from a separate coin toss, and you can switch them off.

**How does the reader interpret the cards?**
It classifies your question by topic (love, work, money, health, family) and type, reads each card in its Celtic Cross position, links related positions, and applies Golden Dawn elemental dignities, zodiac decans, planets, numbers, the quintessence and the Tree of Life. With a birth date it also computes your sun sign from the Sun's position, your Life Path number and your tarot birth cards.

**Is anything I type stored or sent anywhere?**
No. Everything runs in your browser; your question and birth date are never sent anywhere. Only the deck order and your reversal setting are kept on your device, so the deck continues from your last reading.

**How accurate is a tarot reading?**
There is no scientific evidence that tarot predicts the future. This reader applies traditional reading rules carefully and consistently, so use the result as a perspective for reflection, never as a substitute for a doctor, lawyer or financial adviser.
