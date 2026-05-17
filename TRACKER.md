# Tracker — Finance Dashboard (Spring Boot + React)

## Backend

### Phase 1 — Foundation
- [x] `pom.xml`
- [x] `FinanceApplication.java`
- [x] `application.properties`
- [x] `Dockerfile`

### Phase 2 — Data Model
- [x] `user/User.java`
- [x] `user/UserRepository.java`
- [x] `portfolio/Position.java`
- [x] `portfolio/PositionRepository.java`

### Phase 3 — Auth (Spring Security + JWT)
- [x] `auth/JwtService.java`
- [x] `auth/JwtAuthFilter.java`
- [x] `shared/config/SecurityConfig.java`
- [x] `auth/AuthService.java`
- [x] `auth/AuthController.java`
- [x] `auth/dto/LoginRequest.java`
- [x] `auth/dto/RegisterRequest.java`
- [x] `auth/dto/TokenResponse.java`

### Phase 4 — Portfolio API
- [x] `portfolio/PositionService.java`
- [x] `portfolio/PositionController.java`
- [x] `portfolio/dto/PositionRequest.java`
- [x] `portfolio/dto/PositionResponse.java`

### Phase 5 — Market Data (Yahoo Finance)
- [x] `shared/config/WebClientConfig.java`
- [x] `market/MarketService.java`
- [x] `market/MarketController.java`
- [x] `market/dto/QuoteDto.java`
- [x] `market/dto/FundamentalsDto.java`

### Phase 6 — Shared
- [x] `shared/exception/AppException.java`
- [x] `shared/exception/GlobalExceptionHandler.java`
- [x] `shared/SpaController.java`

---

## Frontend

### Phase 7 — Setup
- [x] `frontend/package.json`
- [x] `frontend/vite.config.js`
- [x] `frontend/index.html`
- [x] `frontend/tailwind.config.js`
- [x] `frontend/src/main.jsx`
- [x] `frontend/src/App.jsx`

### Phase 8 — Auth
- [x] `context/AuthContext.jsx`
- [x] `features/auth/services/authService.js`
- [x] `features/auth/components/LoginForm.jsx`
- [x] `features/auth/components/RegisterForm.jsx`
- [x] `pages/LoginPage.jsx`

### Phase 9 — Portfolio
- [x] `context/PortfolioContext.jsx`
- [x] `features/portfolio/services/portfolioService.js`
- [x] `features/portfolio/components/PositionTable.jsx`
- [x] `features/portfolio/components/AddPositionForm.jsx`
- [x] `features/portfolio/components/AllocationChart.jsx`
- [x] `pages/PortfolioPage.jsx`

### Phase 10 — Market / Analyse
- [x] `features/market/services/marketService.js`
- [x] `features/market/components/QuoteCard.jsx`
- [x] `features/market/components/FundamentalsPanel.jsx`
- [x] `pages/AnalysePage.jsx`

### Phase 11 — Shared UI
- [x] `shared/hooks/useApi.js`
- [x] `shared/components/Navbar.jsx`
- [x] `shared/components/Card.jsx`
- [x] `shared/components/Badge.jsx`

---

## Déploiement

### Phase 12 — Render
- [ ] PostgreSQL créé sur Render
- [ ] Variables d'environnement configurées
- [ ] Service Web déployé et opérationnel
- [ ] Tests end-to-end
