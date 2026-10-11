"""PRD v3 §13 기준값(golden) 생성기.

사용: python tools/golden.py  →  tests/golden/golden.json
엔진 테스트는 이 파일과 절대오차 1e-10 이내로 대조한다.
"""
import json
import math
from pathlib import Path

import numpy as np
from scipy.special import xlogy
from scipy.stats import binom, chi2, hypergeom, norm, poisson, t as tdist

OUT = Path(__file__).resolve().parent.parent / "tests" / "golden" / "golden.json"


def crit_right(n, p0, a):
    for c in range(n + 2):
        if binom.sf(c - 1, n, p0) <= a:
            return c
    raise AssertionError


def loglam(xs, n, p0):
    xs = np.asarray(xs, dtype=float)
    th = xs / n
    return xlogy(xs, p0) + xlogy(n - xs, 1 - p0) - xlogy(xs, th) - xlogy(n - xs, 1 - th)


def lrt_rule(n, p0, a):
    xs = np.arange(n + 1)
    ll = loglam(xs, n, p0)
    f0 = binom.pmf(xs, n, p0)
    best = np.zeros(n + 1, dtype=bool)
    for k in sorted(set(ll.tolist())):
        s = ll <= k + 1e-9 * max(1, abs(k))
        if f0[s].sum() <= a:
            best = s
    return [int(x) for x in xs[best]], float(f0[best].sum())


def lrt_p(x, n, p0):
    xs = np.arange(n + 1)
    ll = loglam(xs, n, p0)
    l0 = loglam([x], n, p0)[0]
    return float(binom.pmf(xs, n, p0)[ll <= l0 + 1e-9 * max(1, abs(l0))].sum())


def wilks_size(n, p0, a=0.05):
    xs = np.arange(n + 1)
    w = -2 * loglam(xs, n, p0)
    return float(binom.pmf(xs, n, p0)[w > chi2.ppf(1 - a, 1)].sum())


g = {}

# ---- E 시리즈 (동전) ----
c = crit_right(20, 0.5, 0.05)
gamma = (0.05 - binom.sf(c - 1, 20, 0.5)) / binom.pmf(c - 1, 20, 0.5)
g["E01"] = {"n": 20, "theta0": 0.5, "x": 14, "pRight": binom.sf(13, 20, 0.5), "pTwoTail": 2 * binom.sf(13, 20, 0.5)}
g["E02"] = {"n": 20, "theta0": 0.5, "alpha": 0.05, "c": c, "size": binom.sf(c - 1, 20, 0.5),
            "sizeWider": binom.sf(c - 2, 20, 0.5)}
g["E03"] = {"power07": binom.sf(c - 1, 20, 0.7), "beta07": binom.cdf(c - 1, 20, 0.7),
            "power055": binom.sf(c - 1, 20, 0.55), "power09": binom.sf(c - 1, 20, 0.9)}
g["E04"] = []
for n in (20, 50, 100):
    cc = crit_right(n, 0.5, 0.05)
    g["E04"].append({"n": n, "c": cc, "size": binom.sf(cc - 1, n, 0.5), "power07": binom.sf(cc - 1, n, 0.7)})
g["E05"] = {"gamma": gamma, "boundary": c - 1, "randPower07": binom.sf(c - 1, 20, 0.7) + gamma * binom.pmf(c - 1, 20, 0.7),
            "leftSize": binom.cdf(5, 20, 0.5), "leftPower07": binom.cdf(5, 20, 0.7)}
R, s = lrt_rule(20, 0.5, 0.05)
g["E06"] = {"reject": R, "size": s, "pLrt14": lrt_p(14, 20, 0.5), "pLrt0": lrt_p(0, 20, 0.5)}
g["E07"] = []
for n in (13, 14, 15, 18, 20):
    cc = crit_right(n, 0.5, 0.05)
    g["E07"].append({"n": n, "c": cc, "size": binom.sf(cc - 1, n, 0.5), "power06": binom.sf(cc - 1, n, 0.6)})
g["E08"] = {"n": 20, "theta0": 0.2, "x": 8, "pLrt": lrt_p(8, 20, 0.2),
            "pTwoTail": min(1.0, 2 * min(binom.cdf(8, 20, 0.2), binom.sf(7, 20, 0.2)))}
g["E09"] = {"h0": binom.sf(c - 1, 20, 0.5), "alt07": binom.sf(c - 1, 20, 0.7)}
g["E10"] = {"leftBoundary": 6, "leftGamma": (0.05 - binom.cdf(5, 20, 0.5)) / binom.pmf(6, 20, 0.5),
            "rightRulePower03": binom.sf(c - 1, 20, 0.3)}
g["E11"] = {"n": 82, "x": 82, "p": 0.5 ** 82}

# ---- T 시리즈 (교재·워크북) ----
g["T01"] = {"pmf70": [int(round(hypergeom.pmf(k, 8, 4, 4) * 70)) for k in range(5)], "p4": 1 / 70, "p3": 17 / 70}
g["T02"] = {"c2": {"alpha": norm.sf(2), "beta": norm.cdf(-1), "power": norm.sf(-1)},
            "c3": {"alpha": norm.sf(3), "beta": norm.cdf(0)}}
g["T03"] = {"alpha": poisson.cdf(1, 3), "power": poisson.cdf(1, 1)}
g["T04"] = {"z05": norm.ppf(0.95)}
g["T05"] = {"order": [0, 3, 4, 2, 1], "phi": [1, 0, 0, 0.5, 0], "size": 0.15, "power": 0.30}
g["T06"] = {"R23alpha": 0.3, "R23beta": 0.4, "mpReject": [3], "mpPower": 0.3}
g["T07"] = {"alphaNum": 6, "betaNum": 8, "den": 27}
g["T08"] = {"alpha": 3 / 16, "beta": 131 / 243, "mpPower": 32 / 243, "betaCheck": binom.cdf(3, 5, 2 / 3)}
g["T09"] = {"size": 0.05, "z025": norm.ppf(0.975)}
g["T10"] = {"tWithZcrit": 2 * tdist.sf(norm.ppf(0.975), 9)}
g["T11"] = {"n1": norm.sf(norm.ppf(0.95) - 1), "n10": norm.sf(norm.ppf(0.95) - math.sqrt(10))}
g["T12"] = {"chi2crit": chi2.ppf(0.95, 1)}

# ---- W 시리즈 (Wilks) ----
g["W"] = [{"n": n, "theta0": p0, "size": wilks_size(n, p0)}
          for n, p0 in [(10, 0.5), (20, 0.5), (50, 0.5), (20, 0.1), (200, 0.1)]]

# ---- 엔진 단위 검증용 ----
g["pmf"] = [{"n": n, "theta": th, "values": binom.pmf(np.arange(n + 1), n, th).tolist()}
            for n, th in [(5, 0.3), (20, 0.5), (500, 0.37)]]
g["normal"] = {"cdf": [[z, norm.cdf(z)] for z in (-8, -5, -2.5, -1, 0, 0.3, 1.96, 4, 7)],
               "ppf": [[p, norm.ppf(p)] for p in (1e-10, 1e-4, 0.025, 0.1, 0.5, 0.8, 0.975, 0.9999)]}
# ---- χ²검정 (교재 7.4) ----
from scipy.stats import chisquare, chi2_contingency, power_divergence
g["chi2dist"] = {
    "sf": [[x, k, chi2.sf(x, k)] for x, k in [(0.47, 3), (3.2, 1), (4.0, 2), (11.43, 1), (20.0, 10), (0.01, 4), (50, 30), (100, 3)]],
    "pdf": [[x, k, chi2.pdf(x, k)] for x, k in [(0.5, 1), (1.0, 2), (3.0, 3), (7.5, 6)]],
    "ppf95": [[k, chi2.ppf(0.95, k)] for k in (1, 2, 3, 4, 6, 9, 16, 24)],
}
_m = np.array([315, 101, 108, 32]); _e = _m.sum() * np.array([9, 3, 3, 1]) / 16
g["X_mendel"] = {"X2": chisquare(_m, _e).statistic, "p": chisquare(_m, _e).pvalue,
                 "G": power_divergence(_m, _e, lambda_="log-likelihood").statistic,
                 "pG": power_divergence(_m, _e, lambda_="log-likelihood").pvalue}
g["X_coinK2"] = {"X2": chisquare([14, 6], [10, 10]).statistic, "p": chisquare([14, 6], [10, 10]).pvalue}
g["X_small"] = {"X2": chisquare([1, 5, 3, 2, 4], [3] * 5).statistic, "p": chisquare([1, 5, 3, 2, 4], [3] * 5).pvalue}
_t = np.array([[20, 30, 25], [30, 20, 25]])
_r = chi2_contingency(_t, correction=False)
g["X_2x3"] = {"X2": _r.statistic, "p": _r.pvalue, "df": int(_r.dof), "G": chi2_contingency(_t, correction=False, lambda_="log-likelihood").statistic, "E": _r.expected_freq.tolist()}
_r2 = chi2_contingency(np.array([[30, 10], [15, 25]]), correction=False)
g["X_2x2"] = {"X2": _r2.statistic, "p": _r2.pvalue}

# 기대도수가 작은 적합도의 정확한 크기 (다항 전수 계산)
import itertools, math
from scipy.stats import multinomial
def _gof_exact(n, p0, obs):
    K = len(p0); E = [n * p for p in p0]; crit = chi2.ppf(0.95, K - 1)
    x2o = sum((o - e) ** 2 / e for o, e in zip(obs, E))
    sx = sg = pe = 0.0
    for c in itertools.combinations(range(n + K - 1), K - 1):
        prev = -1; o = []
        for x in c:
            o.append(x - prev - 1); prev = x
        o.append(n + K - 1 - prev - 1)
        pr = multinomial.pmf(o, n, p0)
        x2 = sum((v - e) ** 2 / e for v, e in zip(o, E))
        gg = 2 * sum(v * math.log(v / e) for v, e in zip(o, E) if v > 0)
        if x2 > crit: sx += pr
        if gg > crit: sg += pr
        if x2 >= x2o - 1e-9: pe += pr
    return {"sizeX2": sx, "sizeG": sg, "pX2": pe}
g["X_small_exact"] = _gof_exact(15, [0.2] * 5, [1, 5, 3, 2, 4])
g["X_coinK2_exact"] = _gof_exact(20, [0.5, 0.5], [14, 6])

# ---- 신뢰구간과 검정의 쌍대성 (교재 8.6~8.7) ----
from scipy.stats import beta as _beta
def _cp(x, n, a=0.05):
    lo = 0.0 if x == 0 else _beta.ppf(a / 2, x, n - x + 1)
    hi = 1.0 if x == n else _beta.ppf(1 - a / 2, x + 1, n - x)
    return [lo, hi]
def _wilson(x, n, a=0.05):
    z = norm.ppf(1 - a / 2); ph = x / n; d = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / d; h = z * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return [c - h, c + h]
def _wald(x, n, a=0.05):
    z = norm.ppf(1 - a / 2); ph = x / n; h = z * math.sqrt(ph * (1 - ph) / n)
    return [ph - h, ph + h]
def _cover(n, th, f, a=0.05):
    return float(sum(binom.pmf(x, n, th) for x in range(n + 1) if f(x, n, a)[0] <= th <= f(x, n, a)[1]))
from scipy.special import betainc as _betainc
g["betainc"] = [[a, b, x, float(_betainc(a, b, x))] for a, b, x in [(14, 7, 0.5), (0.5, 0.5, 0.3), (2, 3, 0.9), (50, 60, 0.45), (1, 20, 0.01), (300, 200, 0.62), (4.5, 0.5, 0.95)]]
g["CI"] = {
    "cp14": _cp(14, 20), "wilson14": _wilson(14, 20), "wald14": _wald(14, 20),
    "cp0": _cp(0, 20), "cp20": _cp(20, 20),
    "ex88": _wald(280, 400),
    "normal": [0.6 - norm.ppf(0.975) / math.sqrt(10), 0.6 + norm.ppf(0.975) / math.sqrt(10)],
    "cover": {m: {str(t): _cover(20, t, f) for t in (0.5, 0.1, 0.3)} for m, f in (("cp", _cp), ("wilson", _wilson), ("wald", _wald))},
}

# ---- t검정 (교재 예 7.7, 7.8, 프로그램 7.2) ----
from scipy.stats import ttest_ind_from_stats
_tt = lambda xb, s_, n, mu0: (xb - mu0) / (s_ / math.sqrt(n))
_t1 = _tt(0.6, 1.2, 10, 0.0)
_p2 = ttest_ind_from_stats(5.2, 1.5, 12, 4.1, 2.0, 15, equal_var=True)
_w2 = ttest_ind_from_stats(5.2, 1.5, 12, 4.1, 2.0, 15, equal_var=False)
_v1, _v2 = 1.5 ** 2 / 12, 2.0 ** 2 / 15
g["T"] = {
    "sf": [[x, v, tdist.sf(x, v)] for x, v in [(1.96, 9), (2.0, 4), (0.5, 1), (3.5, 30), (1.0, 2.5), (6.0, 15), (1.7, 23.4)]],
    "pdf": [[x, v, tdist.pdf(x, v)] for x, v in [(0, 9), (1.5, 4), (2.2, 30)]],
    "ppf975": [[v, tdist.ppf(0.975, v)] for v in (1, 4, 9, 29, 99)],
    "zcritSize": [[v, 2 * tdist.sf(norm.ppf(0.975), v)] for v in (4, 9, 29, 99)],
    "one": {"t": _t1, "p": 2 * tdist.sf(abs(_t1), 9), "ci": [0.6 - tdist.ppf(0.975, 9) * 1.2 / math.sqrt(10), 0.6 + tdist.ppf(0.975, 9) * 1.2 / math.sqrt(10)], "m2logL": 10 * math.log(1 + _t1 ** 2 / 9)},
    "two": {"t": float(_p2.statistic), "p": float(_p2.pvalue), "df": 25,
            "welchT": float(_w2.statistic), "welchP": float(_w2.pvalue), "welchDf": (_v1 + _v2) ** 2 / (_v1 ** 2 / 11 + _v2 ** 2 / 14)},
}

# ---- 오용 체험 (PRD F18) ----
def _two_tail_bounds(n, p0, a):
    f = binom.pmf(np.arange(n + 1), n, p0)
    lo = -1; hi = n + 1
    for x in range(n + 1):
        if min(1.0, 2 * min(binom.cdf(x, n, p0), binom.sf(x - 1, n, p0))) <= a:
            if x <= n * p0: lo = x
            elif hi == n + 1: hi = x
    return lo, hi
def _seq_size(theta, p0, looks, a):
    nmax = max(looks); alive = np.zeros(nmax + 1); alive[0] = 1.0; stop = 0.0; looks = set(looks)
    for n in range(1, nmax + 1):
        new = np.zeros(nmax + 1); new[1:n + 1] += alive[0:n] * theta; new[0:n] += alive[0:n] * (1 - theta); alive = new
        if n in looks:
            lo, hi = _two_tail_bounds(n, p0, a)
            if lo >= 0: stop += alive[:lo + 1].sum(); alive[:lo + 1] = 0
            if hi <= n: stop += alive[hi:n + 1].sum(); alive[hi:n + 1] = 0
    return float(stop)
_looks = list(range(10, 101, 10))
g["SEQ"] = {
    "single100": _seq_size(0.5, 0.5, [100], 0.05),
    "looks10_100": _seq_size(0.5, 0.5, _looks, 0.05),
    "looks10_100_bonf": _seq_size(0.5, 0.5, _looks, 0.005),
    "every_1_100": _seq_size(0.5, 0.5, list(range(1, 101)), 0.05),
    "power07": _seq_size(0.7, 0.5, _looks, 0.05),
    "bounds20": _two_tail_bounds(20, 0.5, 0.05),
}
g["MULTI"] = {"fwer20": 1 - 0.95 ** 20, "fwerBonf20": 1 - (1 - 0.05 / 20) ** 20, "bhFdr": {"m": 20, "m0": 15, "fdr": 15 / 20 * 0.05}}

# ---- 포아송·정규 분산 (교재 예 7.3, 7.5, PRD F17) ----
_lam0 = 10 * 0.3
_g = (0.05 - poisson.cdf(0, _lam0)) / poisson.pmf(1, _lam0)
g["POIS"] = {
    "alpha": poisson.cdf(1, 3), "power": poisson.cdf(1, 1),
    "p_t1": poisson.cdf(1, 3), "p_t6_right": poisson.sf(5, 3),
    "np05_gamma": _g, "np05_power": poisson.cdf(0, 1) + _g * poisson.pmf(1, 1),
    "c05_left": int(max(c for c in range(20) if poisson.cdf(c, 3) <= 0.05)) if poisson.cdf(0, 3) <= 0.05 else -1,
}
_c = chi2.ppf(0.95, 5)
g["NVAR"] = {
    "crit": _c, "power2": chi2.sf(_c / 2, 5), "power4": chi2.sf(_c / 4, 5),
    "critLow": chi2.ppf(0.05, 5), "powerLowHalf": chi2.cdf(chi2.ppf(0.05, 5) / 0.5, 5),
    "p_obs": chi2.sf(9.0, 5),
}

g["sampleSize"] = {"d05oneSided80": ((norm.ppf(0.95) + norm.ppf(0.8)) / 0.5) ** 2}


def tolist(o):
    if isinstance(o, dict):
        return {k: tolist(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [tolist(v) for v in o]
    if isinstance(o, (np.floating, np.integer)):
        return o.item()
    return o


OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(tolist(g), ensure_ascii=False, indent=1), encoding="utf-8")
print("wrote", OUT)
