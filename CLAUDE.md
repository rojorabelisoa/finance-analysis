# Finance Analysis — Suivi du projet

## Statut global

| Phase | Statut |
|---|---|
| 1. Cadrage & décisions (Spring) | ✅ Terminé |
| 2. Structure du projet Spring Boot + React | ⬜ À faire |
| 3. Modèle de données & JPA entities | ⬜ À faire |
| 4. API REST — portfolio (CRUD) | ⬜ À faire |
| 5. API REST — données financières (Yahoo Finance) | ⬜ À faire |
| 6. Authentification Spring Security + JWT | ⬜ À faire |
| 7. Frontend React | ⬜ À faire |
| 8. Analyse fondamentale | ⬜ À faire |
| 9. Screener & alertes | ⬜ À faire |
| 10. Tests & déploiement Render | ⬜ À faire |

---

## Décisions prises

### Application & déploiement
- **Backend** : Spring Boot 3.x (Java 21, Maven)
- **Frontend** : React — build servi directement par Spring Boot (un seul déploiement)
- **Hébergement** : Render (free tier) — un seul service, pas de CORS à gérer
- **Auth** : Spring Security + JWT

### Stack technique
```
Backend (Java 21)
├── Spring Boot 3.x        → framework principal
├── Spring Web             → API REST
├── Spring Security        → authentification + autorisation
├── Spring Data JPA        → accès base de données
├── PostgreSQL             → persistance (Render free tier)
├── jjwt                   → génération et validation des tokens JWT
└── WebClient (WebFlux)    → appels HTTP vers Yahoo Finance

Frontend (React)
├── React 18               → UI
├── React Router           → navigation
├── Axios                  → appels API REST
├── Recharts               → graphiques
└── Tailwind CSS           → styles
```

### Actifs & marchés
- **Actifs** : Actions (stocks) + ETF / Fonds indiciels
- **Marchés** : USA (NYSE/NASDAQ), Europe (Euronext, Xetra), Monde (via ETF)
- **Devise de référence** : EUR — conversion automatique

### Stratégies d'investissement ciblées
- **Indiciel / Buy & Hold** : contributions régulières sur ETF diversifiés
- **Value investing** : P/E bas, décote sur valeur intrinsèque
- **Croissance (Growth)** : forte croissance CA/BPA

### Source de données financières
- **Yahoo Finance (non officiel)** — illimité, gratuit, via WebClient
- Recherche par **ticker** ou **ISIN**
- Taux de change EUR/USD inclus

### Persistance
- **PostgreSQL** sur Render (free tier, 1GB)
- Entités JPA : `User`, `Position`, `Watchlist`

### Fonctionnalités (ordre de priorité)
1. **Auth** — inscription/login, JWT
2. **Suivi de portefeuille** — positions, P&L, allocation
3. **Analyse fondamentale** — P/E, PEG, dividendes, graphique historique
4. **Screener** — filtres value/growth/dividendes
5. **Alertes** — objectifs de prix, rééquilibrage

---

## Architecture cible

```
finance-analysis/
├── pom.xml                          → dépendances Maven
├── Dockerfile                       → build pour Render
├── src/main/
│   ├── java/com/rojorabelisoa/finance/
│   │   ├── FinanceApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java  → Spring Security + JWT filter
│   │   │   └── WebClientConfig.java → Yahoo Finance client
│   │   ├── auth/
│   │   │   ├── AuthController.java  → POST /api/auth/register, /login
│   │   │   ├── AuthService.java
│   │   │   ├── JwtService.java
│   │   │   └── dto/                 → LoginRequest, RegisterRequest, TokenResponse
│   │   ├── portfolio/
│   │   │   ├── PositionController.java  → GET/POST/DELETE /api/positions
│   │   │   ├── PositionService.java
│   │   │   ├── PositionRepository.java
│   │   │   └── Position.java            → entité JPA
│   │   ├── market/
│   │   │   ├── MarketController.java    → GET /api/market/quote/{ticker}
│   │   │   ├── MarketService.java       → appels Yahoo Finance
│   │   │   └── dto/                     → QuoteDto, FundamentalsDto
│   │   └── user/
│   │       ├── User.java                → entité JPA
│   │       └── UserRepository.java
│   └── resources/
│       ├── application.properties       → config DB, JWT secret
│       └── static/                      → build React (généré)
└── frontend/
    ├── package.json
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Portfolio.jsx
    │   │   ├── Analyse.jsx
    │   │   └── Screener.jsx
    │   ├── components/
    │   └── services/
    │       └── api.js                   → Axios + intercepteur JWT
    └── public/
```

---

## Variables d'environnement (Render)

```
DATABASE_URL   = postgresql://user:pass@host/dbname
JWT_SECRET     = une_chaine_aleatoire_longue
```

---

## Questions ouvertes

- [ ] Métriques fondamentales prioritaires à afficher (P/E, PEG, dividende…)
- [ ] Univers du screener (S&P 500, CAC 40, les deux ?)
- [ ] Graphique d'évolution historique du portefeuille sur la page principale ?

---

## Journal des sessions

### 2026-05-17 — Session 3 : Pivot vers Spring Boot + React
- Décision de remplacer Streamlit/Python par Spring Boot 3 (Java 21, Maven) + React
- Source de données : Yahoo Finance non officiel (illimité) au lieu d'Alpha Vantage (25 req/jour)
- Frontend React inclus dans le build Spring Boot (un seul déploiement sur Render)
- Auth : Spring Security + JWT
- BDD : PostgreSQL sur Render free tier
- Architecture complète définie, prête pour implémentation

### 2026-05-16 — Session 2 : Version Streamlit (archivée)
- Prototype fonctionnel déployé sur Streamlit Cloud
- Persistance via GitHub API, recherche par ticker et ISIN
- Remplacé par la version Spring Boot

### 2026-05-16 — Session 1 : Cadrage initial
- Stack Streamlit + Python définie (remplacée en session 3)
