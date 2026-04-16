# RHP Ready Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare a report route under RHP, wait until the prepared report screen has mounted and laid out, then dismiss the RHP to avoid a blank reveal on iOS native.

**Architecture:** Keep `goBackUnderRHP` as the state-preparation primitive, but add a small pending-reveal coordinator that tracks the prepared route and dismisses the RHP only after the matching destination screen signals readiness. Wire the first implementation only to report routes so the behavior stays narrow and testable.

**Tech Stack:** TypeScript, React Navigation, react-native-screens, Jest

---

### Task 1: Add a pending reveal coordinator

**Files:**
- Create: `src/libs/Navigation/helpers/pendingPreparedRouteReveal.ts`
- Test: `tests/unit/Navigation/pendingPreparedRouteReveal.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Wire navigation preparation and reveal

**Files:**
- Modify: `src/libs/Navigation/Navigation.ts`
- Modify: `src/libs/actions/Report/index.ts`
- Test: `tests/unit/Navigation/pendingPreparedRouteReveal.test.ts`

- [ ] **Step 1: Write the failing test or extend helper test for timeout/clear behavior**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `goBackUnderRHP` call flow to start pending reveal and remove the immediate dismiss from report action**
- [ ] **Step 4: Run tests to verify they pass**

### Task 3: Emit readiness from ReportScreen

**Files:**
- Modify: `src/pages/inbox/ReportScreen.tsx`
- Modify: `src/libs/Navigation/Navigation.ts`

- [ ] **Step 1: Write the failing test if a small helper is extracted; otherwise proceed with minimal implementation**
- [ ] **Step 2: Emit readiness for the prepared report route after first layout**
- [ ] **Step 3: Verify dismiss happens only when the prepared route matches**

### Task 4: Verification

**Files:**
- Modify: `src/libs/Navigation/Navigation.ts`
- Modify: `src/libs/actions/Report/index.ts`
- Modify: `src/pages/inbox/ReportScreen.tsx`
- Create: `src/libs/Navigation/helpers/pendingPreparedRouteReveal.ts`
- Test: `tests/unit/Navigation/pendingPreparedRouteReveal.test.ts`

- [ ] **Step 1: Run Prettier on changed files**
- [ ] **Step 2: Run ESLint on changed files**
- [ ] **Step 3: Run targeted Jest tests**
