# Finance Analysis — Suivi du projet

## Statut global

| Phase | Statut |
|---|---|
| 1. Cadrage & décisions | ✅ Terminé |
| 2. Architecture & structure du projet | ✅ Décidée |
| 3. Implémentation — modèle de données & portfolio | ⬜ À faire |
| 4. Implémentation — analyse fondamentale | ⬜ À faire |
| 5. Implémentation — screener | ⬜ À faire |
| 6. Implémentation — alertes & rapports | ⬜ À faire |
| 7. Tests & validation | ⬜ À faire |
| 8. Déploiement sur Streamlit Cloud | ⬜ À faire |

---

## Décisions prises

### Application & déploiement
- **Type** : Application web dashboard
- **Framework** : [Streamlit](https://streamlit.io/) — UI Python-native, pas de JS requis
- **Hébergement** : Streamlit Community Cloud (gratuit, déploiement depuis GitHub)
- **Utilisateurs** : Single user — pas d'authentification

### Stack technique
```
Python
├── streamlit          → UI / dashboard
├── yfinance           → données financières (gratuit, Yahoo Finance)
├── pandas             → manipulation des données
├── plotly             → graphiques interactifs
└── json / csv         → persistance du portefeuille (fichiers dans le repo)
```

### Actifs & marchés
- **Actifs** : Actions (stocks) + ETF / Fonds indiciels
- **Marchés** : USA (NYSE/NASDAQ), Europe (Euronext, Xetra), Monde (via ETF)
- **Devise de référence** : EUR — les montants USD/autres sont convertis automatiquement

### Stratégies d'investissement ciblées
- **Indiciel / Buy & Hold** : contributions régulières sur ETF diversifiés
- **Value investing** : P/E bas, décote sur valeur intrinsèque
- **Croissance (Growth)** : forte croissance CA/BPA

### Source de données
- **yfinance** — gratuit, données différées (suffisant pour long terme)
- Taux de change EUR/USD récupérés via yfinance également

### Persistance des données
- Fichiers **JSON** dans le repo (`data/portfolio.json`, `data/watchlist.json`)
- Modifiés via l'interface Streamlit
- Versionnés avec git (historique des modifications natif)

### Fonctionnalités (ordre de priorité)
1. **Suivi de portefeuille** — positions, prix d'achat, P&L, allocation par actif/secteur/géo
2. **Analyse fondamentale** — P/E, PEG, EPS growth, dividendes, bilan simplifié
3. **Screener / Filtres** — critères value/growth/dividendes sur un univers configurable
4. **Alertes & rapports** — objectifs de prix et rééquilibrage affichés dans l'UI (pas d'email)

### Refresh des données
- **À la demande** — bouton "Rafraîchir" dans l'UI (pas de scheduler, compatible free tier)

---

## Architecture cible

```
finance-analysis/
├── app.py                  → point d'entrée Streamlit (navigation entre pages)
├── requirements.txt        → dépendances Python
├── .streamlit/
│   └── config.toml         → thème et config Streamlit
├── data/
│   ├── portfolio.json      → positions du portefeuille (persisté)
│   └── watchlist.json      → liste de surveillance (persisté)
├── pages/
│   ├── 1_Portfolio.py      → vue portefeuille (P&L, allocation, historique)
│   ├── 2_Analyse.py        → analyse fondamentale d'un titre
│   ├── 3_Screener.py       → filtres et découverte d'actions
│   └── 4_Alertes.py        → objectifs de prix et rééquilibrage
└── src/
    ├── data_fetcher.py     → wrapper yfinance (cours, fondamentaux, FX)
    ├── portfolio.py        → lecture/écriture portfolio.json, calculs P&L
    ├── screener.py         → logique de filtrage
    └── utils.py            → conversions devise, formatage
```

---

## Questions ouvertes

_Toutes les questions structurantes sont résolues. Les prochaines décisions seront prises pendant l'implémentation._

- [ ] Format exact de `portfolio.json` (à définir en phase 3)
- [ ] Liste des métriques fondamentales à afficher en priorité
- [ ] Univers par défaut du screener (S&P 500 ? CAC 40 ? Les deux ?)

---

## Journal des sessions

### 2026-05-16 — Session 1 : Cadrage & architecture
- Définition complète du besoin via questionnaire
- Stack retenue : Streamlit + yfinance + Pandas + Plotly
- Déploiement : Streamlit Community Cloud (gratuit, depuis GitHub)
- Persistance : JSON dans le repo, versionné avec git
- Devise : EUR (conversion auto USD→EUR via yfinance)
- Architecture du projet définie (arborescence complète)
- Prochain jalon : implémenter la structure de base et le suivi de portefeuille
