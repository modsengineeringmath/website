# Checks every worked-example number on the rank (7.10), numerical-methods (7.11) and exam-practice (7.12) pages
# of the linear algebra series, the new determinant/Cramer sections, and the five linear-algebra articles.
# Usage: python3 scripts/la_check.py        (prints PASS/FAIL per item and the iteration tables quoted in the text)
import math
from fractions import Fraction as Fr
import sympy as sp

ok_all = True


def check(name, got, want):
    global ok_all
    if isinstance(got, (list, tuple)):
        good = list(got) == list(want)
    elif isinstance(got, sp.MatrixBase):
        good = (got - want).is_zero_matrix
    else:
        good = sp.simplify(sp.sympify(got) - sp.sympify(want)) == 0
    if not good:
        ok_all = False
    print(("PASS " if good else "FAIL ") + name + ("" if good else f"   got {got}   want {want}"))


M = sp.Matrix
k, a, b, s, lam = sp.symbols("k a b s lambda")

# ---------------------------------------------------------------- 7.10 rank
check("R-1 rank", M([[1, 2, -1], [2, 3, 1], [3, 5, 0]]).rank(), 2)
B2 = M([[1, 2, 0, 3], [2, 4, 1, 7], [-1, -2, 2, -1]])
check("R-2 rank", B2.rank(), 2)
check("R-2 rref", B2.rref()[0].tolist(), [[1, 2, 0, 3], [0, 0, 1, 1], [0, 0, 0, 0]])
for v in ([-2, 1, 0, 0], [-3, 0, -1, 1]):
    check(f"R-2 null {v}", (B2 * M(v)).norm(), 0)
check("R-3 rank", M([[1, 1, 1, 1], [1, 2, 3, 4], [1, 3, 6, 10], [2, 3, 4, 5]]).rank(), 3)
A4 = M([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
check("R-4 det", A4.det(), 0)
check("R-4 minor", M([[1, 2], [4, 5]]).det(), -3)
Ak = M([[1, 1, k], [1, k, 1], [k, 1, 1]])
check("R-5 det", sp.factor(Ak.det()), -(k - 1) ** 2 * (k + 2))
check("R-5 k=1", Ak.subs(k, 1).rank(), 1)
check("R-5 k=-2", Ak.subs(k, -2).rank(), 2)
check("R-5 k=0", Ak.subs(k, 0).rank(), 3)
# R-6 Rouché–Capelli
S6 = M([[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, a, b]])
E = S6.copy(); E[1, :] -= E[0, :]; E[2, :] -= E[0, :]; E[2, :] -= 2 * E[1, :]
check("R-6 last row", [sp.expand(e) for e in E[2, :]], [0, 0, a - 5, b - 3])
sol = sp.solve([sp.Symbol("x") + sp.Symbol("y") + sp.Symbol("z") - 1,
                sp.Symbol("x") + 2 * sp.Symbol("y") + 3 * sp.Symbol("z") - 2,
                sp.Symbol("x") + 3 * sp.Symbol("y") + 6 * sp.Symbol("z") - 4], sp.symbols("x y z"))
check("R-6 a=6,b=4", [sol[sp.Symbol("x")], sol[sp.Symbol("y")], sol[sp.Symbol("z")]], [1, -1, 1])
t = sp.Symbol("t")
X6 = M([t, 1 - 2 * t, t])
check("R-6 a=5,b=3 param", sp.simplify((M([[1, 1, 1], [1, 2, 3], [1, 3, 5]]) * X6 - M([1, 2, 3])).norm()), 0)
check("R-6 a=5,b=3 ranks", (M([[1, 1, 1], [1, 2, 3], [1, 3, 5]]).rank(), M([[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, 3]]).rank()), (2, 2))
check("R-6 a=5,b=4 ranks", (M([[1, 1, 1], [1, 2, 3], [1, 3, 5]]).rank(), M([[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, 4]]).rank()), (2, 3))
# R-7 homogeneous
H7 = M([[1, 2, 1], [2, 1, 1], [1, -1, k]])
check("R-7 det", sp.expand(H7.det()), -3 * k)
check("R-7 null k=0", (H7.subs(k, 0) * M([1, 1, -3])).norm(), 0)
# incidence matrix: nodes 1..4, branches 1→2, 2→3, 3→4, 4→1, 1→3
Inc = M([[1, 0, 0, -1, 1], [-1, 1, 0, 0, 0], [0, -1, 1, 0, -1], [0, 0, -1, 1, 0]])
check("R-13 incidence rank", Inc.rank(), 3)
Ac = M([[0, 1], [-2, -3]])
check("R-14 ctrb B=(0,1)", M.hstack(M([0, 1]), Ac * M([0, 1])).rank(), 2)
check("R-14 ctrb B=(1,-1)", M.hstack(M([1, -1]), Ac * M([1, -1])).rank(), 1)
sv = sorted([float(x) for x in M([[1, 1], [1, sp.Rational(10001, 10000)]]).singular_values()])
print("     singular values of [[1,1],[1,1.0001]]:", sv)
# adjugate rank
check("R-16 rank adj (rank n-1)", A4.adjugate().rank(), 1)

# ---------------------------------------------------------------- 7.11 numerical methods
# operation counts
for n in (3, 10, 20, 100, 1000):
    if n > 150:
        print(f'     n={n}: Gauss n^3/3 = {n**3/3:.3g}   Cramer (n+1)! = 10^{math.lgamma(n+2)/math.log(10):.1f}'); continue
    print(f"     n={n}: Gauss n^3/3 = {n**3/3:.3g}   Cramer (n+1)! = {'%.3e' % math.factorial(n+1) if n < 150 else '10^' + str(round(math.lgamma(n+2)/math.log(10)))}")
print("     21!/1e9 s in years:", math.factorial(21) / 1e9 / 3.156e7)


def fl(x, s):
    if x == 0:
        return 0.0
    e = math.floor(math.log10(abs(x)))
    q = 10 ** (s - 1 - e)
    return round(x * q) / q


def gauss_fl(A, b, s, pivot):
    n = len(A)
    A = [r[:] for r in A]; b = b[:]
    for c in range(n):
        if pivot:
            p = max(range(c, n), key=lambda i: abs(A[i][c]))
            A[c], A[p] = A[p], A[c]; b[c], b[p] = b[p], b[c]
        for i in range(c + 1, n):
            m = fl(A[i][c] / A[c][c], s)
            for j in range(c, n):
                A[i][j] = fl(A[i][j] - fl(m * A[c][j], s), s)
            b[i] = fl(b[i] - fl(m * b[c], s), s)
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        acc = b[i]
        for j in range(i + 1, n):
            acc = fl(acc - fl(A[i][j] * x[j], s), s)
        x[i] = fl(acc / A[i][i], s)
    return x


for eps in (1e-2, 1e-4, 1e-6):
    ex = 1 / (1 - eps)
    print(f"     pivot demo eps={eps} (exact x = {ex:.10f}, y = {(1 - 2 * eps) / (1 - eps):.10f}):")
    for sd in range(3, 9):
        print(f"       s={sd}: no pivot {gauss_fl([[eps, 1.0], [1.0, 1.0]], [1.0, 2.0], sd, False)}   pivot {gauss_fl([[eps, 1.0], [1.0, 1.0]], [1.0, 2.0], sd, True)}")
check("C8 no pivot s=3", gauss_fl([[0.0001, 1.0], [1.0, 1.0]], [1.0, 2.0], 3, False), [0.0, 1.0])
check("C8 pivot s=3", gauss_fl([[0.0001, 1.0], [1.0, 1.0]], [1.0, 2.0], 3, True), [1.0, 1.0])
# LU (Doolittle) N-3
A3 = M([[1, 2, 4], [3, 8, 14], [2, 6, 13]])
L3 = M([[1, 0, 0], [3, 1, 0], [2, 1, 1]]); U3 = M([[1, 2, 4], [0, 2, 2], [0, 0, 3]])
check("N-3 LU", (L3 * U3 - A3).norm(), 0)
check("N-3 solve", list(A3.LUsolve(M([3, 13, 4]))), [3, 4, -2])
check("N-3 solve b2", list(A3.LUsolve(M([1, 1, 1]))), [sp.Rational(7, 3), sp.Rational(-4, 3), sp.Rational(1, 3)])
check("N-3 det", A3.det(), 6)
# PA = LU
Ap = M([[2, 1, 1], [4, -6, 0], [-2, 7, 2]])
P = M([[0, 1, 0], [1, 0, 0], [0, 0, 1]]); Lp = M([[1, 0, 0], [sp.Rational(1, 2), 1, 0], [sp.Rational(-1, 2), 1, 1]]); Up = M([[4, -6, 0], [0, 4, 1], [0, 0, 1]])
check("N-4 PA=LU", (P * Ap - Lp * Up).norm(), 0)
check("N-4 det", Ap.det(), -16)
# Cholesky N-5
G = M([[4, 2, 2], [2, 5, 3], [2, 3, 6]])
check("N-5 chol", G.cholesky().tolist(), [[2, 0, 0], [1, 2, 0], [1, 1, 2]])
check("N-5 solve", list(G.LUsolve(M([10, 13, 17]))), [1, 1, 2])
# Thomas N-6
T4 = M([[2, -1, 0, 0], [-1, 2, -1, 0], [0, -1, 2, -1], [0, 0, -1, 2]])
check("N-6 rod", list(T4.LUsolve(M([100, 0, 0, 0]))), [80, 60, 40, 20])


def thomas(a, bb, c, d):
    n = len(d); cp = [Fr(0)] * n; dp = [Fr(0)] * n
    cp[0] = Fr(c[0]) / bb[0]; dp[0] = Fr(d[0]) / bb[0]
    for i in range(1, n):
        m = bb[i] - a[i] * cp[i - 1]
        cp[i] = Fr(c[i]) / m if i < n - 1 else Fr(0)
        dp[i] = (d[i] - a[i] * dp[i - 1]) / m
    x = [Fr(0)] * n; x[-1] = dp[-1]
    for i in range(n - 2, -1, -1):
        x[i] = dp[i] - cp[i] * x[i + 1]
    return cp, dp, x


cp, dp, xs = thomas([0, -1, -1, -1], [2, 2, 2, 2], [-1, -1, -1, 0], [100, 0, 0, 0])
print("     Thomas c'", [str(v) for v in cp], "d'", [str(v) for v in dp])
check("N-6 thomas", xs, [80, 60, 40, 20])


def jacobi(A, b, x0, n):
    out = [x0]
    x = x0[:]
    for _ in range(n):
        x = [(b[i] - sum(A[i][j] * x[j] for j in range(len(b)) if j != i)) / A[i][i] for i in range(len(b))]
        out.append(x)
    return out


def gs(A, b, x0, n, w=1):
    out = [x0]
    x = x0[:]
    for _ in range(n):
        x = x[:]
        for i in range(len(b)):
            new = (b[i] - sum(A[i][j] * x[j] for j in range(len(b)) if j != i)) / A[i][i]
            x[i] = (1 - w) * x[i] + w * new
        out.append(x)
    return out


A7 = [[4, -1, 1], [4, -8, 1], [-2, 1, 5]]; b7 = [7, -21, 15]
print("     Jacobi (x0 = (1,2,2)):")
for i, v in enumerate(jacobi(A7, b7, [1.0, 2.0, 2.0], 12)):
    print(f"       {i}: " + ", ".join(f"{t:.6f}" for t in v))
print("     Gauss-Seidel:")
for i, v in enumerate(gs(A7, b7, [1.0, 2.0, 2.0], 8)):
    print(f"       {i}: " + ", ".join(f"{t:.6f}" for t in v))
J1 = jacobi([[Fr(x) for x in r] for r in A7], [Fr(x) for x in b7], [Fr(1), Fr(2), Fr(2)], 2)
G1 = gs([[Fr(x) for x in r] for r in A7], [Fr(x) for x in b7], [Fr(1), Fr(2), Fr(2)], 2)
check("N-7 jacobi x1", J1[1], [Fr(7, 4), Fr(27, 8), Fr(3)])
check("N-7 gs x1", G1[1], [Fr(7, 4), Fr(15, 4), Fr(59, 20)])
print("     exact J2:", [str(v) for v in J1[2]], " GS2:", [str(v) for v in G1[2]])
Am = M(A7); D = sp.diag(*[Am[i, i] for i in range(3)]); Lm = -Am.lower_triangular(-1); Um = -Am.upper_triangular(1)
TJ = D.inv() * (Lm + Um); TG = (D - Lm).inv() * Um
print("     rho(TJ) =", max(abs(complex(e)) for e in TJ.evalf().eigenvals()), " rho(TG) =", max(abs(complex(e)) for e in TG.evalf().eigenvals()))
# tridiagonal n=10
n10 = 10
rJ = math.cos(math.pi / (n10 + 1)); rG = rJ ** 2; wopt = 2 / (1 + math.sin(math.pi / (n10 + 1)))
print(f"     tridiag n=10: rhoJ={rJ:.4f} rhoGS={rG:.4f} wopt={wopt:.4f} rhoSOR={wopt-1:.4f}")
print("     iterations for 1e-6:", [round(6 / -math.log10(r)) for r in (rJ, rG, wopt - 1)])
# condition numbers
Ac2 = M([[1, 1], [1, sp.Rational(10001, 10000)]])
ninf = lambda X: max(sum(abs(v) for v in X.row(i)) for i in range(X.rows))
check("N-9 kappa", ninf(Ac2) * ninf(Ac2.inv()), sp.Rational(20001, 10000) * 20001)
for n in range(2, 9):
    H = M(n, n, lambda i, j: sp.Rational(1, i + j + 1))
    print(f"     kappa_inf(H{n}) = {ninf(H) * ninf(H.inv())}  ≈ {float(ninf(H) * ninf(H.inv())):.4g}")
check("C7 kappa", ninf(M([[1, 2], [3, 4]])) * ninf(M([[1, 2], [3, 4]]).inv()), 21)

# ---------------------------------------------------------------- 7.12 exam practice
check("A1", (2 * M([[2, -1], [3, 4]]) - M([[1, 0], [-2, 5]])).det(), 25)
check("A3", sp.Rational(27) * sp.Rational(-1, 2), sp.Rational(-27, 2))
check("A4", sorted(sp.solve(M([[k + 2, 4], [1, k - 1]]).det(), k)), [-3, 2])
check("A5", M([[1, 2, -1], [3, 0, 2], [-2, 1, 4]]).det(), -37)
ga, gb, gc, gd, ge, gf, gg, gh, gi = sp.symbols("a b c d e f g h i")
base = M([[ga, gb, gc], [gd, ge, gf], [gg, gh, gi]])
mod = M([[2 * ga, 2 * gb, 2 * gc], [gg, gh, gi], [gd + 3 * ga, ge + 3 * gb, gf + 3 * gc]])
check("A6", sp.simplify(mod.det() / base.det()), -2)
check("A7", sum(M([[1, 2], [3, 4]]).inv()), 0)
check("A8", (M([[2, 1], [5, 3]]).inv() * M([[1, 0], [2, 1]])).tolist(), [[1, -1], [-1, 2]])
S9 = M([[2, 1, -1], [1, 3, 2], [3, -1, 1]]); b9 = M([3, 14, 2])
check("A9 delta", S9.det(), 25)
Dy = S9.copy(); Dy[:, 1] = b9
check("A9 delta_y", Dy.det(), 75)
check("A9 sol", list(S9.LUsolve(b9)), [1, 3, 2])
check("A10 det", sp.factor(M([[k, 2], [8, k]]).det()), (k - 4) * (k + 4))
check("A10 k=-4 ranks", (M([[-4, 2], [8, -4]]).rank(), M([[-4, 2, 3], [8, -4, 6]]).rank()), (1, 2))
check("A10 k=4 ranks", (M([[4, 2], [8, 4]]).rank(), M([[4, 2, 3], [8, 4, 6]]).rank()), (1, 1))
A11 = M([[1, 2], [3, 4]])
check("A11", (A11 ** 2 - 5 * A11 + 2 * sp.eye(2)).tolist(), [[4, 0], [0, 4]])
check("A12", (M([[1, 1], [0, 2]]) ** 5).tolist(), [[1, 31], [0, 32]])
check("A13", sp.Rational(5) ** 3 / -3, sp.Rational(-125, 3))
check("A14", abs(M([[3, 1], [1, 4]]).det()) / 2, sp.Rational(11, 2))
check("A15", M([[1, 2, 3], [2, 4, 6], [3, 6, 10]]).rank(), 2)
S18 = M([[1, 1, 1, 6], [1, 2, 3, 14], [1, 4, k, sp.Symbol("m")]])
E = S18.copy(); E[1, :] -= E[0, :]; E[2, :] -= E[0, :]; E[2, :] -= 3 * E[1, :]
check("A18 last row", [sp.expand(e) for e in E[2, :]], [0, 0, k - 7, sp.Symbol("m") - 30])
# set B
B1 = M([[1, -1, 2, 0], [2, -2, 5, 1], [3, -3, 7, 1]])
check("B1 rank", B1.rank(), 2)
for v in ([1, 1, 0, 0], [2, 0, -1, 1]):
    check(f"B1 null {v}", (B1 * M(v)).norm(), 0)
check("B2", sorted(sp.solve(M([[1 - lam, 2], [3, 2 - lam]]).det(), lam)), [-1, 4])
B3 = M([[1, 2, -1, 3], [2, 5, 0, 7], [-1, 1, 4, 2], [3, 7, 1, 8]])
print("     B3 det:", B3.det())
B4 = M([[1, 0, 2], [2, -1, 3], [4, 1, 8]])
check("B4 det", B4.det(), 1)
print("     B4 inverse:", B4.inv().tolist())
R1, R2, R3, V = sp.symbols("R1 R2 R3 V", positive=True)
I2 = M([[R1 + R2, V], [-R2, 0]]).det() / M([[R1 + R2, -R2], [-R2, R2 + R3]]).det()
check("B5", sp.simplify(I2 - R2 * V / (R1 * R2 + R1 * R3 + R2 * R3)), 0)
B6 = M([[2, 4, -2], [4, 9, -3], [-2, -3, 7]])
check("B6 LU", (M([[1, 0, 0], [2, 1, 0], [-1, 1, 1]]) * M([[2, 4, -2], [0, 1, 1], [0, 0, 4]]) - B6).norm(), 0)
check("B6 solve", list(B6.LUsolve(M([2, 8, 10]))), [-1, 2, 2])
S7 = M([[1, 2, -1, 1], [2, 5, 1, 4], [1, 3, a, b]])
E = S7.copy(); E[1, :] -= 2 * E[0, :]; E[2, :] -= E[0, :]; E[2, :] -= E[1, :]
check("B7 last row", [sp.expand(e) for e in E[2, :]], [0, 0, a - 2, b - 3])
X7 = M([-3 + 7 * t, 2 - 3 * t, t])
check("B7 param", sp.simplify((M([[1, 2, -1], [2, 5, 1], [1, 3, 2]]) * X7 - M([1, 4, 3])).norm()), 0)
B8 = M([[1, 1, 1], [1, 2, k], [1, 4, k ** 2]])
check("B8 det", sp.factor(B8.det()), (k - 1) * (k - 2))
check("B8 k=1,2 rank", (B8.subs(k, 1).rank(), B8.subs(k, 2).rank()), (2, 2))
check("B9 c0,c1", list(M([[3, 6], [6, 14]]).LUsolve(M([5, 11]))), [sp.Rational(2, 3), sp.Rational(1, 2)])
B10 = M(4, 4, lambda i, j: 3 if i == j else 1)
check("B10", B10.det(), 48)
check("B11", sp.Integer(3) ** 4, 81)
Z = M([[2 + sp.I, -sp.I], [-sp.I, 1 + 2 * sp.I]])
Iz = Z.LUsolve(M([10, 0]))
print("     B12 I1 =", sp.nsimplify(sp.simplify(Iz[0])), "=", complex(Iz[0]), "|I1| =", float(abs(Iz[0])), "angle", math.degrees(math.atan2(float(sp.im(Iz[0])), float(sp.re(Iz[0])))))
print("     B12 I2 =", sp.simplify(Iz[1]), "=", complex(Iz[1]), "|I2| =", float(abs(Iz[1])), "angle", math.degrees(math.atan2(float(sp.im(Iz[1])), float(sp.re(Iz[1])))))
check("B13", sp.expand((s * sp.eye(2) - M([[0, 1], [-6, -5]])).det()), s ** 2 + 5 * s + 6)
check("B14", sp.solve(M([[1, 2, 3], [2, k, 4], [3, 5, 7]]).det(), k), [3])
# set C
A_c1 = [[5, -1, 1], [2, 8, -1], [-1, 1, 4]]; b_c1 = [10, 11, 3]
check("C1 exact", list(M(A_c1).LUsolve(M(b_c1))), [2, 1, 1])
Jc = jacobi([[Fr(x) for x in r] for r in A_c1], [Fr(x) for x in b_c1], [Fr(0)] * 3, 2)
Gc = gs([[Fr(x) for x in r] for r in A_c1], [Fr(x) for x in b_c1], [Fr(0)] * 3, 2)
check("C1 jacobi", Jc[1], [Fr(2), Fr(11, 8), Fr(3, 4)])
check("C1 gs", Gc[1], [Fr(2), Fr(7, 8), Fr(33, 32)])
print("     C2 GS x2 =", [str(v) for v in Gc[2]], [float(v) for v in Gc[2]], " J x2 =", [str(v) for v in Jc[2]])
check("C4 solution", list(M([[1, 6, -2], [7, -1, 1], [1, 1, 5]]).LUsolve(M([3, 8, 12]))), [1, 1, 2])
TJ5 = M([[0, sp.Rational(1, 2)], [sp.Rational(1, 2), 0]])
check("C5 rhoJ", max(abs(e) for e in TJ5.eigenvals()), sp.Rational(1, 2))
TG5 = (M([[2, 0], [-1, 2]])).inv() * M([[0, 1], [0, 0]])
check("C5 rhoGS", max(abs(e) for e in TG5.eigenvals()), sp.Rational(1, 4))
check("C8 eps=1e-5 s=4 no pivot", gauss_fl([[1e-5, 1.0], [1.0, 1.0]], [1.0, 2.0], 4, False), [0.0, 1.0])
check("C8 eps=1e-5 s=4 pivot", gauss_fl([[1e-5, 1.0], [1.0, 1.0]], [1.0, 2.0], 4, True), [1.0, 1.0])
check("C9", list(M([[4, -1, 0], [-1, 4, -1], [0, -1, 4]]).LUsolve(M([15, -2, 7]))), [4, 1, 2])
check("C10 chol", M([[9, 3, 3], [3, 5, 5], [3, 5, 14]]).cholesky().tolist(), [[3, 0, 0], [1, 2, 0], [1, 2, 3]])
Tp = sp.symbols("T1:5")
solp = sp.solve([4 * Tp[0] - 100 - Tp[1] - Tp[2], 4 * Tp[1] - 100 - Tp[0] - Tp[3], 4 * Tp[2] - Tp[0] - Tp[3], 4 * Tp[3] - Tp[1] - Tp[2]], Tp)
check("N-9 plate (top 100)", [solp[v] for v in Tp], [sp.Rational(75, 2), sp.Rational(75, 2), sp.Rational(25, 2), sp.Rational(25, 2)])

solq = sp.solve([4 * Tp[0] - 150 - Tp[1] - Tp[2], 4 * Tp[1] - 100 - Tp[0] - Tp[3], 4 * Tp[2] - 50 - Tp[0] - Tp[3], 4 * Tp[3] - Tp[1] - Tp[2]], Tp)
check("C12 plate (top 100, left 50)", [solq[v] for v in Tp], [sp.Rational(225, 4), sp.Rational(175, 4), sp.Rational(125, 4), sp.Rational(75, 4)])
check("C2 GS x2", Gc[2], [Fr(63, 32), Fr(259, 256), Fr(1013, 1024)])
check("B3 det", B3.det(), 2)

# ---------------------------------------------------------------- determinants / Cramer additions
check("D-ex adj det(2 adj A)", 2 ** 3 * 3 ** 2, 72)
Ar = M([[2, 1, 0], [1, 3, 1], [0, 1, 2]])  # any matrix with det 8 to spot-check the identities numerically
dA = Ar.det()
check("D22", Ar.adjugate().det(), dA ** 2)
check("D23 adj(kA)", (5 * Ar).adjugate(), 25 * Ar.adjugate())
check("D23 adj adj", Ar.adjugate().adjugate(), dA * Ar)
check("D24 adj(AB)", (Ar * B4).adjugate(), B4.adjugate() * Ar.adjugate())
check("D25 n=5 a=2 b=-1", M(5, 5, lambda i, j: 2 if i == j else -1).det(), (2 + 1) ** 4 * (2 + 4 * (-1)))
yk = M([[k, 1], [1, 1]]).det() / M([[k, 1], [1, k]]).det()
check("C-param y", sp.simplify(yk - 1 / (k + 1)), 0)
xk = M([[1, 1], [1, k]]).det() / M([[k, 1], [1, k]]).det()
check("C-param x", sp.simplify(xk - 1 / (k + 1)), 0)

print("\nALL PASS" if ok_all else "\nSOME CHECKS FAILED")
