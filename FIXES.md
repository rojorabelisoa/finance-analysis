# Code Review — Plan de correction

> Démarré le 2026-05-19. Mis à jour à chaque fix appliqué.

## Légende
- ⬜ À faire
- 🔄 En cours
- ✅ Terminé

---

## BACKEND

### CRITIQUE (sécurité / bugs bloquants)

| # | Fichier | Problème | Statut |
|---|---------|----------|--------|
| B1 | `pom.xml` | Ajouter `spring-boot-starter-validation` | ✅ |
| B2 | `application.properties` | Supprimer le default du JWT secret (base64 public commité) | ✅ |
| B3 | `SecurityConfig.java` | Retirer `/api/screener/**` et `/api/market/debug/**` de `permitAll()` | ✅ |
| B4 | `JwtAuthFilter.java` | `catch (Exception ignored)` trop large — catcher uniquement `JwtException` + logger | ✅ |
| B5 | `JwtService.java` | NPE possible dans `isTokenValid` si `extractUsername` retourne null | ✅ |
| B6 | `RegisterRequest.java` | Aucune validation — ajouter `@NotBlank @Size @Email` | ✅ |
| B7 | `LoginRequest.java` | Aucune validation — ajouter `@NotBlank` | ✅ |
| B8 | `AuthController.java` | Ajouter `@Valid` sur les `@RequestBody` | ✅ |
| B9 | `GlobalExceptionHandler.java` | Fuite d'info interne (message brut de `SQLException`/NPE) + manque handler `MethodArgumentNotValidException` | ✅ |
| B10 | `ScreenerService.java` | `@Cacheable` sans `unless` — cache une liste vide 30 min sur timeout FMP | ✅ |
| B11 | `AlertService.java` | `@Scheduled` sans `@Transactional` → `LazyInitializationException` silencieuse sur `alert.getUser().getEmail()` | ✅ |

### MAJEUR (performance / correctness)

| # | Fichier | Problème | Statut |
|---|---------|----------|--------|
| B12 | `PositionService.java` | `deletePosition` : `findById` + check Java au lieu de `findByIdAndUser` (atomique) | ✅ |
| B13 | `PositionService.java` | `LocalDate.parse(request.buyDate())` non protégé → 500 si format invalide | ✅ |
| B14 | `MarketController.java` | Endpoint `/api/market/debug/**` retiré de `permitAll()` (requiert auth) | ✅ |
| B15 | `MarketService.java` | `.limit(6)` incohérent avec `&limit=8` dans la requête search | ✅ |
| B16 | `AlertService.java` | Exceptions de `checkAlerts` complètement silencieuses (aucun log) | ✅ |

---

## FRONTEND

### CRITIQUE (bugs cassés / sécurité)

| # | Fichier | Problème | Statut |
|---|---------|----------|--------|
| F1 | `App.jsx` | `PrivateRoute` lit `localStorage` directement → ne se re-render pas après logout | ✅ |
| F2 | `useApi.js` | Intercepteur 401 : boucle infinie sur `/login` + ne dispatch pas `LOGOUT` au contexte | ✅ |
| F3 | `AuthContext.jsx` | Écouter l'événement `finance:logout` déclenché par l'intercepteur | ✅ |
| F4 | `PeaPage.jsx` | `AllocationSection` calcule l'allocation sur le **coût d'achat** au lieu de la valeur de marché + pas de conversion FX | ✅ |
| F5 | `AlertsPage.jsx` | `parseFloat(form.threshold)` → NaN si champ vide (pas de validation avant envoi) | ✅ |

### MAJEUR (performance / UX)

| # | Fichier | Problème | Statut |
|---|---------|----------|--------|
| F6 | `App.jsx` | 5 blocs `<PrivateRoute><Layout/>` quasi-identiques → consolider en route parent | ✅ |
| F7 | `PeaPage.jsx` | `HistoriqueSection` et `AllocationSection` font chacun `GET /positions` indépendamment du `PortfolioContext` | ✅ |
| F8 | `PortfolioPage.jsx` | `enriched` recalculé à chaque render → wrapper en `useMemo` | ✅ |
| F9 | `PeaPage.jsx` | Imports inutilisés (`useCallback`, `Line`, `XAxis` dupliqué) | ✅ |

---

## Progression globale

```
Backend  : 16 / 16 fixes ✅
Frontend :  9 /  9 fixes ✅
Total    : 25 / 25 fixes ✅ — TERMINÉ
```
