import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent))

from src import data_fetcher as fetcher
from src import portfolio as ptf
from src.utils import fmt_eur, fmt_pct

st.set_page_config(
    page_title="Finance Dashboard",
    page_icon="📈",
    layout="wide",
)

st.title("📈 Finance Dashboard")
st.caption("Investissement long terme · Buy & Hold · Value · Growth")
st.divider()

data = ptf.load()
positions = data["positions"]

if not positions:
    st.info("Bienvenue ! Ajoute tes premières positions dans **Mon Portefeuille**.")
    st.page_link("pages/1_Portfolio.py", label="➕ Ajouter une position", icon="💼")
    st.stop()

tickers = tuple(p["ticker"] for p in positions)

with st.spinner("Chargement des cours..."):
    prices = fetcher.get_prices_batch(tickers)
    all_currencies: set = set()
    for p in positions:
        all_currencies.add(p.get("currency", "USD"))
    for _, ccy in prices.values():
        if ccy and ccy != "N/A":
            all_currencies.add(ccy)
    all_currencies.discard("EUR")
    fx_rates = {ccy: fetcher.get_fx_rate(ccy) for ccy in all_currencies}
    fx_rates["EUR"] = 1.0

enriched = ptf.compute_pnl(positions, prices, fx_rates)

if not enriched:
    st.warning("Impossible de récupérer les cours actuellement. Réessaie plus tard.")
    st.stop()

total_value = sum(p["current_value_eur"] for p in enriched)
total_cost = sum(p["cost_basis_eur"] for p in enriched)
total_pnl = total_value - total_cost
total_pnl_pct = (total_pnl / total_cost * 100) if total_cost else 0.0

best = max(enriched, key=lambda p: p["pnl_pct"])
worst = min(enriched, key=lambda p: p["pnl_pct"])

c1, c2, c3, c4 = st.columns(4)
c1.metric("Valeur totale", fmt_eur(total_value))
c2.metric("Coût d'achat", fmt_eur(total_cost))
c3.metric("P&L total", fmt_eur(total_pnl), fmt_pct(total_pnl_pct))
c4.metric("Positions actives", len(enriched))

st.divider()

cb, cw = st.columns(2)
cb.success(f"**Meilleure position** : {best['ticker']} · **{fmt_pct(best['pnl_pct'])}**")
cw.error(f"**À surveiller** : {worst['ticker']} · **{fmt_pct(worst['pnl_pct'])}**")

st.divider()
st.page_link("pages/1_Portfolio.py", label="Voir le portefeuille complet →")
