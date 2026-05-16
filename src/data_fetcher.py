from __future__ import annotations

import re

import pandas as pd
import streamlit as st
import yfinance as yf


def is_isin(query: str) -> bool:
    return bool(re.match(r"^[A-Z]{2}[A-Z0-9]{10}$", query.strip().upper()))


@st.cache_data(ttl=3600)
def isin_to_ticker(isin: str) -> str | None:
    try:
        results = yf.Search(isin.upper(), max_results=1, enable_fuzzy_query=False)
        quotes = results.quotes
        if quotes:
            return quotes[0].get("symbol")
    except Exception:
        pass
    return None


@st.cache_data(ttl=300)
def get_current_price(ticker: str) -> tuple:
    try:
        info = yf.Ticker(ticker).fast_info
        return float(info.last_price), str(info.currency)
    except Exception:
        return None, "N/A"


@st.cache_data(ttl=3600)
def get_fx_rate(from_ccy: str, to_ccy: str = "EUR") -> float:
    if from_ccy == to_ccy:
        return 1.0
    try:
        rate = yf.Ticker(f"{from_ccy}{to_ccy}=X").fast_info.last_price
        return float(rate) if rate and rate > 0 else 1.0
    except Exception:
        return 1.0


@st.cache_data(ttl=300)
def get_prices_batch(tickers: tuple) -> dict:
    return {t: get_current_price(t) for t in tickers}


@st.cache_data(ttl=3600)
def get_fundamentals(ticker: str) -> dict:
    try:
        info = yf.Ticker(ticker).info
        return {
            "name": info.get("longName", ticker),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "eps": info.get("trailingEps"),
            "eps_growth": info.get("earningsGrowth"),
            "revenue_growth": info.get("revenueGrowth"),
            "dividend_yield": info.get("dividendYield"),
            "market_cap": info.get("marketCap"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "currency": info.get("currency", "USD"),
            "quote_type": info.get("quoteType", "EQUITY"),
            "description": info.get("longBusinessSummary", ""),
        }
    except Exception:
        return {"name": ticker, "currency": "USD"}


@st.cache_data(ttl=86400)
def get_history(ticker: str, period: str = "1y") -> pd.DataFrame:
    try:
        return yf.Ticker(ticker).history(period=period)
    except Exception:
        return pd.DataFrame()
