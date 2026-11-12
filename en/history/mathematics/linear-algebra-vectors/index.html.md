---
title: "History of linear algebra and vectors: from Chinese counting boards to the QR algorithm"
url: https://modsengineeringmath.com/en/history/mathematics/linear-algebra-vectors/
site: "Mod's Engineering Mathematics (อาจารย์มด)"
language: en
updated: 2026-11-12
---

> The history of matrices and linear algebra: elimination in the Nine Chapters, Seki's and Leibniz's determinants, Cramer's rule, Gauss and Ceres, Sylvester's word matrix, Hamilton's quaternions and the vectors of Gibbs and Heaviside.

Markdown copy of https://modsengineeringmath.com/en/history/mathematics/linear-algebra-vectors/ for AI assistants and search tools. Math is LaTeX ($…$ and $$…$$); interactive labs and figures are only on the web page.

# History of linear algebra and vectors: from Chinese counting boards to the QR algorithm

THภาษาไทยENEnglish
// History · History of Mathematics · 5/6


Most students learn determinants before matrices, and history ran the same way: people worked with determinants for nearly two centuries before anyone thought of a matrix as something you could multiply.

Mathematics1. Ancient mathematics2. Algebra & analytic geometry3. Calculus4. Fourier & Laplace5. Linear algebra & vectors6. Probability & computing

## Systems of equations came two thousand years before matrices

Problems of the form three bundles of good grain and two of poor grain make so much appear in China's Nine Chapters. The method is to lay out the coefficients in columns on a counting board, multiply and subtract columns until a triangle remains, then substitute back. Turn the columns into rows and that is Gaussian elimination step for step.

In Europe and Japan the interest was in a formula for the answer rather than a procedure. Seki Takakazu in 1683 and Leibniz in 1693 discovered determinants without knowing of each other, and Cramer published his rule for solving systems with determinants in 1750. Engineering students still learn Cramer's rule, although in practice computers never use it beyond three or four unknowns, because it is far slower than elimination.

## Timeline

- c. 200 BC–AD 100China's Nine Chapters solves linear systems by elimination on a table (fangcheng).

- 1683 / 1693Seki Takakazu in Japan (1683) and Leibniz (1693) use determinants independently.

- 1750Gabriel Cramer publishes Cramer's rule.

- 1801–1809Gauss computes the orbit of the asteroid Ceres using least squares and elimination.

- 1843William Rowan Hamilton thinks of quaternions while walking over a Dublin bridge and carves the formula into it (16 October).

- 1844Hermann Grassmann publishes the Ausdehnungslehre, a theory of n-dimensional space that almost nobody reads.

- 1850 / 1858Sylvester coins the word matrix (1850); Cayley publishes matrix algebra (1858).

- 1880sGibbs and Heaviside separately develop vector analysis: dot and cross products, div and curl.

- 1888Peano gives the axioms of a vector space.

- 1904Hilbert uses the word eigen in his work on integral equations.

- 1947Von Neumann and Goldstine analyse rounding error in matrix inversion on computers, the start of numerical linear algebra.

- 1961John Francis and Vera Kublanovskaya independently develop the QR algorithm for eigenvalues.

## The matrix becomes an object

Matrix is Latin for womb. Sylvester used it in 1850 because he saw the array as the thing from which many smaller determinants are born. Eight years later his friend Cayley published a memoir defining matrix addition, multiplication and inverse, and showing that matrix multiplication does not commute. It also contained what is now the Cayley–Hamilton theorem, which Cayley checked for 2×2 and 3×3 matrices before declaring that a general proof was unnecessary.

The word eigen, meaning own or characteristic, came much later, in Hilbert's work in the early twentieth century. The idea itself was older, in Euler's and Lagrange's work on rotating rigid bodies and Cauchy's on quadratic forms.

## Vectors: the war between quaternions and Gibbs

Hamilton tried for years to extend complex numbers to three dimensions. On 16 October 1843, walking with his wife to a meeting of the Royal Irish Academy, he realised he needed four: $i^2 = j^2 = k^2 = ijk = -1$, and carved the formula into Broom Bridge in Dublin on the spot. The product of two quaternions with no real part contains both the dot product and the cross product.

Quaternions worked but were awkward, so Gibbs at Yale and Heaviside in England each extracted the useful parts into vector analysis in the 1880s. Quaternion loyalists such as Peter Tait attacked them fiercely in the pages of Nature, but engineers and physicists chose vectors because Maxwell's equations became short and clear. The irony is that quaternions came back in computer graphics, spacecraft navigation and drones, because they rotate 3D objects without gimbal lock.

## When matrices moved into computers

After the Second World War, von Neumann and Goldstine asked a question nobody had taken seriously: if you solve a system with dozens of unknowns on a computer that rounds at every step, how wrong is the answer? Their 1947 work and James Wilkinson's afterwards made numerical linear algebra a field. The QR algorithm of 1961 is still how MATLAB and NumPy find eigenvalues, and multiplying huge matrices is what graphics cards do all day when training AI models.

## Key people

### Carl Friedrich Gauss
1777–1855 · Germany
At 24 he computed the orbit of the asteroid Ceres from a handful of observations, precisely enough for astronomers to find it again. The least-squares and elimination methods he used became standard, though Chinese mathematicians had used elimination long before.

### Arthur Cayley
1821–1895 · England
Worked as a lawyer for fourteen years and wrote hundreds of mathematical papers during that time. His 1858 memoir was the first to treat matrices as objects that can be added, multiplied and inverted rather than as mere tables.

### James Joseph Sylvester
1814–1897 · England
Cayley's close friend, he coined the word matrix in 1850 and much other algebraic vocabulary. Barred from English university posts for years because he was Jewish, he went to Johns Hopkins and helped found research mathematics in America.

### William Rowan Hamilton
1805–1865 · Ireland
Spent years looking for a way to multiply points in three dimensions and found he needed four, and a multiplication that does not commute. His quaternions are the ancestor of the dot and cross products and are still used for rotations in robots, drones and 3D games.

### Josiah Willard Gibbs
1839–1903 · United States
Received the first American doctorate in engineering (Yale, 1863). He extracted the useful parts of quaternions into the vector analysis we learn, and laid the foundations of chemical thermodynamics used by chemical engineers.

### Hermann Grassmann
1809–1877 · Germany
A secondary school teacher who worked out n-dimensional linear spaces, linear independence and dimension decades early, but wrote so obscurely that no one followed. He turned to Sanskrit and was better known as a linguist than a mathematician in his lifetime.

## Where this continues on the site

- Linear algebra: matrices, determinants, eigenvalues (in Thai)

- Cramer's rule (in Thai)

- Numerical methods: Jacobi, Gauss–Seidel (in Thai)

- Vector algebra, dot and cross products (in Thai)

- Dot product versus cross product

## Frequently asked questions

Who invented matrices?
James Joseph Sylvester coined the word matrix in 1850 and Arthur Cayley published matrix algebra in 1858, but arranging coefficients in a table to solve equations appears much earlier in China's Nine Chapters.

Is Gaussian elimination really Gauss's?
The method appears in China's Nine Chapters about two thousand years ago. Gauss used it and described it systematically in his orbit calculations in the early nineteenth century, which is how his name became attached to it in Western textbooks.

Where do the dot and cross products come from?
From Hamilton's quaternion product (1843). Gibbs and Heaviside separated its scalar and vector parts into the dot and cross products in the 1880s.

## Sources and further reading

- Hart, R. The Chinese Roots of Linear Algebra. Johns Hopkins University Press, 2011.

- Crowe, M. J. A History of Vector Analysis. University of Notre Dame Press, 1967 (Dover reprint 1994).

- Grcar, J. F. “Mathematicians of Gaussian Elimination.” Notices of the AMS 58, no. 6 (2011): 782–792.

- Hawkins, T. “Another Look at Cayley and the Theory of Matrices.” Archives Internationales d'Histoire des Sciences 27 (1977): 82–112.

- Golub, G. H., and van der Vorst, H. A. “Eigenvalue Computation in the 20th Century.” Journal of Computational and Applied Mathematics 123 (2000): 35–65.

← PreviousFourier & LaplaceNext →Probability & computing

## Frequently asked questions

**Who invented matrices?**
James Joseph Sylvester coined the word matrix in 1850 and Arthur Cayley published matrix algebra in 1858, but arranging coefficients in a table to solve equations appears much earlier in China's Nine Chapters.

**Is Gaussian elimination really Gauss's?**
The method appears in China's Nine Chapters about two thousand years ago. Gauss used it and described it systematically in his orbit calculations in the early nineteenth century, which is how his name became attached to it in Western textbooks.

**Where do the dot and cross products come from?**
From Hamilton's quaternion product (1843). Gibbs and Heaviside separated its scalar and vector parts into the dot and cross products in the 1880s.
