# Motor models for /learn/ac-induction-motor/ (figures in scripts/acm_figs.py, numbers in the worked examples).
# The same equations run in assets/acm-lab.js; `python3 scripts/acm_model.py` prints every number quoted on the page.
#
# 3-phase: the 7.5 kW 4-pole 400 V Δ 50 Hz IE3 motor used across /learn/motor-control/ — per-phase Y-equivalent double-cage
#          circuit (same constants as scripts/mc_figs.py and assets/mc-lab.js): In ≈ 14 A, Is/In ≈ 6.5, Ts/Tn ≈ 2.15,
#          Tk/Tn ≈ 3.0 at ≈ 1300 rpm, 1471 rpm. Rotor variants keep the stator and swap the rotor branch.
# Dynamics: space-vector (αβ) model with the same constants (flux-linkage states, one or two rotor cages), checked against
#          the equivalent circuit to 1e-6.
# 1-phase: 0.75 kW 4-pole 230 V 50 Hz capacitor motor, two-winding model by symmetrical components (forward/backward fields).
#          Teaching parameters chosen to give catalogue-like behaviour, not a specific product.
import math, cmath
import numpy as np

W50 = 2 * math.pi * 50
VP = 400 / math.sqrt(3)           # per-phase voltage of the Y-equivalent circuit (Δ motor on 400 V)
MP = dict(R1=0.414, X1=1.599, Xm=34.33, Ro=1.306, Xo=0.585, Ri=0.463, Xi=2.199)
SR = 0.0194                       # rated slip → 1471 rpm
P_FE, P_FW = 300.0, 100.0         # core loss (at 400 V) and friction/windage → η ≈ 90.4 % at 7.5 kW
JM = 0.045                        # motor inertia kg·m²

# rotor variants (same stator): single cage low R (≈ design A/N), high R (≈ design D), wound rotor = low-R cage + R_ext
ROTORS = {
    "dc": dict(kind="double", Ro=MP["Ro"], Xo=MP["Xo"], Ri=MP["Ri"], Xi=MP["Xi"]),
    "a": dict(kind="single", R2=0.3425, X2=1.2),
    "d": dict(kind="single", R2=2.0, X2=1.2),
}


def z_rotor(s, rot, k=1.0, rext=0.0):
    if rot["kind"] == "double":
        Zo = complex(rot["Ro"] / s, rot["Xo"] * k)
        Zi = complex(rot["Ri"] / s, rot["Xi"] * k)
        return Zo * Zi / (Zo + Zi), (Zo, Zi)
    Z = complex((rot["R2"] + rext) / s, rot["X2"] * k)
    return Z, (Z,)


def motor(s, V=VP, f=50.0, rotor="dc", rext=0.0, detail=False):
    """Steady state of the 3-phase motor. Returns (I_line A, T N·m, pf) or a dict with detail=True."""
    rot = ROTORS[rotor] if isinstance(rotor, str) else rotor
    k = f / 50.0
    if abs(s) < 1e-6:
        s = 1e-6 if s >= 0 else -1e-6
    Z2, br = z_rotor(s, rot, k, rext)
    Zm = complex(0, MP["Xm"] * k)
    Z1 = complex(MP["R1"], MP["X1"] * k)
    Z = Z1 + Zm * Z2 / (Zm + Z2)
    I1 = V / Z
    E = V - I1 * Z1
    ws = 2 * math.pi * 1500 * k / 60
    if rot["kind"] == "double":
        Io, Ii = E / br[0], E / br[1]
        To = 3 * abs(Io) ** 2 * br[0].real / ws
        Ti = 3 * abs(Ii) ** 2 * br[1].real / ws
        T = To + Ti
    else:
        I2 = E / br[0]
        T = 3 * abs(I2) ** 2 * br[0].real / ws
        To = Ti = None
    pf = math.cos(cmath.phase(I1))
    if not detail:
        return abs(I1), T, pf
    Pin = 3 * (V * I1.conjugate()).real
    Pcu1 = 3 * abs(I1) ** 2 * MP["R1"]
    Pag = T * ws
    return dict(I=abs(I1), T=T, pf=pf, Pin=Pin, Pcu1=Pcu1, Pag=Pag, Pcu2=s * Pag, Pmi=(1 - s) * Pag, To=To, Ti=Ti, E=abs(E))


IN, TN, PFN = motor(SR)
NN = 1500 * (1 - SR)
WN = 2 * math.pi * NN / 60


def n2s(n, f=50.0):
    return 1 - n / (1500 * f / 50)


# ----------------------------------------------------------------------------------------------- loads (fraction k of Tn)
def load_T(kind, n, k=1.0, nn=NN):
    r = abs(n) / nn
    if kind == "const":       # conveyor, hoist, mixer: breakaway 1.2× below 1 % speed
        return k * TN * (1.2 if r < 0.01 else 1.0)
    if kind == "quad":        # centrifugal pump / fan: static friction 12 % + n²
        return k * TN * (0.12 + 0.88 * r * r)
    if kind == "fan":
        return k * TN * (0.05 + 0.95 * r * r)
    if kind == "lin":         # calender, positive-displacement with viscous friction
        return k * TN * (0.05 + 0.95 * r)
    if kind == "power":       # winder, lathe spindle: constant power above 50 % speed, capped below
        return k * TN * min(1.0 / max(r, 1e-6), 2.0)
    raise ValueError(kind)


LOAD_J = {"quad": 0.06, "const": 0.35, "fan": 2.2, "lin": 0.2, "power": 0.4}


def op_point(TL, V=VP, f=50.0, rotor="dc", rext=0.0, scale=1.0):
    """Stable operating point: highest speed where motor torque = load torque on the falling side. None if none."""
    ns = 1500 * f / 50
    prev = None
    best = None
    n = 1
    grid = np.linspace(1, ns - 0.01, 6000)
    for n in grid:
        d = motor(n2s(n, f), V, f, rotor, rext)[1] * scale - TL(n)
        if prev is not None and prev[1] > 0 >= d:
            # bisection between prev[0] and n
            a, b = prev[0], n
            for _ in range(60):
                m = (a + b) / 2
                if motor(n2s(m, f), V, f, rotor, rext)[1] * scale - TL(m) > 0:
                    a = m
                else:
                    b = m
            best = (a + b) / 2
        prev = (n, d)
    return best


def all_crossings(TL, V=VP, f=50.0, rotor="dc", rext=0.0, scale=1.0):
    ns = 1500 * f / 50
    out, prev = [], None
    for n in np.linspace(0.5, ns - 0.01, 8000):
        d = motor(n2s(n, f), V, f, rotor, rext)[1] * scale - TL(n)
        if prev is not None and (prev[1] > 0) != (d > 0):
            a, b = prev[0], n
            for _ in range(60):
                m = (a + b) / 2
                dm = motor(n2s(m, f), V, f, rotor, rext)[1] * scale - TL(m)
                if (dm > 0) == (prev[1] > 0):
                    a = m
                else:
                    b = m
            out.append(((a + b) / 2, "stable" if prev[1] > 0 else "unstable"))
        prev = (n, d)
    return out


def runup(TL, J, V=VP, rotor="dc", rext=0.0, scale=1.0, n_end=None, dt=1e-3, tmax=60.0, Vfun=None):
    """Quasi-static run-up J dω/dt = Tm − TL. Returns list of (t, n, I, Tm, TL, Erotor_J) until n_end or steady."""
    n_end = n_end if n_end is not None else 0.98 * (op_point(TL, V, 50, rotor, rext, scale) or 0)
    w, t, Er, out = 0.0, 0.0, 0.0, []
    while t < tmax:
        n = w * 60 / (2 * math.pi)
        Vt = Vfun(t, n) if Vfun else V
        I, Tm, _ = motor(n2s(n), Vt, 50, rotor, rext)
        Tm *= scale
        tl = TL(n)
        out.append((t, n, I * (math.sqrt(scale) if scale != 1 else 1), Tm, tl, Er))
        if n >= n_end:
            break
        a = (Tm - tl) / J
        if a <= 0 and n < 1:
            return out, False
        Er += n2s(n) * Tm * (2 * math.pi * 25) * dt   # rotor copper energy = s·Pag
        w += a * dt
        t += dt
    return out, n >= n_end


# ----------------------------------------------------------------------------------------------- dynamics (αβ space vectors)
def _lmat(scale=1.0, rotor="dc"):
    rot = ROTORS[rotor]
    L1s, Lm = MP["X1"] / W50, MP["Xm"] / W50
    if rot["kind"] == "double":
        Lo, Li = rot["Xo"] / W50, rot["Xi"] / W50
        L = np.array([[L1s + Lm, Lm, Lm], [Lm, Lo + Lm, Lm], [Lm, Lm, Li + Lm]]) * scale
        R = np.array([MP["R1"], rot["Ro"], rot["Ri"]]) * scale
    else:
        L2 = rot["X2"] / W50
        L = np.array([[L1s + Lm, Lm], [Lm, L2 + Lm]]) * scale
        R = np.array([MP["R1"], rot["R2"]]) * scale
    return L, R


def dyn(segments, TL, J, rotor="dc", winding=True, max_step=1e-4):
    """Simulate a sequence of supply segments. Physical Δ-winding quantities (impedances ×3) when winding=True.
       segment = (t_end, kind, angle_deg) with kind 'Y' (230.9 V per winding), 'D' (400 V per winding, rotated by angle),
       'O' (open), 'DOL' (Y-equivalent model at 230.9 V, angle = switching angle of phase L1).
       Returns arrays t, iL1 (A), |iL|/√2 (A rms-equivalent), Te (N·m), n (rpm)."""
    from scipy.integrate import solve_ivp
    sc = 3.0 if winding else 1.0
    L, R = _lmat(sc, rotor)
    Li = np.linalg.inv(L)
    m = L.shape[0]
    x = np.zeros(2 * m + 1)
    t0 = 0.0
    T_, IA, IR, TE, NR = [], [], [], [], []
    p = 2
    for (t1, kind, ang) in segments:
        a = math.radians(ang)
        if kind == "Y":
            vf = lambda t, a=a: VP * math.sqrt(2) * np.exp(1j * (W50 * t + a)); Rx = 0.0
        elif kind == "D":
            vf = lambda t, a=a: 400 * math.sqrt(2) * np.exp(1j * (W50 * t + a)); Rx = 0.0
        elif kind == "DOL":
            vf = lambda t, a=a: VP * math.sqrt(2) * np.exp(1j * (W50 * t + a)); Rx = 0.0
        else:
            vf = lambda t: 0j; Rx = 3e4

        def f(t, y):
            psi = y[0:2 * m:2] + 1j * y[1:2 * m:2]
            i = Li @ psi
            wr = p * y[-1]
            d = np.empty(2 * m + 1)
            ds = vf(t) - (R[0] + Rx) * i[0]
            d[0], d[1] = ds.real, ds.imag
            for k in range(1, m):
                dr = -R[k] * i[k] + 1j * wr * psi[k]
                d[2 * k], d[2 * k + 1] = dr.real, dr.imag
            Te = 1.5 * p * (psi[0].real * i[0].imag - psi[0].imag * i[0].real)
            d[-1] = (Te - TL(y[-1] * 30 / math.pi)) / J
            return d
        sol = solve_ivp(f, (t0, t1), x, method="LSODA", max_step=(2e-5 if kind == "O" else max_step), rtol=1e-6, atol=1e-8)
        for k in range(len(sol.t)):
            y = sol.y[:, k]
            psi = y[0:2 * m:2] + 1j * y[1:2 * m:2]
            i = (Li @ psi)[0]
            Te = 1.5 * p * (psi[0].real * i.imag - psi[0].imag * i.real)
            if kind == "D":
                iv = math.sqrt(3) * i * np.exp(-1j * a) * np.exp(1j * math.radians(0))  # line-current vector
                # line L1 current: A-wiring (+30°) → √3·Re(i e^{-j30}); B-wiring (−30°) → √3·Re(i e^{+j30})
                iv = math.sqrt(3) * i * np.exp(-1j * math.radians(30 if ang > 0 else -30))
            else:
                iv = i
            T_.append(sol.t[k]); IA.append(iv.real); IR.append(abs(iv) / math.sqrt(2)); TE.append(Te); NR.append(y[-1] * 30 / math.pi)
        x = sol.y[:, -1]
        t0 = t1
    return np.array(T_), np.array(IA), np.array(IR), np.array(TE), np.array(NR)


# ----------------------------------------------------------------------------------------------- single-phase motor
SP = dict(V=230.0, R1m=2.2, X1m=2.6, Xm=85.0, R2=3.4, X2=2.4, a=1.15, R1a=11.0, X1a=4.0, P_FE=40.0, P_FW=30.0)
C_START, C_RUN = 150e-6, 20e-6


def _zfb(s):
    Zm = complex(0, SP["Xm"])
    zr = lambda x: Zm * complex(SP["R2"] / x, SP["X2"]) / complex(SP["R2"] / x, SP["X2"] + SP["Xm"])
    return zr(s), zr(2 - s)


def sp_motor(s, C=None):
    """Single-phase motor. C=None → main winding only. Returns dict I (line A), T (N·m), Tf, Tb, Pin."""
    s = min(max(s, 1e-5), 2 - 1e-5)
    ZF, ZB = _zfb(s)
    Zm1 = complex(SP["R1m"], SP["X1m"])
    V = SP["V"]
    ws = 2 * math.pi * 1500 / 60
    if C is None:
        Im = V / (Zm1 + (ZF + ZB) / 2)
        If = Ib = Im / 2
        Iline = Im
    else:
        a = SP["a"]
        Za = (complex(SP["R1a"], SP["X1a"]) + complex(0, -1 / (W50 * C))) / a ** 2
        A = np.array([[Zm1 + (ZF + ZB) / 2, -1j * (ZF - ZB) / 2], [1j * (ZF - ZB) / 2, Za + (ZF + ZB) / 2]])
        Im, Iap = np.linalg.solve(A, np.array([V, V / a]))
        If, Ib = (Im - 1j * Iap) / 2, (Im + 1j * Iap) / 2
        Iline = Im + Iap / a
    Tf = 2 * abs(If) ** 2 * ZF.real / ws
    Tb = 2 * abs(Ib) ** 2 * ZB.real / ws
    return dict(I=abs(Iline), T=Tf - Tb, Tf=Tf, Tb=Tb, Pin=(V * np.conj(Iline)).real)


def _sp_rated(C=None):
    from scipy.optimize import brentq
    sh = lambda s: sp_motor(s, C)["T"] * 2 * math.pi * 1500 * (1 - s) / 60 - SP["P_FW"] - 750
    s = brentq(sh, 0.005, 0.3)
    d = sp_motor(s, C)
    return s, d


SP_SR, _d = _sp_rated()
SP_IN, SP_TN = _d["I"], _d["T"]


# ----------------------------------------------------------------------------------------------- deep-bar skin effect
def deep_bar(h_mm, f2, rho=3.0e-8):
    """Rectangular bar of height h in a slot: returns (delta_mm, Rac/Rdc, Lac/Ldc, J(y) profile 0..h normalised to mean)."""
    mu0 = 4e-7 * math.pi
    d = math.sqrt(2 * rho / (2 * math.pi * f2 * mu0))
    xi = h_mm / 1000 / d
    kr = xi * (math.sinh(2 * xi) + math.sin(2 * xi)) / (math.cosh(2 * xi) - math.cos(2 * xi))
    kx = 3 / (2 * xi) * (math.sinh(2 * xi) - math.sin(2 * xi)) / (math.cosh(2 * xi) - math.cos(2 * xi))
    ys = np.linspace(0, 1, 41)
    kk = (1 + 1j) * xi
    J = np.array([abs(cmath.cosh(kk * y)) for y in ys])     # y = 0 at slot bottom, 1 at air gap
    J = J / J.mean()
    return d * 1000, kr, kx, ys, J


# ----------------------------------------------------------------------------------------------- numbers for the page
if __name__ == "__main__":
    from scipy.optimize import brentq
    print(f"3φ model: In={IN:.2f} A Tn={TN:.2f} N·m pf={PFN:.3f} nN={NN:.0f}")
    d = motor(SR, detail=True)
    Pin = d["Pin"] + P_FE
    Psh = d["Pmi"] - P_FW
    print(f"rated power flow: Pin={Pin:.0f} Pcu1={d['Pcu1']:.0f} Pfe={P_FE:.0f} Pag={d['Pag']:.0f} Pcu2={d['Pcu2']:.0f} Pmi={d['Pmi']:.0f} Pfw={P_FW:.0f} Pshaft={Psh:.0f} eta={Psh / Pin:.4f}")
    Ife = P_FE / (3 * VP)
    I1 = complex(IN * PFN + Ife, -IN * math.sin(math.acos(PFN)))
    print(f"with core loss current: I={abs(I1):.2f} A pf={I1.real / abs(I1):.3f}")
    for r in ("dc", "a", "d"):
        I0, T0, _ = motor(1, rotor=r)
        grid = np.linspace(1, 1499, 2998)
        Ts = [motor(n2s(n), rotor=r)[1] for n in grid]
        k = int(np.argmax(Ts))
        sr = brentq(lambda s: motor(s, rotor=r)[1] - TN, 1e-4, n2s(grid[k]))
        dd = motor(sr, rotor=r, detail=True)
        print(f"rotor {r}: Is/In={I0 / IN:.2f} Ts/Tn={T0 / TN:.2f} Tk/Tn={Ts[k] / TN:.2f} at {grid[k]:.0f} rpm, rated slip={sr * 100:.2f}% n={1500 * (1 - sr):.0f} Pcu2={dd['Pcu2']:.0f} W I={dd['I']:.2f}")
    # wound rotor
    Zth = complex(0, MP["Xm"]) * complex(MP["R1"], MP["X1"]) / complex(MP["R1"], MP["X1"] + MP["Xm"])
    Vth = abs(VP * complex(0, MP["Xm"]) / complex(MP["R1"], MP["X1"] + MP["Xm"]))
    X2 = ROTORS["a"]["X2"]
    Rm = abs(complex(Zth.real, Zth.imag + X2))
    print(f"Thevenin: Vth={Vth:.1f} V Zth={Zth.real:.3f}+j{Zth.imag:.3f}; R2' for Tmax at standstill={Rm:.3f} → Rext'={Rm - ROTORS['a']['R2']:.3f} Ω")
    Tmax = 3 * Vth ** 2 / (2 * (2 * math.pi * 25) * (Zth.real + Rm))
    print(f"Tmax (Kloss/Thevenin) single cage = {Tmax:.1f} N·m = {Tmax / TN:.2f} Tn")
    for rx in (0, 0.5, 1.2, Rm - ROTORS['a']['R2'], 4.0):
        I0, T0, _ = motor(1, rotor="a", rext=rx)
        print(f"   Rext'={rx:.2f}: Ts/Tn={T0 / TN:.2f} Is/In={I0 / IN:.2f}")
    # skin depth
    for f2 in (50, 1.0):
        dmm, kr, kx, _, _ = deep_bar(30, f2)
        print(f"deep bar h=30 mm f2={f2} Hz: delta={dmm:.1f} mm Rac/Rdc={kr:.2f} Lac/Ldc={kx:.2f}")
    # loads: operating points and run-up
    print("--- loads (k=1 at rated speed unless noted)")
    for kind, k in (("quad", 1.0), ("const", 1.0), ("fan", 1.0), ("quad", 0.8), ("const", 0.5)):
        TL = lambda n, kind=kind, k=k: load_T(kind, n, k)
        nop = op_point(TL)
        I, T, pf = motor(n2s(nop))
        J = JM + LOAD_J[kind]
        tr, ok = runup(TL, J)
        t95 = next((x[0] for x in tr if x[1] >= 0.95 * nop), None)
        Er = tr[-1][5]
        print(f"{kind} k={k}: n_op={nop:.1f} s={n2s(nop) * 100:.2f}% I={I:.2f} ({I / IN:.2f} In) T={T / TN:.3f}Tn  J={J:.3f} t95={t95:.2f}s Erotor≈{Er / 1000:.1f} kJ KE={0.5 * J * (2 * math.pi * nop / 60) ** 2 / 1000:.1f} kJ")
    # unstable crossing example: constant 2.5 Tn
    print("constant 2.5 Tn crossings:", all_crossings(lambda n: 2.5 * TN))
    print("constant 2.5 Tn Ts/Tn:", motor(1)[1] / TN)
    # voltage effect, constant torque at Tn
    print("--- voltage, constant load Tn")
    for v in (1.0, 0.95, 0.9, 0.85, 0.8, 0.7):
        nop = op_point(lambda n: TN, VP * v)
        if nop is None:
            print(f"V={v:.2f}: stall"); continue
        dd = motor(n2s(nop), VP * v, detail=True)
        print(f"V={v:.2f}: n={nop:.1f} s={n2s(nop) * 100:.2f}% I={dd['I']:.2f} ({dd['I'] / IN:.3f} In) Pcu1={dd['Pcu1']:.0f} Pcu2={dd['Pcu2']:.0f} Ts={motor(1, VP * v)[1] / TN:.2f}Tn Tk={max(motor(n2s(n), VP * v)[1] for n in range(900, 1499)) / TN:.2f}Tn")
    # star (Y-equivalent voltage VP/√3)
    print("--- star")
    VY = VP / math.sqrt(3)
    print(f"Y: Is={motor(1, VY)[0]:.1f} A ({motor(1, VY)[0] / IN:.2f} In) Ts={motor(1, VY)[1] / TN:.3f} Tn; Tk_Y={max(motor(n2s(n), VY)[1] for n in range(900, 1499)) / TN:.3f} Tn; DOL Is={motor(1)[0]:.1f} A")
    for kind, k in (("quad", 1.0), ("quad", 0.8), ("const", 0.5), ("const", 0.7), ("const", 1.0), ("fan", 1.0)):
        TL = lambda n, kind=kind, k=k: load_T(kind, n, k)
        ny = op_point(TL, VY)
        if ny is None:
            print(f"{kind} k={k}: Y cannot reach a stable point (start? Ts_Y={motor(1, VY)[1] / TN:.2f} vs TL0={TL(0) / TN:.2f})"); continue
        IY = motor(n2s(ny), VY)[0] / math.sqrt(3)   # Y-equivalent model current / √3 = line current in star
        ID = motor(n2s(ny))[0]
        J = JM + LOAD_J[kind]
        tr, ok = runup(TL, J, VY)
        t95 = next((x[0] for x in tr if x[1] >= 0.95 * ny), None)
        print(f"{kind} k={k}: n_Y={ny:.0f} rpm s={n2s(ny) * 100:.1f}% I_Y(line)={motor(n2s(ny), VY)[0]:.1f}?? IY_line={motor(n2s(ny), VY)[0]:.1f} → Δ at that speed I_Δ={ID:.1f} A ({ID / IN:.2f} In) t95_Y={t95}")
    # soft starter equivalent at 3 In
    v3 = 3 * IN / motor(1)[0]
    print(f"soft 3·In at standstill → V={v3 * 100:.1f}% Ts={motor(1, VP * v3)[1] / TN:.3f} Tn")
    for tap in (0.5, 0.65, 0.8):
        I0, T0, _ = motor(1, VP * tap)
        print(f"autotransformer {tap * 100:.0f}%: motor I={I0:.1f} line I={I0 * tap:.1f} ({I0 * tap / IN:.2f} In) Ts={T0 / TN:.2f} Tn")
    # VFD
    for f in (5, 10, 25, 50):
        V = VP * (f / 50) if f >= 10 else VP * (0.1 + 0.9 * f / 50)   # with low-speed boost below 10 Hz
        n_rated_T = None
        I0, T0, _ = motor(1, V, f)
        print(f"VFD f={f} Hz V={V * math.sqrt(3):.0f} V: standstill I={I0 / IN:.2f} In T={T0 / TN:.2f} Tn")
    # single phase
    print(f"--- single-phase: rated s={SP_SR:.4f} n={1500 * (1 - SP_SR):.0f} I={SP_IN:.2f} T={SP_TN:.2f} pf={_d['Pin'] / (230 * SP_IN):.3f} eta={750 / (_d['Pin'] + SP['P_FE']):.3f}")
    for C, lab in ((None, "main only"), (C_START, "cap start 150uF"), (C_RUN, "PSC 20uF"), (C_START + C_RUN, "CSCR 170uF")):
        d0 = sp_motor(1, C)
        print(f"  {lab}: Is={d0['I']:.1f} A ({d0['I'] / SP_IN:.2f} In) Ts={d0['T'] / SP_TN:.2f} Tn")
    s_p, dp = _sp_rated(C_RUN)
    print(f"  PSC rated: s={s_p:.4f} I={dp['I']:.2f} pf={dp['Pin'] / (230 * dp['I']):.3f} eta={750 / (dp['Pin'] + SP['P_FE']):.3f}")
    gm = np.linspace(1, 1499, 1499)
    print("  main-only Tmax/Tn", max(sp_motor(1 - n / 1500)["T"] for n in gm) / SP_TN)
    print("  cap-start T at 75% speed /Tn", sp_motor(0.25, C_START)["T"] / SP_TN, " main-only at 75%", sp_motor(0.25)["T"] / SP_TN)
