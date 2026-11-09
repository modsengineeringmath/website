---
title: "Statistics: Measures of Center and Spread, Quartiles, Box Plots, z-Scores, the Normal Distribution, Correlation and Linear Regression"
url: https://modsengineeringmath.com/learn/en/precalculus/statistics/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-09
---

> Statistics for high school and first-year university: frequency tables and histograms, mean, median and mode for raw and grouped data, range, population and sample variance and standard deviation, quartiles, percentiles, box plots and outliers, z-scores, the normal distribution and the 68–95–99.7 rule, correlation and the least-squares regression line, with a statistics calculator that draws the graphs.

Markdown copy of https://modsengineeringmath.com/learn/en/precalculus/statistics/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# Statistics: Measures of Center and Spread, Quartiles, Box Plots, z-Scores, the Normal Distribution, Correlation and Linear Regression

THภาษาไทยENEnglish

// Chapter 27.15 · Precalculus · Statistics


Descriptive statistics answers three questions about a data set: where most of the values lie (center), how widely they are spread (spread), and what shape they have (histogram, box plot). After that, the normal distribution tells you how unusual a value is, and linear regression lets you predict one variable from another. This page explains what each measure measures, how to compute it for raw and grouped data, and when to choose which. The statistics calculator below accepts data pasted straight from a spreadsheet.

In 30 seconds

- $\bar x = \tfrac{\sum x}{n}$ · median at position $\tfrac{n+1}{2}$ · mode is the most frequent value

- $\sigma = \sqrt{\tfrac{\sum(x - \mu)^2}{N}}$ · $s = \sqrt{\tfrac{\sum(x - \bar x)^2}{n - 1}}$

- $Q_r$ at position $\tfrac{r(n+1)}{4}$ · outliers lie outside $Q_1 - 1.5\,IQR$ to $Q_3 + 1.5\,IQR$

- $z = \tfrac{x - \mu}{\sigma}$ · normal: 68% within ±1σ, 95% within ±2σ, 99.7% within ±3σ

- $\hat y = a + bx$, $b = \tfrac{S_{xy}}{S_{xx}}$, $r = \tfrac{S_{xy}}{\sqrt{S_{xx}S_{yy}}}$

## Measures of center

The mean uses every value, so it is sensitive to extremes: if one of ten employees is an executive with an unusually large salary, the mean salary overstates what a typical employee earns, and the median, the middle value, gives a truer picture. The mode suits qualitative data, such as the best-selling shirt size. For data grouped into class intervals, the class midpoint stands in for every value in the class.

D1 Mean

$$\bar x = \frac{\sum x_i}{n},\qquad \bar x_w = \frac{\sum w_i x_i}{\sum w_i},\qquad \bar x \approx \frac{\sum f_i m_i}{\sum f_i}\ \ (\text{class midpoints } m_i)$$

D2 Median

$$\text{position } \frac{n + 1}{2},\qquad \text{grouped: } L + \left(\frac{N/2 - F}{f}\right)I$$

L lower boundary of the median class · F cumulative frequency before it · f its frequency · I class width

Example D-1 · Raw data

### For the data 12, 15, 11, 18, 15, 20, 14, find the mean, median, mode and standard deviation

- Sorted: 11, 12, 14, 15, 15, 18, 20 · $\bar x = \tfrac{105}{7} = 15$ · median at position 4 = 15 · mode 15

- $\sum(x - 15)^2 = 16 + 9 + 1 + 0 + 0 + 9 + 25 = 60$

- $\sigma = \sqrt{60/7} \approx 2.928$ · $s = \sqrt{60/6} = \sqrt{10} \approx 3.162$

15, 15, 15 · σ ≈ 2.928 · s ≈ 3.162

Example D-2 · Grouped data

### Scores of 40 students: 40–49 (3), 50–59 (7), 60–69 (12), 70–79 (10), 80–89 (6), 90–99 (2). Find the mean and the median

- Midpoints 44.5, 54.5, …, 94.5 · $\sum fm = 133.5 + 381.5 + 774 + 745 + 507 + 189 = 2730$ · $\bar x = 2730/40$

- $N/2 = 20$; cumulative frequencies 3, 10, 22 ⇒ median class 60–69 · $L = 59.5,\ F = 10,\ f = 12,\ I = 10$

- Median $= 59.5 + \tfrac{20 - 10}{12}(10) = 59.5 + 8.33$

$\bar x = 68.25$ · median ≈ 67.83

## Spread, quartiles and box plots

Two data sets with the same mean can be very different. Two machines may both make parts 50 mm long on average, but one is accurate to ±0.1 mm and the other only to ±2 mm. The standard deviation measures the typical distance from the center in the same units as the data. Quartiles split the sorted data into four equal parts, and a box plot shows five numbers (minimum, Q₁, median, Q₃, maximum) in one picture, so skewness and outliers are visible at a glance.

D3 Variance & SD

$$\sigma^2 = \frac{\sum(x - \mu)^2}{N} = \frac{\sum x^2}{N} - \mu^2,\qquad s^2 = \frac{\sum(x - \bar x)^2}{n - 1}$$

D4 Quartiles

$$Q_r:\ \frac{r(n + 1)}{4},\qquad P_r:\ \frac{r(n + 1)}{100},\qquad IQR = Q_3 - Q_1$$

D5 Outliers & box plot

$$x Q_3 + 1.5\,IQR$$

D6 CV & transforms

$$CV = \frac{s}{\bar x}\times100\%,\qquad y = ax + b \Rightarrow \bar y = a\bar x + b,\ s_y = |a|s_x$$

Example D-3 · Quartiles

### Using the data of Example D-1, find Q₁, Q₃ and the IQR, and check for outliers

- n = 7: Q₁ at position 8/4 = 2 → 12 · Q₃ at position 24/4 = 6 → 18

- IQR = 6 · fences $12 - 9 = 3$ and $18 + 9 = 27$

Q₁ = 12, Q₃ = 18, IQR = 6 · no outliers

Example D-4 · Changing units

### Temperatures have mean 30 °C and standard deviation 2 °C. What are they in Fahrenheit, $F = 1.8C + 32$?

- The mean follows the whole formula: $1.8(30) + 32 = 86$

- The SD is only multiplied, because adding 32 does not change the spread: $1.8 \times 2$

Mean 86 °F · SD 3.6 °F

## Statistics calculator: histogram, box plot and frequency table

Paste data separated by spaces, commas or new lines (a whole column copied from Excel or Google Sheets works). The calculator computes center, spread, quartiles by the r(n+1)/4 positions, outliers, and both σ and s, draws a histogram and a box plot on the same axis, and builds a frequency table. The green dot in the box is the mean; when it sits far from the median line, the data are skewed.

JavaScript is needed for the calculator

## z-scores and the normal distribution

Many natural measurements, such as heights, measurement errors or the test scores of a large group, follow a symmetric bell shape around the mean, called the normal distribution. Every normal distribution can be converted to the standard normal (mean 0, standard deviation 1) with a z-score, so a single z table answers every normal-probability question. The area under the curve between two values is the proportion of data in that interval.

D7 z-score

$$z = \frac{x - \mu}{\sigma},\qquad x = \mu + z\sigma$$

D8 Normal distribution

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x - \mu)^2}{2\sigma^2}},\quad P(|Z|
Example D-5 · Comparing with z

### A student scores 72 in math (mean 60, SD 8) and 80 in physics (mean 70, SD 10). In which subject did the student do better relative to the class?

- $z_{\text{math}} = \tfrac{72 - 60}{8} = 1.5$ · $z_{\text{physics}} = \tfrac{80 - 70}{10} = 1.0$

Math is better relative to the group, even though the raw score is lower

Example D-6 · Probabilities and percentiles

### Adult heights are normal with μ = 165 cm, σ = 6 cm. (a) What proportion are taller than 177 cm? (b) Between 159 and 171 cm? (c) Test scores have μ = 70, σ = 8. What score puts you in the top 10%?

- (a) $z = \tfrac{177 - 165}{6} = 2$ · $P(Z > 2) = 1 - 0.9772$

- (b) $z = \pm1$ · $\Phi(1) - \Phi(-1) = 0.8413 - 0.1587$

- (c) $\Phi(z) = 0.90 \Rightarrow z \approx 1.2816$ · $x = 70 + 1.2816(8)$

(a) ≈ 0.0228 · (b) ≈ 0.6827 · (c) ≈ 80.25

JavaScript is needed for the lab

To look values up yourself, see the z tables, both Φ(z) and the area from 0 to z.

## Correlation and linear regression

With paired data, such as hours of study and test scores, a scatter plot shows whether the two variables have a linear relationship. The correlation coefficient r lies between −1 and 1 and gives both the direction and the strength. The least-squares regression line is the line that makes the sum of the squared vertical distances from the points to the line as small as possible, and it is used to predict y from x within the range of the data.

D9 Regression & correlation

$$S_{xy} = \sum xy - \frac{\sum x\sum y}{n},\ \ b = \frac{S_{xy}}{S_{xx}},\ \ a = \bar y - b\bar x,\ \ r = \frac{S_{xy}}{\sqrt{S_{xx}S_{yy}}}$$

Example D-7 · A regression line

### Review hours x = 1, 2, …, 8 give scores y = 52, 55, 61, 64, 70, 71, 78, 80. Find the regression line and r, and predict the score for 10 hours

- $\sum x = 36,\ \sum y = 531,\ \sum xy = 2563,\ \sum x^2 = 204$ · $S_{xx} = 204 - 162 = 42$ · $S_{xy} = 2563 - 2389.5 = 173.5$

- $b = 173.5/42 \approx 4.131$ · $a = 66.375 - 4.131(4.5) \approx 47.786$

- $r \approx 0.994$ · $\hat y(10) \approx 47.786 + 41.31$

$\hat y \approx 47.79 + 4.13x$ · $r \approx 0.994$ · prediction ≈ 89.1 (outside the data range, so treat with care)

JavaScript is needed for the lab

Common trapsDividing by n instead of n − 1 when the problem says the data are a sample · finding the median without sorting first · using the mean for data with extreme outliers · and reading a high r as cause and effect.

## Practice (with answers)

1Median of 8, 3, 5, 12, 7, 10
Sorted 3, 5, 7, 8, 10, 12, position 3.5
7.5

2The mean of 30 students is 64. A new student scores 95. What is the new mean?
$\tfrac{30(64) + 95}{31}$
65

3Find σ for 2, 4, 4, 4, 5, 5, 7, 9
$\mu = 5$ · $\sum(x - \mu)^2 = 32$ · $\sigma^2 = 4$
σ = 2

4If z = −1.5 with μ = 50 and σ = 4, what is the value?
$x = 50 + (-1.5)(4)$
44

5Normal with μ = 100, σ = 15: what proportion is below 70?
$z = -2$ · $\Phi(-2)$
≈ 0.0228

## Read next

- 27.16 Statistical tables: z, t, χ² and F — full tables with a p-value calculator

- The binomial distribution — the basis of the normal approximation

## Frequently asked questions

What is the difference between population and sample standard deviation?
The population SD (σ) divides by N, the total number of values. The sample SD (s) divides by n − 1, because using the sample mean in place of the true mean makes the sum of squares slightly too small, and dividing by n − 1 corrects for that. Use σ when the data are everything you care about, and s when they are a sample used to estimate a larger group.

How do I find quartiles of raw data?
Sort the data in increasing order. The position of Q_r is r(n + 1)/4. If it is a whole number, read the value at that position; if not, interpolate between the two neighbouring positions. That is the method used in many textbooks and in the calculator on this page; some software uses other definitions and may give slightly different values.

What is a z-score used for?
A z-score tells you how many standard deviations a value lies from the mean. It lets you compare values from different data sets with different units or spreads, such as a math score and a physics score, and it is what you look up in a z table to find areas under the normal curve.

If r is close to 1, does x cause y?
No. Correlation only measures a linear relationship; it says nothing about cause and effect. Two variables may move together because a third variable drives both, or by chance. Also, r close to 0 does not mean there is no relationship: the relationship may simply not be linear.

Mod

Ajarn Mod · Teerawut Savangboon
Lecturer in Electrical Engineering, Dhonburi Rajabhat University, Samut Prakan · Profile

## Frequently asked questions

**What is the difference between population and sample standard deviation?**
The population SD (σ) divides by N, the total number of values. The sample SD (s) divides by n − 1, because using the sample mean in place of the true mean makes the sum of squares slightly too small, and dividing by n − 1 corrects for that. Use σ when the data are everything you care about, and s when they are a sample used to estimate a larger group.

**How do I find quartiles of raw data?**
Sort the data in increasing order. The position of Q_r is r(n + 1)/4. If it is a whole number, read the value at that position; if not, interpolate between the two neighbouring positions. That is the method used in many textbooks and in the calculator on this page; some software uses other definitions and may give slightly different values.

**What is a z-score used for?**
A z-score tells you how many standard deviations a value lies from the mean. It lets you compare values from different data sets with different units or spreads, such as a math score and a physics score, and it is what you look up in a z table to find areas under the normal curve.

**If r is close to 1, does x cause y?**
No. Correlation only measures a linear relationship; it says nothing about cause and effect. Two variables may move together because a third variable drives both, or by chance. Also, r close to 0 does not mean there is no relationship: the relationship may simply not be linear.
