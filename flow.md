# Application Execution Flow & Call Graphs (`FLOW.md`)

This document details how execution travels between files, functions, context providers, and calculation modules in **Furniture Costing Pro**. It outlines the exact call sequences, data transformations, security guards, and component rendering trees.

---

## 1. Application Initialization & Context Cascade

```
index.html 
   │
   ▼
src/main.tsx
   │
   ▼
src/App.tsx 
   │
   ▼
[Provider Wrapping Cascade]
 ├── ErrorBoundary (Catches unhandled runtime exceptions)
 ├── AuthProvider (Manages Firebase Auth state & appUser profiles)
 ├── PlatformSettingsProvider (Global platform configurations)
 ├── TenantProvider (Loads active tenant profile & subscription status)
 └── StoreProvider (Loads Firestore collections: costings, rate_master, wood_rates, settings)
      │
      ▼
   HashRouter
      │
      ▼
   AppRoutes (Route matching & view rendering)
```

### Execution Steps:
1. `main.tsx` mounts `App.tsx` into DOM container `#root`.
2. `AuthProvider` initializes `onAuthStateChanged` listener with Firebase Auth.
3. Upon authentication, `TenantProvider` fetches the user's `tenantId` record from the `tenants` collection.
4. `StoreProvider` binds `onSnapshot` listeners to tenant-scoped Firestore collections (`costings`, `rate_master`, `wood_rates`, `settings`).
5. `AppRoutes` evaluates current location hash against defined routes.

---

## 2. Authentication & Route Protection Flow

```
User Action (Login) ──► LoginView.tsx
                             │
                             ▼
                   useAuth().login(email, password)
                             │
                             ▼
                   AuthService.loginUser()
                             │
                             ▼
                   Firebase Auth & Firestore lookup (`users` collection)
                             │
                             ▼
                   Set `appUser` state in AuthContext
                             │
                             ▼
                   Trigger ProtectedRoute Evaluation
```

### ProtectedRoute Decision Guard Flow:
```
Navigation Request to Protected Path
   │
   ├─► Is user authenticated? ──[NO]──► Redirect to `/login`
   │        │
   │       [YES]
   │        ▼
   ├─► Is tenant status EXPIRED? ──[YES]──► Redirect to `/suspended`
   │        │
   │       [NO]
   │        ▼
   ├─► Is `requireSuperAdmin` set & user != SUPERADMIN? ──[YES]──► Redirect to `/unauthorized`
   │        │
   │       [NO]
   │        ▼
   ├─► Does user lack requiredPermission? ──[YES]──► Redirect to `/unauthorized`
   │        │
   │       [NO]
   │        ▼
   └─► Render Target Route inside Layout (<Outlet />)
```

---

## 3. Manufacturing Costing Engine Execution Flow

When a costing is created, updated, or previewed, execution flows directly through the pure calculation engine in `/src/engine.ts`.

```
CostingEditor.tsx / CostingsList.tsx / RoughEstimator.tsx
   │
   ▼
calculateProjectCost(project, rateItems, woodTypes, settings)  <-- /src/engine.ts
   │
   ├──► 1. calculateSheetComponentCost()
   │      │
   │      ├── Convert (L × W) mm² ──► sq.ft using `SQ_FT_DIVISOR` (92903.04)
   │      ├── Multiply by matching sheet rate from `rateItems`
   │      ├── Evaluate active edges (top, bottom, left, right)
   │      └── Convert perimeter mm ──► rmt and multiply by edgeband rate
   │
   ├──► 2. calculateSolidWoodComponentCost()
   │      │
   │      ├── Convert (L × W × T) mm³ ──► cu.ft using `CU_FT_DIVISOR` (28316846.592)
   │      ├── Query `woodTypes` array for length slab matching `minFt` <= L_ft <= `maxFt`
   │      └── Multiply cubic volume by matched slab rate
   │
   ├──► 3. calculateHardwareCost()
   │      └── Sum component quantity × unit rate from `rateItems`
   │
   ├──► 4. calculateFinishingCost() & calculateLabourCost()
   │      └── Sum process hours / area × unit labour & finishing rates
   │
   └──► 5. Commercial Cost Breakdown Aggregation
          │
          ├── Subtotal Direct Material Cost
          ├── + Wastage Allowance (`wastagePercent`)
          ├── + Factory Overhead (`overheadPercent`)
          ├── + Profit Margin (`profitPercent`)
          ├── - Volume Discount (if subtotal > `volumeThreshold`)
          ├── - Cash Discount (`cashDiscountPercent`)
          ├── + GST (`gstPercent`)
          └── Return `CostBreakdown` object (Unit Cost, Total Cost, Tax Amount, Margin)
```

---

## 4. Layout Rendering & Responsive Event Flow

```
Layout.tsx
 ├── Header.tsx (Top branding, user menu, tenant badge, notification drawer)
 ├── Sidebar.tsx (Desktop view navigation drawer, `hidden md:flex`)
 ├── BottomNav.tsx (Mobile fixed tab bar & slide-up drawer, `md:hidden`)
 └── <main className="custom-scrollbar"> ──► Active View (<Outlet />)
```

### Mobile Slide-Up Drawer Interaction Flow (`BottomNav.tsx`):
```
User taps "More" button on Mobile Bottom Bar
   │
   ▼
Toggle `moreOpen` state in `BottomNav.tsx`
   │
   ├─► `moreOpen === true`:
   │     Apply CSS: `translate-y-0 opacity-100 pointer-events-auto visible`
   │     Drawer slides up from bottom-0, backdrop active.
   │
   └─► `moreOpen === false`:
         Apply CSS: `translate-y-full opacity-0 pointer-events-none invisible`
         Drawer moves off-screen, completely unmounting interaction layer.
         Bottom navigation buttons receive 100% tap events without clipping.
```

---

## 5. Data Mutation, Firestore Sync & Audit Logging Flow

When an administrative or operational change occurs (e.g., updating a rate item or editing an employee):

```
User Input in UI Component (e.g., RateMaster.tsx)
   │
   ▼
StoreContext Function Call (e.g., `updateRate(rateId, newRate)`)
   │
   ├──► 1. Immediate In-Memory State Update (React setRates) ──► Instant UI re-render
   │
   ├──► 2. Asynchronous Firestore Write
   │      └── `db.collection('rate_master').doc(rateId).update(...)`
   │
   └──► 3. Audit Trail Event Dispatch
          └── `AuditService.logAuditEvent({`
                `tenantId: user.tenantId,`
                `userId: user.id,`
                `action: 'RATE_UPDATE',`
                `description: 'Updated Plywood 18mm rate to ₹120/sq.ft'`
              `})`
                 │
                 ▼
          Writes to `audit_logs` collection ──► Real-time update in `SuperAdminAudit.tsx`
```

---

## 6. Current Modification Map & File Touchpoints

The table below documents recent modifications, the execution path affected, and safety verification status:

| File Modified | Function / Scope Modified | Affected Execution Path | Rationale & Verification |
| :--- | :--- | :--- | :--- |
| `/src/components/BottomNav.tsx` | Slide-Up Drawer Container (`moreOpen` sheet) | Mobile Navigation & Gesture Layer | Fixed layout offset (`bottom: 3.5rem`) that caused off-screen header to intercept touch events on bottom tabs. Re-anchored to `bottom-0` with strict `pointer-events-none invisible` when closed. Verified via build & lint. |
| `/src/index.css` | Universal Scrollbar Styles (`::-webkit-scrollbar`, `scrollbar-width`) | Application-Wide Scroll Viewports | Replaced thick 16px default browser scrollbars with sleek 5px translucent pills across all sidebars, tables, and modal dialogs. Verified across webkit and firefox engines. |
| `/src/components/Layout.tsx` | Main Content Wrapper (`<div className="custom-scrollbar">`) | Main Page Scroll Area | Added `custom-scrollbar` class to ensure smooth minimal scrolling on primary viewport. Verified layout integration. |
| `/decision.md` | Complete ADR Architecture Log | Documentation & System Memory | Created exhaustive Architecture Decision Records (ADR-001 through ADR-022) covering multi-tenancy, engine math, security rules, and UI patterns. |
| `/flow.md` | System Execution Flow & Call Graphs | Developer & AI Execution Insight | Documents exact call graphs, context cascades, engine formulas, and event pathways to eliminate architectural gaps and prevent regression bugs. |

---

*Last updated: August 2026 | System Engineering Board*
