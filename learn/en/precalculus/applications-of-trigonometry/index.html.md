---
title: "Applications of Trigonometry: the Law of Sines, the Law of Cosines, Triangle Area, Angles of Elevation and Depression, Bearings and Trigonometric Equations"
url: https://modsengineeringmath.com/learn/en/precalculus/applications-of-trigonometry/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Applications of trigonometry for precalculus: solving right triangles, angles of elevation and depression, the law of sines and the ambiguous SSA case, the law of cosines, area ½ab sin C and Heron's formula, bearings, solving trigonometric equations on 0 to 2π, combining a sin x + b cos x into one sinusoid, and a triangle solver for every case that draws the triangle.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/applications-of-trigonometry/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Applications of Trigonometry: the Law of Sines, the Law of Cosines, Triangle Area, Angles of Elevation and Depression, Bearings and Trigonometric Equations

THภาษาไทยENEnglish

// Chapter 27.10 · Precalculus · Applications of Trigonometry


A surveyor measuring the width of a river without crossing it, an engineer finding the resultant of two cable tensions and a navigator fixing a position from bearings and distances all use the same tool: solving a triangle from partial information. This page starts with right triangles and angles of elevation and depression, extends to any triangle with the laws of sines and cosines, including the ambiguous case that exams love, and ends with trigonometric equations and with combining two sine waves into one. A triangle solver draws the result, even when there are two solutions.

In 30 seconds

- Law of sines $\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C} = 2R$, used when a side and its opposite angle are known

- Law of cosines $c^2 = a^2 + b^2 - 2ab\cos C$, used for SSS and SAS

- SSA can give 0, 1 or 2 triangles: compare a with $h = b\sin A$

- Area $\tfrac12 ab\sin C$ · Heron $\sqrt{s(s-a)(s-b)(s-c)}$

- $a\sin x + b\cos x = R\sin(x + \varphi)$, $R = \sqrt{a^2 + b^2}$

## Right triangles, elevation and depression

Every elevation and depression problem reduces to a right triangle once the picture is drawn correctly. The key is that angles are measured from the horizontal, and that the angle of depression from a high point and the angle of elevation from a low point are alternate angles between parallel lines, so they are equal. Then choose the function that links the side you know with the side you want; usually that is tan, because the horizontal distance is known and the height is wanted.

K1 Elevation & depression

$$h = d\tan\theta,\qquad d = \frac{h}{\tan\theta},\qquad \text{depression} = \text{elevation (alternate angles)}$$

Example K-1 · Angle of elevation

### Standing 50 m from a building, you see its top at an angle of elevation of 32° (eye level at the ground). How tall is the building?

- The side adjacent to 32° is 50 m and the opposite side is the height h ⇒ use tan

- $h = 50\tan 32^\circ = 50(0.62487)$

$h \approx 31.24$ m (with eyes 1.6 m above the ground, add that to get 32.84 m)

Example K-2 · Angle of depression

### From the top of a lighthouse 60 m above the sea, a boat is seen at an angle of depression of 12°. How far is the boat from the base of the lighthouse?

- The 12° depression equals the angle of elevation from the boat up to the top

- $d = \dfrac{60}{\tan 12^\circ} = \dfrac{60}{0.21256}$

$d \approx 282.28$ m

## The law of sines and the ambiguous case

Drop the altitude from vertex C to the base. That height can be written two ways, as $b\sin A$ and as $a\sin B$, and setting them equal gives the law of sines straight away. The law works whenever a side is known together with its opposite angle. The trouble comes in the SSA case, because finding an angle from $\sin B = k$ gives an acute angle B and an obtuse angle $180^\circ - B$, and both may be valid. The picture in the triangle solver below shows how a side a shorter than b can swing to touch the base in two places.

K2 Law of sines

$$\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} = 2R$$

R is the circumradius · the longest side is always opposite the largest angle

K3 Ambiguous case (SSA, A acute)

$$h = b\sin A:\quad a If A is obtuse or right: $a \le b$ gives no triangle · $a > b$ gives one

Example K-3 · AAS

### Triangle ABC has $A = 40^\circ,\ B = 60^\circ,\ a = 10$. Find b and c

- $C = 180^\circ - 40^\circ - 60^\circ = 80^\circ$

- $b = \dfrac{a\sin B}{\sin A} = \dfrac{10\sin60^\circ}{\sin40^\circ} = \dfrac{8.6603}{0.6428}$

- $c = \dfrac{10\sin80^\circ}{\sin40^\circ} = \dfrac{9.8481}{0.6428}$

$b \approx 13.47,\ c \approx 15.32$

Example K-4 · The ambiguous case SSA

### $a = 7,\ b = 10,\ A = 40^\circ$. How many triangles are there? Find c in every case

- $h = b\sin A = 10\sin40^\circ \approx 6.43$ and $h K3)

- $\sin B = \dfrac{10\sin40^\circ}{7} \approx 0.9183$ ⇒ $B_1 \approx 66.67^\circ$ or $B_2 \approx 113.33^\circ$

- $C_1 \approx 73.33^\circ$, $C_2 \approx 26.67^\circ$ · $c = \dfrac{a\sin C}{\sin A}$

Two triangles: $c_1 \approx 10.43$ and $c_2 \approx 4.89$

## The law of cosines, area and Heron's formula

The law of cosines is the Pythagorean theorem with a correction term for angles that are not right angles. If $C = 90^\circ$, the term $-2ab\cos C$ vanishes and you get $c^2 = a^2 + b^2$. The term is negative when C is acute (c gets shorter) and positive when C is obtuse (c gets longer). Finding an angle with the law of cosines is never ambiguous, because arccos returns values from 0° to 180°, exactly the range of a triangle's angles.

K4 Law of cosines

$$c^2 = a^2 + b^2 - 2ab\cos C,\qquad \cos C = \frac{a^2 + b^2 - c^2}{2ab}$$

K5 Area

$$\text{Area} = \tfrac12 ab\sin C = \sqrt{s(s - a)(s - b)(s - c)},\quad s = \tfrac{a + b + c}{2}$$

Example K-5 · SAS across a lake

### From a point P, the distance to A is 8 km and to B is 11 km, and angle APB is 52°. How far apart are A and B?

- Law of cosines: $AB^2 = 8^2 + 11^2 - 2(8)(11)\cos52^\circ$

- $= 64 + 121 - 176(0.61566) = 185 - 108.36 = 76.64$

$AB \approx 8.75$ km

Example K-6 · SSS and Heron

### A triangle has sides 7, 8 and 9. Find its area and its largest angle

- $s = \tfrac{7 + 8 + 9}{2} = 12$ · area $= \sqrt{12\cdot5\cdot4\cdot3} = \sqrt{720} = 12\sqrt5$

- The largest angle is opposite the side 9: $\cos C = \dfrac{49 + 64 - 81}{2\cdot7\cdot8} = \dfrac{32}{112} = \dfrac27$

Area $12\sqrt5 \approx 26.83$ · largest angle $\arccos\tfrac27 \approx 73.40^\circ$

## Directions and bearings

Navigation and surveying use two ways of writing a direction. The first, such as N30°E, means face north and then turn 30° toward the east. The second is a three-figure bearing measured clockwise from north, such as 060°. Almost every bearing problem ends the same way: draw a north line at each point, find the interior angles of the triangle, and apply the law of sines or cosines.

K6 Bearings

$$\text{bearing } \beta:\ (x, y) = (d\sin\beta,\ d\cos\beta)\ \ \text{(x east, y north)}$$

Example K-7 · Two legs of a voyage

### A ship sails 30 km on a bearing of 060°, then 40 km on a bearing of 150°. How far is it from the start, and on what bearing?

- The change of course is 150° − 60° = 90°, so the angle at the turning point is a right angle

- Distance $\sqrt{30^2 + 40^2} = 50$ km

- The angle between the first leg and the straight line to the end is $\arctan\tfrac{40}{30} \approx 53.13^\circ$, so the bearing is $60^\circ + 53.13^\circ$

50 km on a bearing of about 113.13°

## Trigonometric equations and combining waves

A trigonometric equation has infinitely many solutions because the functions are periodic, so problems usually give an interval such as $0 \le x

K7 General solutions

$$\sin x = \sin\alpha \iff x = \alpha + 2k\pi \ \text{or}\ \pi - \alpha + 2k\pi,\quad \cos x = \cos\alpha \iff x = \pm\alpha + 2k\pi,\quad \tan x = \tan\alpha \iff x = \alpha + k\pi$$

K8 Double angle

$$\sin2x = 2\sin x\cos x,\quad \cos2x = \cos^2x - \sin^2x = 1 - 2\sin^2x = 2\cos^2x - 1$$

K9 Harmonic addition

$$a\sin x + b\cos x = R\sin(x + \varphi),\quad R = \sqrt{a^2 + b^2},\ \tan\varphi = \tfrac{b}{a}$$

Example K-8 · A quadratic in sin

### Solve $2\sin^2x - \sin x - 1 = 0$ for $0 \le x

- Let $u = \sin x$: $2u^2 - u - 1 = (2u + 1)(u - 1) = 0$

- $\sin x = 1 \Rightarrow x = \tfrac{\pi}{2}$

- $\sin x = -\tfrac12$: reference angle $\tfrac{\pi}{6}$ in quadrants III and IV ⇒ $x = \tfrac{7\pi}{6},\ \tfrac{11\pi}{6}$

$x = \tfrac{\pi}{2},\ \tfrac{7\pi}{6},\ \tfrac{11\pi}{6}$

Example K-9 · Using a double angle

### Solve $\cos2x = \cos x$ for $0 \le x

- Substitute $\cos2x = 2\cos^2x - 1$: $2\cos^2x - \cos x - 1 = 0 \Rightarrow (2\cos x + 1)(\cos x - 1) = 0$

- $\cos x = 1 \Rightarrow x = 0$ · $\cos x = -\tfrac12 \Rightarrow x = \tfrac{2\pi}{3},\ \tfrac{4\pi}{3}$

$x = 0,\ \tfrac{2\pi}{3},\ \tfrac{4\pi}{3}$

Example K-10 · Combining waves

### Write $3\sin x + 4\cos x$ as $R\sin(x + \varphi)$ and find its maximum

- $R = \sqrt{9 + 16} = 5$ · $\tan\varphi = \tfrac43$ ⇒ $\varphi \approx 53.13^\circ$

$5\sin(x + 53.13^\circ)$, maximum 5 — the same arithmetic as adding two phasors in AC circuit analysis

## Triangle solver for every case

Choose the kind of data you know and enter the numbers. The solver lists the steps for the law it uses, draws the triangle to scale, and computes the area, perimeter and circumradius. In an SSA case with two solutions, the second triangle is drawn dashed, which shows exactly why it is called the ambiguous case. Try lowering a below the height h to see the case with no triangle.

JavaScript is needed for the triangle solver

Common trapsUsing the law of sines to find an angle that could be obtuse and giving only the acute answer · measuring a depression angle from the vertical instead of the horizontal · and dividing both sides of a trig equation by $\sin x$, which loses the solutions of $\sin x = 0$; factor instead of dividing.

## Practice (with answers)

1A 6 m ladder leans against a wall at 70° to the ground. How high does it reach?
$6\sin70^\circ$
≈ 5.64 m

2A triangle has $a = 5,\ b = 7,\ C = 60^\circ$. Find c and the area
$c^2 = 25 + 49 - 70\cdot\tfrac12 = 39$ · area $\tfrac12(5)(7)\tfrac{\sqrt3}{2}$
$c = \sqrt{39} \approx 6.24$ · area $\tfrac{35\sqrt3}{4} \approx 15.16$

3$a = 4,\ b = 10,\ A = 30^\circ$. How many triangles?
$h = 10\sin30^\circ = 5 > a = 4$
No triangle

4Solve $2\cos x + \sqrt3 = 0$ for $0 \le x
$\cos x = -\tfrac{\sqrt3}{2}$, reference angle $\tfrac\pi6$, quadrants II and III
$\tfrac{5\pi}{6},\ \tfrac{7\pi}{6}$

5Solve $\sin 2x = \sin x$ for $0 \le x
$2\sin x\cos x - \sin x = \sin x(2\cos x - 1) = 0$
$0,\ \pi,\ \tfrac\pi3,\ \tfrac{5\pi}{3}$

6Maximum value of $\sin x + \sqrt3\cos x$
$R = \sqrt{1 + 3}$
2

## Read next

- 27.11 Trigonometric table 0°–360° — sin, cos and tan for every degree, for angles that are not special

- Dot product and cross product — the law of cosines written in vector form

## Frequently asked questions

When do I use the law of sines and when the law of cosines?
If you know at least one side together with its opposite angle (AAS, ASA, SSA), use the law of sines. If you know three sides (SSS) or two sides and the angle between them (SAS), there is no opposite pair, so start with the law of cosines and then use either law.

What is the ambiguous case SSA?
When you know two sides and an angle that is not between them, there may be 0, 1 or 2 triangles, because sin B = k has two solutions, B and 180° − B. Compute the height h = b sin A and compare: a
What are angles of elevation and depression measured from?
Always from the horizontal. The angle of elevation is the angle looking up from the horizontal and the angle of depression is the angle looking down from it. Because two horizontal lines are parallel, the angle of depression from the top of a building to a point on the ground equals the angle of elevation from that point to the top.

How do I solve a trigonometric equation without missing solutions?
Reduce it to a single function such as sin x = k, find the reference angle, and use ASTC to find every quadrant where the function has the sign of k. Then list every solution in the interval the problem gives. If the equation contains 2x or 3x, extend the interval to two or three turns before dividing back.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**When do I use the law of sines and when the law of cosines?**
If you know at least one side together with its opposite angle (AAS, ASA, SSA), use the law of sines. If you know three sides (SSS) or two sides and the angle between them (SAS), there is no opposite pair, so start with the law of cosines and then use either law.

**What is the ambiguous case SSA?**
When you know two sides and an angle that is not between them, there may be 0, 1 or 2 triangles, because sin B = k has two solutions, B and 180° − B. Compute the height h = b sin A and compare: a < h gives none, a = h gives one right triangle, h < a < b gives two, and a ≥ b gives one (when A is acute).

**What are angles of elevation and depression measured from?**
Always from the horizontal. The angle of elevation is the angle looking up from the horizontal and the angle of depression is the angle looking down from it. Because two horizontal lines are parallel, the angle of depression from the top of a building to a point on the ground equals the angle of elevation from that point to the top.

**How do I solve a trigonometric equation without missing solutions?**
Reduce it to a single function such as sin x = k, find the reference angle, and use ASTC to find every quadrant where the function has the sign of k. Then list every solution in the interval the problem gives. If the equation contains 2x or 3x, extend the interval to two or three turns before dividing back.
