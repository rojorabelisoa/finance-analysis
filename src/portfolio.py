from __future__ import annotations

import base64
import json
import uuid
from pathlib import Path

import requests

_DATA_DIR = Path(__file__).parent.parent / "data"
_PORTFOLIO_FILE = _DATA_DIR / "portfolio.json"
_EMPTY: dict = {"positions": [], "settings": {"base_currency": "EUR"}}


def _secrets() -> dict:
    try:
        import streamlit as st
        return st.secrets  # type: ignore[return-value]
    except Exception:
        return {}


def _check_secrets() -> None:
    if not _secrets().get("GITHUB_TOKEN"):
        try:
            import streamlit as st
            st.error(
                "**Configuration manquante.** Ajoute tes secrets dans Streamlit Cloud :\n\n"
                "App Settings → Secrets → colle ceci :\n"
                "```toml\n"
                "GITHUB_TOKEN  = \"ghp_ton_token\"\n"
                "GITHUB_REPO   = \"rojorabelisoa/finance-analysis\"\n"
                "GITHUB_BRANCH = \"feature/stock-investment-project-setup-TQjkI\"\n"
                "```"
            )
            st.stop()
        except ImportError:
            raise RuntimeError("GITHUB_TOKEN manquant dans les secrets.")


def _headers() -> dict:
    return {
        "Authorization": f"token {_secrets()['GITHUB_TOKEN']}",
        "Accept": "application/vnd.github.v3+json",
    }


def _api_url() -> str:
    repo = _secrets().get("GITHUB_REPO", "rojorabelisoa/finance-analysis")
    return f"https://api.github.com/repos/{repo}/contents/data/portfolio.json"


def _branch() -> str:
    return str(_secrets().get("GITHUB_BRANCH", "main"))


def _load_github() -> tuple[dict, str]:
    resp = requests.get(
        _api_url(),
        headers=_headers(),
        params={"ref": _branch()},
        timeout=10,
    )
    if resp.status_code == 404:
        return _EMPTY.copy(), ""
    resp.raise_for_status()
    body = resp.json()
    data = json.loads(base64.b64decode(body["content"]).decode())
    return data, body["sha"]


def _save_github(data: dict, message: str) -> None:
    _, sha = _load_github()
    payload: dict = {
        "message": message,
        "content": base64.b64encode(
            json.dumps(data, indent=2, ensure_ascii=False).encode()
        ).decode(),
        "branch": _branch(),
    }
    if sha:
        payload["sha"] = sha
    resp = requests.put(_api_url(), headers=_headers(), json=payload, timeout=10)
    if not resp.ok:
        try:
            import streamlit as st
            detail = resp.json().get("message", resp.text)
            st.error(
                f"Erreur GitHub API ({resp.status_code}) : **{detail}**\n\n"
                f"Vérifie dans Streamlit Cloud → Settings → Secrets :\n"
                f"- `GITHUB_TOKEN` a bien le scope `public_repo`\n"
                f"- `GITHUB_BRANCH` = `feature/stock-investment-project-setup-TQjkI`\n"
                f"- `GITHUB_REPO` = `rojorabelisoa/finance-analysis`"
            )
            st.stop()
        except ImportError:
            pass
    resp.raise_for_status()


def load() -> dict:
    _check_secrets()
    data, _ = _load_github()
    return data


def save(data: dict, message: str = "chore: mise à jour du portefeuille") -> None:
    _save_github(data, message)


def add_position(
    ticker: str,
    name: str,
    asset_type: str,
    market: str,
    shares: float,
    avg_price: float,
    currency: str,
    buy_date: str,
    sector: str = "",
    notes: str = "",
) -> None:
    data = load()
    data["positions"].append({
        "id": str(uuid.uuid4()),
        "ticker": ticker.upper(),
        "name": name,
        "type": asset_type,
        "market": market,
        "sector": sector,
        "shares": shares,
        "avg_price": avg_price,
        "currency": currency,
        "buy_date": buy_date,
        "notes": notes,
    })
    save(data, f"feat: ajout {ticker.upper()}")


def remove_position(position_id: str) -> None:
    data = load()
    removed = next((p for p in data["positions"] if p["id"] == position_id), None)
    data["positions"] = [p for p in data["positions"] if p["id"] != position_id]
    label = removed["ticker"] if removed else "position"
    save(data, f"feat: suppression {label}")


def compute_pnl(positions: list, prices: dict, fx_rates: dict) -> list:
    result = []
    for pos in positions:
        ticker = pos["ticker"]
        if ticker not in prices:
            continue
        current_price, price_ccy = prices[ticker]
        if current_price is None:
            continue
        fx_now = fx_rates.get(price_ccy, 1.0)
        fx_buy = fx_rates.get(pos.get("currency", "USD"), 1.0)
        shares = pos["shares"]
        current_value_eur = current_price * shares * fx_now
        cost_basis_eur = pos["avg_price"] * shares * fx_buy
        pnl_eur = current_value_eur - cost_basis_eur
        pnl_pct = (pnl_eur / cost_basis_eur * 100) if cost_basis_eur else 0.0
        result.append({
            **pos,
            "current_price": current_price,
            "current_price_eur": current_price * fx_now,
            "current_value_eur": current_value_eur,
            "cost_basis_eur": cost_basis_eur,
            "pnl_eur": pnl_eur,
            "pnl_pct": pnl_pct,
        })
    return result
