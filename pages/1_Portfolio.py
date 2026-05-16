from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent))

from src import data_fetcher as fetcher
from src import portfolio as ptf
from src.utils import fmt_eur, fmt_pct

st.set_page_config(page_title="Portefeuille", page_icon="💼", layout="wide")

col_title, col_refresh = st.columns([5, 1])
col_title.title("💼 Mon Portefeuille")
if col_refresh.button("🔄 Rafraîchir", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

# ── Add position ───────────────────────────────────────────────────────────────
data = ptf.load()
positions = data["positions"]

with st.expander("➕ Ajouter une position", expanded=not positions):
    with st.form("add_position", clear_on_submit=True):
        c1, c2 = st.columns(2)
        ticker_in = c1.text_input("Ticker *", placeholder="ex: AAPL, IWDA.AS, MC.PA")
        name_in = c2.text_input("Nom *", placeholder="ex: Apple Inc.")

        c3, c4, c5 = st.columns(3)
        type_in = c3.selectbox("Type", ["stock", "etf"])
        market_in = c4.selectbox("Marché", ["US", "EU", "WORLD"])
        sector_in = c5.text_input("Secteur", placeholder="ex: Technology")

        c6, c7, c8 = st.columns(3)
        shares_in = c6.number_input("Nb d'actions *", min_value=0.001, step=0.001, format="%.3f")
        price_in = c7.number_input("Prix moyen d'achat *", min_value=0.0001, step=0.01, format="%.4f")
        currency_in = c8.selectbox("Devise", ["USD", "EUR", "GBP", "CHF"])

        date_in = st.date_input("Date d'achat", value=date.today())
        notes_in = st.text_area("Notes", height=68)

        if st.form_submit_button("Ajouter", use_container_width=True, type="primary"):
            if not ticker_in.strip() or not name_in.strip() or shares_in <= 0 or price_in <= 0:
                st.error("Les champs * sont obligatoires.")
            else:
                with st.spinner("Enregistrement dans GitHub..."):
                    ptf.add_position(
                        ticker=ticker_in.strip(),
                        name=name_in.strip(),
                        asset_type=type_in,
                        market=market_in,
                        shares=shares_in,
                        avg_price=price_in,
                        currency=currency_in,
                        buy_date=str(date_in),
                        sector=sector_in.strip(),
                        notes=notes_in.strip(),
                    )
                st.success(f"✓ {ticker_in.upper()} ajouté et sauvegardé dans le repo.")
                st.rerun()

# ── Portfolio display ──────────────────────────────────────────────────────────
data = ptf.load()
positions = data["positions"]

if not positions:
    st.info("Aucune position pour l'instant.")
    st.stop()

tickers = tuple(p["ticker"] for p in positions)

with st.spinner("Récupération des cours..."):
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
    st.warning("Impossible de récupérer les cours. Réessaie plus tard.")
    st.stop()

# Metrics
total_value = sum(p["current_value_eur"] for p in enriched)
total_cost = sum(p["cost_basis_eur"] for p in enriched)
total_pnl = total_value - total_cost
total_pnl_pct = (total_pnl / total_cost * 100) if total_cost else 0.0

m1, m2, m3, m4 = st.columns(4)
m1.metric("Valeur actuelle", fmt_eur(total_value))
m2.metric("Coût d'achat", fmt_eur(total_cost))
m3.metric("P&L", fmt_eur(total_pnl), fmt_pct(total_pnl_pct))
m4.metric("Positions", len(enriched))

st.divider()

# Positions table
df = pd.DataFrame([{
    "Ticker": p["ticker"],
    "Nom": p["name"],
    "Type": p["type"],
    "Marché": p["market"],
    "Actions": p["shares"],
    "Prix achat (€)": round(p["avg_price"] * fx_rates.get(p.get("currency", "USD"), 1.0), 4),
    "Prix actuel (€)": round(p["current_price_eur"], 4),
    "Valeur (€)": round(p["current_value_eur"], 2),
    "P&L (€)": round(p["pnl_eur"], 2),
    "P&L (%)": round(p["pnl_pct"], 2),
} for p in enriched])

st.dataframe(
    df,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Valeur (€)": st.column_config.NumberColumn(format="%.2f €"),
        "Prix achat (€)": st.column_config.NumberColumn(format="%.4f €"),
        "Prix actuel (€)": st.column_config.NumberColumn(format="%.4f €"),
        "P&L (€)": st.column_config.NumberColumn(format="%.2f €"),
        "P&L (%)": st.column_config.NumberColumn(format="%.2f%%"),
    },
)

# Charts
st.divider()
col1, col2 = st.columns(2)

with col1:
    by_type = df.groupby("Type")["Valeur (€)"].sum().reset_index()
    fig1 = px.pie(by_type, names="Type", values="Valeur (€)", title="Par type d'actif", hole=0.45)
    fig1.update_layout(margin=dict(t=40, b=0, l=0, r=0))
    st.plotly_chart(fig1, use_container_width=True)

with col2:
    by_market = df.groupby("Marché")["Valeur (€)"].sum().reset_index()
    fig2 = px.pie(by_market, names="Marché", values="Valeur (€)", title="Par marché", hole=0.45)
    fig2.update_layout(margin=dict(t=40, b=0, l=0, r=0))
    st.plotly_chart(fig2, use_container_width=True)

# Remove position
st.divider()
with st.expander("🗑️ Supprimer une position"):
    options = {f"{p['ticker']} — {p['name']}": p["id"] for p in positions}
    selected = st.selectbox("Position à supprimer", list(options.keys()))
    if st.button("Supprimer", type="primary"):
        with st.spinner("Suppression dans GitHub..."):
            ptf.remove_position(options[selected])
        st.success("Position supprimée.")
        st.rerun()
