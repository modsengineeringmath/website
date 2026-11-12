---
title: "History of operations research: the mathematics of the best decision"
url: https://modsengineeringmath.com/en/history/industrial-engineering/operations-research/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The history of operations research: Erlang's queueing theory, the EOQ formula, wartime operational research teams, Kantorovich's and Dantzig's linear programming, the simplex method, Bellman's dynamic programming, CPM, PERT and Little's law.

Markdown copy of https://modsengineeringmath.com/en/history/industrial-engineering/operations-research/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of operations research: the mathematics of the best decision

THภาษาไทยENEnglish
// History · History of Industrial Engineering · 2/4


Operations research was born in war, when scientists were asked to get the most out of the radar, aircraft and convoys that already existed. After the war the same mathematics moved on to planning factories, airlines and supply chains.

Industrial Engineering1. Scientific management2. Operations research3. Quality control4. Lean production

## Before the war: telephones and stockrooms

One of the first problems to use mathematics for management decisions again came from a telephone company. Erlang in Copenhagen had to decide how many circuits an exchange needed. Calls arrive at random: too few circuits and callers wait or are blocked, too many and capital is wasted. In 1909 he showed that call arrivals follow a Poisson distribution and found the probability that a call is blocked. Queueing theory, which grew from this, is now used for everything from supermarket checkouts to computer networks.

In 1913 Ford Harris, an engineer at Westinghouse, asked how many parts to order at a time. Order few and you pay set-up costs often; order many and you pay to store them. The answer is the EOQ formula $Q^* = \sqrt{2DS/H}$, a minimisation by derivative that a first-year student can do.

## Timeline

- 1909Agner Erlang, a Danish telephone engineer, publishes the first work on queueing theory.

- 1913Ford Harris proposes the economic order quantity (EOQ) formula.

- 1937–1945Britain forms operational research teams to make the best use of radar and convoys; the term operational research is coined.

- 1939Leonid Kantorovich in the Soviet Union writes the first work on linear programming for production planning.

- 1947George Dantzig devises the simplex method for linear programming.

- 1950sRichard Bellman develops dynamic programming.

- 1956Ford and Fulkerson give the maximum-flow algorithm for networks.

- 1957–1958DuPont's critical path method (CPM) and the US Navy's PERT for the Polaris missile programme.

- 1961John Little proves Little's law, L = λW.

- 1975Kantorovich and Tjalling Koopmans receive the Nobel Prize in Economics for the theory of optimal resource allocation.

- 1984Narendra Karmarkar introduces an interior-point method that solves large linear programs fast.

## War creates a new discipline

By the late 1930s Britain had radar but did not know how to use it well within an air defence system. Scientists were sent to work with the forces to study real operations, hence operational research. During the war Blackett's team found several counter-intuitive results: large convoys were safer than small ones, because the perimeter escorts had to guard grew more slowly than the number of ships, and depth charges should be set shallower, because most submarines were caught just as they dived.

After the war Dantzig, at the US Air Force, was given a resource allocation problem with hundreds of variables. He wrote it as maximising a linear function under linear constraints and devised the simplex method in 1947, which walks along the edges of the feasible region from corner to corner until it reaches the answer. It later emerged that Kantorovich in the Soviet Union had written about the same problem in 1939; neither knew of the other.

## Projects, networks and multi-stage decisions

The 1950s were when operations research branched fastest. Bellman created dynamic programming for multi-stage decisions; Ford and Fulkerson gave the maximum-flow method for networks; and in 1957–1958 two project-planning methods appeared at once. DuPont used CPM to plan chemical plant shutdowns, and the US Navy used PERT on the Polaris missile programme with its thousands of contractors. Civil and electrical engineers managing construction projects use the same critical path today.

In 1961 John Little proved that the average number in a system equals the arrival rate times the average time in the system, $L = \lambda W$, which holds for almost any system, from production lines to computer jobs. Karmarkar's interior-point method of 1984 made problems with millions of variables solvable; airlines and logistics firms use it daily, and it is a close relative of the optimisation methods used to train AI models.

## Key people

### Agner Krarup Erlang
1878–1929 · Denmark
An engineer with the Copenhagen Telephone Company who had to work out how many circuits an exchange needed so that callers did not wait too long. He modelled randomly arriving calls with probability theory. His formulas still size call centres and networks, and the unit of traffic, the erlang, is named after him.

### Patrick Blackett
1897–1974 · England
A physicist and later Nobel laureate who led a team of physicists, physiologists and mathematicians, known as Blackett's Circus, analysing combat data to get the most out of existing resources, such as the depth setting of depth charges and the best size for convoys.

### George Dantzig
1914–2005 · United States
As a doctoral student he arrived late to class, took two problems on the board for homework and solved them, not knowing they were unsolved problems in statistics. After the war, planning resource allocation for the US Air Force, he devised the simplex method in 1947, often listed among the most important algorithms of the twentieth century.

### Leonid Kantorovich
1912–1986 · Russia (Soviet Union)
A mathematician asked by a Leningrad plywood trust how to divide work among several machines for maximum output. He invented linear programming in 1939, years before Dantzig, but the work was neglected in the Soviet Union because its shadow prices seemed at odds with state economics.

### Richard Bellman
1920–1984 · United States
A RAND mathematician who invented dynamic programming, breaking multi-stage decisions into nested sub-problems. He chose the name because it sounded impressive enough that a mathematics-averse official could not object. The Bellman equation is still central to optimal control and to reinforcement learning in AI.

## Where this continues on the site

- Linear algebra, the basis of linear programming (in Thai)

- Multivariable optimisation and Lagrange multipliers (in Thai)

- Statistical tables and probability distributions

- AI and reinforcement learning in control (in Thai)

## Frequently asked questions

When did operations research begin?
As a discipline, in Britain from the late 1930s through the Second World War, when scientific teams were asked to analyse radar use and military operations. Pioneering work such as Erlang's queueing theory (1909) and the EOQ formula (1913) came earlier.

Who invented linear programming?
Leonid Kantorovich in the Soviet Union wrote it down in 1939, and George Dantzig in the United States developed it independently, with the simplex method, in 1947, which made linear programming widely usable.

What is the difference between CPM and PERT?
CPM (DuPont, 1957) uses a single duration per activity and focuses on trading time against cost. PERT (US Navy, 1958) uses three estimates, optimistic, most likely and pessimistic, to handle uncertainty. Both find the critical path.

## Sources and further reading

- Gass, S. I., and Assad, A. A. An Annotated Timeline of Operations Research. Kluwer, 2005.

- Dantzig, G. B. “Linear Programming.” Operations Research 50, no. 1 (2002): 42–47.

- Kirby, M. W. Operational Research in War and Peace. Imperial College Press, 2003.

- Kantorovich, L. V. “Mathematical Methods of Organizing and Planning Production” (1939). Translated in Management Science 6, no. 4 (1960): 366–422.

- Bellman, R. Eye of the Hurricane: An Autobiography. World Scientific, 1984.

← PreviousScientific managementNext →Quality control

## Frequently asked questions

**When did operations research begin?**
As a discipline, in Britain from the late 1930s through the Second World War, when scientific teams were asked to analyse radar use and military operations. Pioneering work such as Erlang's queueing theory (1909) and the EOQ formula (1913) came earlier.

**Who invented linear programming?**
Leonid Kantorovich in the Soviet Union wrote it down in 1939, and George Dantzig in the United States developed it independently, with the simplex method, in 1947, which made linear programming widely usable.

**What is the difference between CPM and PERT?**
CPM (DuPont, 1957) uses a single duration per activity and focuses on trading time against cost. PERT (US Navy, 1958) uses three estimates, optimistic, most likely and pessimistic, to handle uncertainty. Both find the critical path.
