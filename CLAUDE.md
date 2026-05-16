# Finance Analysis — Suivi du projet

## Statut global

| Phase | Statut |
|---|---|
| 1. Cadrage & décisions | ✅ Terminé |
| 2. Architecture & structure du projet | ⬜ À faire |
| 3. Implémentation backend (data, analyse) | ⬜ À faire |
| 4. Interface web (dashboard) | ⬜ À faire |
| 5. Screener & filtres | ⬜ À faire |
| 6. Alertes & rapports | ⬜ À faire |
| 7. Tests & validation | ⬜ À faire |
| 8. Déploiement | ⬜ À faire |

---

## Décisions prises

### Application
- **Type** : Application web (dashboard interactif dans le navigateur)
- **Utilisateurs** : Single user — pas d'authentification complexe requise
- **Stack** : Python (backend + data) · Framework web à définir (Flask ou FastAPI + frontend léger)

### Actifs suivis
- Actions individuelles (stocks)
- ETF / Fonds indiciels

### Marchés géographiques
- USA : NYSE / NASDAQ
- Europe : Euronext, Xetra, etc.
- Monde entier (via ETF MSCI World et assimilés)

### Stratégies d'investissement
- **Indiciel / Buy & Hold** : contributions régulières sur ETF diversifiés, gestion passive
- **Value investing** : actions sous-évaluées, P/E bas, marge de sécurité
- **Croissance (Growth)** : entreprises à forte croissance CA/BPA

### Source de données
- **yfinance (Yahoo Finance)** — gratuit, données différées
- Suffisant pour un horizon long terme (pas de besoin de données temps-réel)

### Fonctionnalités prioritaires (dans l'ordre)
1. **Suivi de portefeuille** — positions, prix d'achat, P&L, allocation par actif/secteur/géo
2. **Analyse fondamentale** — P/E, PEG, EPS growth, dividendes, bilan simplifié
3. **Screener / Filtres** — trouver des actions selon des critères value/growth/dividendes
4. **Alertes & rapports** — objectifs de prix, rééquilibrage, rapport périodique

---

## Questions ouvertes / à décider

- [ ] Framework web : **Flask** (simple, léger) vs **FastAPI + React/HTMX** ?
- [ ] Stockage des données : fichier local (SQLite) vs rien (tout en mémoire/yfinance) ?
- [ ] Format des alertes : email, notification navigateur, ou simple fichier log ?
- [ ] Devise de référence du portefeuille : EUR ou USD ?
- [ ] Fréquence de rafraîchissement des données : à la demande ou automatique (scheduler) ?

---

## Journal des sessions

### 2026-05-16 — Session 1 : Cadrage
- Définition du besoin avec l'utilisateur via questionnaire
- Toutes les décisions de la section ci-dessus ont été arrêtées
- Prochain jalon : définir l'architecture et la structure du projet
