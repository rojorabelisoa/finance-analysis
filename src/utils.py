from __future__ import annotations


def fmt_eur(amount: float | None) -> str:
    if amount is None:
        return "—"
    sign = "-" if amount < 0 else ""
    return f"{sign}{abs(amount):,.2f} €"


def fmt_pct(pct: float | None) -> str:
    if pct is None:
        return "—"
    sign = "+" if pct > 0 else ""
    return f"{sign}{pct:.2f}%"


def fmt_large(amount: float | None) -> str:
    if amount is None:
        return "—"
    v = abs(amount)
    if v >= 1_000_000_000:
        return f"{amount / 1_000_000_000:.1f}B €"
    if v >= 1_000_000:
        return f"{amount / 1_000_000:.1f}M €"
    if v >= 1_000:
        return f"{amount / 1_000:.0f}K €"
    return fmt_eur(amount)
