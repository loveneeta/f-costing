# Architecture & Engineering Decision Records (`DECISION.md`)

This document serves as the canonical register of all architectural, technical, security, domain modeling, and user experience decisions made in **Furniture Costing Pro** (Enterprise Multi-Tenant Furniture Costing & Manufacturing Engine).

Each decision is structured in the standard Architecture Decision Record (ADR) format: **Context & Problem Statement**, **Decision Taken**, and **Technical Rationale**.

---

## Table of Contents

- [1. System Architecture & Core Infrastructure](#1-system-architecture--core-infrastructure)
  - [ADR-001: Logical Multi-Tenancy & Tenant Data Isolation](#adr-001-logical-multi-tenancy--tenant-data-isolation)
  - [ADR-002: Dual-Layer State Management Architecture](#adr-002-dual-layer-state-management-architecture)
  - [ADR-003: Deterministic Centralized Calculation Engine](#adr-003-deterministic-centralized-calculation-engine)
  - [ADR-004: Role-Based Access Control (RBAC) & Permission Scope](#adr-004-role-based-access-control-rbac--permission-scope)
  - [ADR-005: Client-Side Route Protection & Guard Hierarchy](#adr-005-client-side-route-protection--guard-hierarchy)
- [2. Domain Modeling & Manufacturing Logic](#2-domain-modeling--manufacturing-logic)
  - [ADR-006: Dimensional Unit Standardization & Conversion Constants](#adr-006-dimensional-unit-standardization--conversion-constants)
  - [ADR-007: Sheet Material & Edgeband Dual-Calculation Model](#adr-007-sheet-material--edgeband-dual-calculation-model)
  - [ADR-008: Solid Wood Length-Based Rate Slab Matrix](#adr-008-solid-wood-length-based-rate-slab-matrix)
  - [ADR-009: Costing Rate Snapshots & Historical Lock Strategy](#adr-009-costing-rate-snapshots--historical-lock-strategy)
  - [ADR-010: Dynamic Overhead, Wastage, Cash Discount, & Volume Slabs](#adr-010-dynamic-overhead-wastage-cash-discount--volume-slabs)
- [3. Security, Authentication & Audit Compliance](#3-security-authentication--audit-compliance)
  - [ADR-011: Firebase Firestore Declarative Security Rules](#adr-011-firebase-firestore-declarative-security-rules)
  - [ADR-012: Universal Audit Trail Logging Engine](#adr-012-universal-audit-trail-logging-engine)
  - [ADR-013: Employee Invitation & Verification Workflow](#adr-013-employee-invitation--verification-workflow)
  - [ADR-014: Subscription Lifecycle & Account Suspension Enforcement](#adr-014-subscription-lifecycle--account-suspension-enforcement)
- [4. User Interface, Responsive Design & Mobile Experience](#4-user-interface-responsive-design--mobile-experience)
  - [ADR-015: Dual-Viewport Responsive Layout Pattern](#adr-015-dual-viewport-responsive-layout-pattern)
  - [ADR-016: Mobile Slide-Up Navigation Sheet & Interaction Isolation](#adr-016-mobile-slide-up-navigation-sheet--interaction-isolation)
  - [ADR-017: Universal Ultra-Minimal Custom Scrollbar System](#adr-017-universal-ultra-minimal-custom-scrollbar-system)
  - [ADR-018: Customer Quotation PDF & Print Visibility Toggles](#adr-018-customer-quotation-pdf--print-visibility-toggles)
- [5. Operational Tools & SuperAdmin Capabilities](#5-operational-tools--superadmin-capabilities)
  - [ADR-019: Bulk Material Rate Updates with Inflation Factor](#adr-019-bulk-material-rate-updates-with-inflation-factor)
  - [ADR-020: Quick Rough Estimator for On-Site Client Quotes](#adr-020-quick-rough-estimator-for-on-site-client-quotes)
  - [ADR-021: Costing Templates & One-Click Project Cloning](#adr-021-costing-templates--one-click-project-cloning)
  - [ADR-022: SuperAdmin Tenant Terminal & Cross-Tenant Oversight](#adr-022-superadmin-tenant-terminal--cross-tenant-oversight)

---

## 1. System Architecture & Core Infrastructure

### ADR-001: Logical Multi-Tenancy & Tenant Data Isolation
- **Status:** Implemented
- **Context:** Furniture Costing Pro serves multiple independent furniture manufacturers, interior contractors, and woodwork factories. Exposing proprietary material rate masters or client quotations across organizations would breach confidentiality.
- **Decision:** Implemented logical multi-tenancy where every root document (`costings`, `rate_master`, `users`, `settings`, `audit_logs`) includes a required `tenantId` field. Data access is enforced both in client queries (`where('tenantId', '==', user.tenantId)`) and via database security rules (`resource.data.tenantId == request.auth.token.tenantId`).
- **Rationale:**
  - Avoids high infrastructure costs and operational complexity associated with multi-database-per-tenant architectures.
  - Guarantees defense-in-depth: even if frontend code omits a filter, Firestore rules reject unauthorized cross-tenant requests.

---

### ADR-002: Dual-Layer State Management Architecture
- **Status:** Implemented
- **Context:** The costing engine allows rapid input changes (e.g., tweaking panel dimensions, changing hardware quantities). Direct network persistence on every keystroke causes latency, UI stutter, and excessive Firestore write costs.
- **Decision:** Architected a dual-layer state system:
  1. **In-Memory Store Context (`StoreContext.tsx`):** Holds live React state for active costings, rate master items, and settings for instant UI responsiveness.
  2. **Asynchronous Persistence Layer (`AuthService` / Firestore):** Debounced and event-triggered sync to Firestore upon explicit user saves or key workflow steps.
- **Rationale:**
  - Delivers a zero-lag interactive editing experience.
  - Minimizes database billing and prevents partial or broken document writes during rapid typing.

---

### ADR-003: Deterministic Centralized Calculation Engine
- **Status:** Implemented
- **Context:** Furniture costing involves multi-tier formulas: raw sheet area, edgeband meters, solid wood cubic volume, hardware sums, labor costs, factory overhead, wastage margins, volume discounts, profit margins, and GST. Repeating this logic across views causes calculation drifts.
- **Decision:** Built a pure, deterministic calculation engine in `/src/engine.ts` (`calculateProjectCost()`). All views (Costing Builder, Quotation Preview, PDF Exporter, Analytics Dashboard, SuperAdmin View) pass project models into this engine.
- **Rationale:**
  - Guarantees 100% mathematical consistency across all screens, exports, and reports.
  - Isolated pure function allows unit testing without UI or database dependencies.

---

### ADR-004: Role-Based Access Control (RBAC) & Permission Scope
- **Status:** Implemented
- **Context:** Organizations require distinct permissions for factory operators, costing managers, tenant admins, and global platform superadmins.
- **Decision:** Standardized on four explicit roles (`SUPERADMIN`, `ADMIN`, `MANAGER`, `OPERATOR`):
  - **SUPERADMIN:** Platform governance, tenant provisioning, subscription lifecycle management, and global audit logs.
  - **ADMIN / MANAGER:** Full tenant management, material rate master edits, company pricing settings, and employee invitations.
  - **OPERATOR:** Read and write access to costings and templates within their tenant; restricted from changing base rate masters or margin settings.
- **Rationale:**
  - Protects core financial parameters (e.g., profit margins, wastage percentages) from accidental modification by operators.
  - Isolates global system management from company operational workflows.

---

### ADR-005: Client-Side Route Protection & Guard Hierarchy
- **Status:** Implemented
- **Context:** Unauthenticated users or suspended tenant accounts must not access operational views. Operators attempting to open SuperAdmin views must be blocked gracefully.
- **Decision:** Created a modular route wrapper hierarchy in `/src/components/ProtectedRoute.tsx`, `/src/views/SuspendedView.tsx`, and `/src/views/UnauthorizedView.tsx`:
  - `ProtectedRoute` checks authentication token validity, tenant suspension status, and user roles before rendering children.
  - Unauthenticated requests redirect to `/login`.
  - Suspended tenants render `SuspendedView` with account renewal instructions.
  - Role mismatches display `UnauthorizedView`.
- **Rationale:**
  - Prevents unauthorized view rendering and avoids flash-of-unauthorized-content issues.
  - Provides clear recovery pathways for expired or suspended enterprise subscriptions.

---

## 2. Domain Modeling & Manufacturing Logic

### ADR-006: Dimensional Unit Standardization & Conversion Constants
- **Status:** Implemented
- **Context:** Woodworking drawings use millimeters (`mm`), centimeters (`cm`), inches (`in`), or feet (`ft`), whereas raw materials are billed per square foot (`sq.ft`) or cubic foot (`cu.ft`).
- **Decision:** Defined standard dimensional conversion constants in `/src/engine.ts`:
  - `SQ_FT_DIVISOR = 92903.04` ($1 \text{ sq.ft} = 92903.04 \text{ mm}^2$)
  - `CU_FT_DIVISOR = 28316846.592` ($1 \text{ cu.ft} = 28,316,846.592 \text{ mm}^3$)
  - `UNIT_MULTIPLIERS = { mm: 1, cm: 10, inch: 25.4, ft: 304.8, m: 1000 }`
- **Rationale:**
  - Allows users to enter panel dimensions in their native project unit while standardizing internal cost formulas to exact physical areas and volumes.

---

### ADR-007: Sheet Material & Edgeband Dual-Calculation Model
- **Status:** Implemented
- **Context:** Plywood, MDF, and veneer panels require two distinct cost calculations per panel: the board surface area (`sq.ft`) and the perimeters selected for edgebanding (`running meters / rmt`).
- **Decision:** Structured `SheetComponent` to track length, width, quantity, base board rate ID, edgeband flags (`edgeTop`, `edgeBottom`, `edgeLeft`, `edgeRight`), and edgeband rate ID. The engine computes surface area cost and perimeter edgebanding cost independently.
- **Rationale:**
  - Accurately captures high-value PVC/ABS/veneer edgeband consumption, which is a major hidden cost in modern modular furniture manufacturing.

---

### ADR-008: Solid Wood Length-Based Rate Slab Matrix
- **Status:** Implemented
- **Context:** Solid wood (Teak, Sheesham, Oak, Walnut) pricing varies non-linearly with timber section length (e.g., 3ft to 5ft planks cost significantly less per cu.ft than 8ft+ defect-free logs).
- **Decision:** Modeled `WoodType` with dynamic `WoodRange[]` slabs (`minFt`, `maxFt`, `rate`). The calculation engine evaluates timber component length, selects the matching slab rate, and computes total cubic feet volume.
- **Rationale:**
  - Eliminates under-costing errors on long-span solid wood furniture frames and doors.

---

### ADR-009: Costing Rate Snapshots & Historical Lock Strategy
- **Status:** Implemented
- **Context:** When material prices change in the Rate Master (e.g., plywood price increases by 8%), approved historical client quotations must NOT recalculate automatically, as that would invalidate agreed customer quotes.
- **Decision:** Added `ratesSnapshot`, `woodTypesSnapshot`, `pricingSnapshot`, and `isPricingLocked` to `Project`. When a costing is saved or approved, the application takes a complete freeze-frame snapshot of all applicable material rates.
- **Rationale:**
  - Preserves historical quote integrity while allowing current material Rate Masters to be updated freely.
  - Option provided to explicitly recalculate using live rates when revising a quote.

---

### ADR-010: Dynamic Overhead, Wastage, Cash Discount, & Volume Slabs
- **Status:** Implemented
- **Context:** Profitability depends on factoring factory overheads, cutting wastage, cash discounts, and volume price breaks into the final quotation.
- **Decision:** Embedded configurable pricing settings into tenant settings:
  - `wastagePercent`: Applied to board, wood, and finishing materials.
  - `overheadPercent`: Factory operational overhead.
  - `profitPercent`: Target profit margin.
  - `cashDiscountPercent` & `validityDays`: Terms for early payment.
  - `volumeThreshold` & `volumeDiscountPercent`: Automatic price break triggers for large project values.
- **Rationale:**
  - Automates commercial quote adjustments without manual calculator errors.

---

## 3. Security, Authentication & Audit Compliance

### ADR-011: Firebase Firestore Declarative Security Rules
- **Status:** Implemented
- **Context:** Direct client-side Firestore access requires database-enforced permissions to prevent data tampering, unauthorized role elevation, or unauthorized reads.
- **Decision:** Authored strict rules in `firestore.rules` using helper functions:
  ```
  function isAuthenticated() { return request.auth != null; }
  function isSuperAdmin() { return isAuthenticated() && request.auth.token.role == 'SUPERADMIN'; }
  function belongsToTenant(tenantId) { return isAuthenticated() && request.auth.token.tenantId == tenantId; }
  ```
- **Rationale:**
  - Ensures data security at the database layer, satisfying SOC2/enterprise compliance standards.

---

### ADR-012: Universal Audit Trail Logging Engine
- **Status:** Implemented
- **Context:** Enterprise clients require full audit visibility into who modified rate masters, created costings, invited users, or changed subscription plans.
- **Decision:** Created `AuditService.ts` to automatically record immutable log entries (`timestamp`, `userId`, `userEmail`, `tenantId`, `action`, `description`, `ipAddress`, `metadata`) into the `audit_logs` collection.
- **Rationale:**
  - Guarantees accountability and provides administrative traceability for security and operational events.

---

### ADR-013: Employee Invitation & Verification Workflow
- **Status:** Implemented
- **Context:** Adding employees to an organization requires verifying their email address and assigning proper roles without exposing tenant admin credentials.
- **Decision:** Implemented an invitation token workflow (`EmployeeModal.tsx` & `AcceptInvitation.tsx`). Admin generates an invitation link containing an encrypted/hashed token. New employees register/login using the link to join the tenant automatically.
- **Rationale:**
  - Eliminates manual account creation and credential sharing.

---

### ADR-014: Subscription Lifecycle & Account Suspension Enforcement
- **Status:** Implemented
- **Context:** Multi-tenant SaaS platforms must handle trial periods, plan upgrades, subscription renewals, and automatic suspension upon expiry.
- **Decision:** Maintained a `subscriptions` collection storing `planId`, `status` (`ACTIVE`, `EXPIRED`, `PENDING_RENEWAL`), `startDate`, and `renewalDate`. When `status === 'EXPIRED'`, the application route guard restricts tenant users to `SuspendedView`.
- **Rationale:**
  - Automates SaaS monetization and subscription access control without risking data loss for expired accounts.

---

## 4. User Interface, Responsive Design & Mobile Experience

### ADR-015: Dual-Viewport Responsive Layout Pattern
- **Status:** Implemented
- **Context:** Factory floor supervisors view costings on smartphones, while estimators work on desktop multi-monitors. Standard tables clip heavily on small screens.
- **Decision:** Designed dual layout patterns for data views:
  - Desktop: Dense, sortable HTML tables (`hidden md:block`).
  - Mobile: Scannable, touch-friendly stacked cards (`block md:hidden`).
- **Rationale:**
  - Delivers optimal data presentation across both desktop workstation screens and mobile devices.

---

### ADR-016: Mobile Slide-Up Navigation Sheet & Interaction Isolation
- **Status:** Implemented
- **Context:** On mobile viewports, the "More" slide-up drawer left an offset header covering the bottom navigation bar when closed, blocking user taps on primary bottom tabs.
- **Decision:** Re-architected `/src/components/BottomNav.tsx` to anchor the sheet to `bottom-0` with state-controlled visibility utilities:
  - Closed: `pointer-events-none invisible opacity-0 translate-y-full`
  - Open: `pointer-events-auto visible opacity-100 translate-y-0`
- **Rationale:**
  - Resolves touch clipping issues and ensures 100% reliable tab navigation.

---

### ADR-017: Universal Ultra-Minimal Custom Scrollbar System
- **Status:** Implemented
- **Context:** Default browser scrollbars are bulky (16px+), cluttering complex sidebars, tables, and modal dialogs.
- **Decision:** Added global CSS in `/src/index.css` using `scrollbar-width: thin` and `::-webkit-scrollbar` rules:
  - Width/Height: `5px`
  - Track: `transparent`
  - Thumb: `rgba(148, 163, 184, 0.35)` with rounded pills (`border-radius: 9999px`) and smooth hover feedback.
- **Rationale:**
  - Provides a clean, modern aesthetic across all desktop and mobile browsers.

---

### ADR-018: Customer Quotation PDF & Print Visibility Toggles
- **Status:** Implemented
- **Context:** Quotation prints need official branding (Logo, Address, GSTIN, Bank details), but users must be able to hide internal breakdown notes or bank details when issuing preliminary estimates.
- **Decision:** Added print customization toggles (`hideBankDetails`, `hideNotes`, `hideTerms`) in Settings and Costing Editor print preview modes.
- **Rationale:**
  - Empowers users to customize document outputs for different client presentation needs.

---

## 5. Operational Tools & SuperAdmin Capabilities

### ADR-019: Bulk Material Rate Updates with Inflation Factor
- **Status:** Implemented
- **Context:** Raw material price inflation (e.g., a 5% supplier price increase across all board materials) required tedious line-by-line manual edits in the Rate Master.
- **Decision:** Built `UpdatePricingModal.tsx` allowing administrators to apply percentage-based or flat-rate price adjustments across specific material categories in one action.
- **Rationale:**
  - Saves hours of manual data entry and reduces human error during price updates.

---

### ADR-020: Quick Rough Estimator for On-Site Client Quotes
- **Status:** Implemented
- **Context:** Sales representatives meeting clients on-site require rapid approximate estimates before creating itemized component-by-component costings.
- **Decision:** Created `RoughEstimator.tsx` enabling quick square-footage and unit-count costing models based on preset room and furniture categories.
- **Rationale:**
  - Accelerates lead qualification and sales turnaround during initial client discussions.

---

### ADR-021: Costing Templates & One-Click Project Cloning
- **Status:** Implemented
- **Context:** Manufacturers repeatedly produce standard furniture designs (e.g., 3-door wardrobes, executive desks, modular kitchens).
- **Decision:** Implemented `TemplatesList.tsx` and `TemplateSelectorModal.tsx` allowing projects to be marked as reusable templates (`isTemplate: true`). Users can instantiate a new costing from any template with one click.
- **Rationale:**
  - Drastically reduces quote generation time for standard catalog items.

---

### ADR-022: SuperAdmin Tenant Terminal & Cross-Tenant Oversight
- **Status:** Implemented
- **Context:** Platform owners require a centralized command center to oversee tenant accounts, monitor system health, inspect audit logs, and manage subscription plans.
- **Decision:** Built `SuperAdminDashboard.tsx`, `SuperAdminSubscriptions.tsx`, `SuperAdminAudit.tsx`, and `SuperAdminSettings.tsx` accessible exclusively to `SUPERADMIN` roles.
- **Rationale:**
  - Provides centralized platform administration without exposing internal operational tools to tenant accounts.

---
*Last updated: August 2026 | Furniture Costing Pro Architecture Board*
