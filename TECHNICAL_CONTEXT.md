# 🏗️ Lifeguard CRM v2.0 — Master Technical Documentation

> **Context for AI/LLM:** This document contains the complete state of the migration project from a PHP Monolith to a React/Supabase SPA. Use this as the "Source of Truth" when starting a new session.
> **Last Update:** 2026-01-08 (Foundation Ready, Core Business Logic Pending)

---

## 1. 📋 Project Overview

**Goal:** Migration of a legacy Lifeguard Tracker system to a modern Realtime CRM.
**Current Status:** Foundation (Auth, Settings, Basic Tables) is solid. Now moving to **Critical Business Logic implementation**.

### 🛠 Tech Stack
* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4.
* **Backend:** Supabase (PostgreSQL, Auth, RLS).
* **UI Library:** Vuexy-like components (Glassmorphism), Recharts.
* **State:** Context API (`Auth`, `Theme`, `Settings`).

---

## 2. 🗄️ Database Schema (Key Tables)

* **`users`**: Profiles (`role`, `base_hourly_rate`, `contract_number`, `current_month_points`).
* **`posts`**: Locations (`name`, `geo_lat`, `geo_lon`).
* **`shifts`**: Work logs (`start_time`, `end_time`, `rounded_work_hours`, `points`).
* **`report_incidents`**: Critical situation logs.
* **`lifeguard_shift_points`**: Detailed history of bonuses/penalties.
* **`academy_*`**: Tables for training functionality (`candidates`, `groups`, `attendance`, `tests`).
* **`beach_analytics_logs`**: Historical visitor data (Analytics).

---

## 3. 🧩 Modules & Features Status

### ✅ Phase 1: Foundation & Basic Tools (COMPLETED)
* **Auth:** Login, Protected Routes, Session Persistence (F5 fix).
* **Settings:** Theme toggle, Profile view, Debug Mode.
* **User Management:** List users, simple search/sort.
* **Basic Analytics:** Visitor stats (`beach_analytics_logs`) with Charts (Heatmap, Trends).
* **Shift History (Basic):** List of shifts, manual points assignment.

### 🚧 Phase 2: Critical Admin Modules (TOP PRIORITY - TODO)

These features must be implemented BEFORE moving to the Scanner/Lifeguard interface.

#### 1. 💰 Finance & Payroll (`/admin/payroll`)
* **Logic:**
    * Calculate Salary = (`rounded_work_hours` * `base_hourly_rate`) + Points Value.
    * Handle Tax logic (Net/Gross calculation).
    * Export Salary Report to Excel.
* **UI:** Table with calculated totals per lifeguard per month.

#### 2. 🚨 Reports & Incidents (`/admin/reports`)
* **Data Source:** `report_incidents` + `shift_reports`.
* **Features:**
    * CRUD for Incident Reports (create/view/edit).
    * **Critical Analytics:** Charts showing incident types (First Aid, Rescues) vs Time/Location.
* **Goal:** Digitalize the paper incident logs.

#### 3. 🏖️ Posts Management (`/admin/posts`)
* **Data Source:** `posts`.
* **Features:**
    * CRUD (Add/Edit/Delete Beach).
    * Set Geolocation coordinates (for future Scanner validation).
    * Set Complexity Coefficient (if applicable).

#### 4. 🎓 Academy (`/admin/academy`)
* **Data Source:** `academy_candidates`, `academy_groups`, `academy_attendance`.
* **Features:**
    * Manage Candidates (Recruits).
    * Track Attendance (Digital Journal).
    * Record Test Results (Run/Swim standards).
    * "Graduation" -> Promote Candidate to Lifeguard (User).

#### 5. ⭐ Lifeguard Rating (`/admin/rating`)
* **Logic:** Gamification based on Points (`current_month_points`).
* **UI:** Leaderboard (Top Lifeguards).

---

### ⏳ Phase 3: The "Scan" Workflow (Pending Phase 2)
* Mobile interface for lifeguards (Open/Close shift, Geolocation check).

---

## 4. ⚠️ Critical Implementation Rules

1.  **Language:** UI MUST be in **Ukrainian**.
2.  **Date Handling:** Use `formatDateLocal` helper. NEVER use raw `toISOString()` for filters.
3.  **Data Integrity:**
    * Salary calculations must be precise.
    * Deleting a User/Post must handle Foreign Key constraints (Cascade or Soft Delete).
4.  **Security:** Ensure RLS policies protect financial data (only Admin/Director/Accountant).

---

## 5. 📂 Directory Structure (Targets for Next Steps)

Мы должны создать эти файлы в следующей итерации (они сейчас отсутствуют или являются заглушками):

src/
├── components/
│   ├── analytics/           # ✅ BI Components (Completed)
│   │   ├── BeachLoadChart.tsx
│   │   ├── HeatmapGrid.tsx
│   │   ├── SeasonalTrendChart.tsx
│   │   ├── TopBeachesChart.tsx
│   │   ├── WaterLandRatioChart.tsx
│   │   └── SmartInsights.tsx
│   └── ...
├── pages/
│   ├── admin/
│   │   ├── AdminPayroll.tsx       # 🔴 TODO: Priority 3 (Finance & Taxes)
│   │   ├── AdminReports.tsx       # 🔴 TODO: Priority 1 (Incidents CRUD)
│   │   ├── AdminPosts.tsx         # 🔴 TODO: Priority 2 (Locations CRUD)
│   │   ├── AdminAcademy.tsx       # 🔴 TODO: Priority 4 (Training Logic)
│   │   ├── AdminRating.tsx        # 🔴 TODO: Priority 5 (Gamification)
│   │   ├── AdminPostAnalytics.tsx # ✅ Done (BI Dashboard)
│   │   ├── AdminUsers.tsx         # ✅ Done
│   │   └── AdminShiftHistory.tsx  # ✅ Done
│   └── ...


6. 📝 Migration Checklist (Legacy PHP -> React)
[x] User Import: Users migrated to Supabase Auth (public.users linked via UUID).

[x] Photo Storage: Hybrid system works (React uploads -> PHP Script -> Local Storage).

[ ] Reports Logic: Recreate submit_report.php & view_reports.php in AdminReports.tsx.

[ ] Financial Logic: Recreate lifeguard_monthly_stats.php logic in AdminPayroll.tsx.

[ ] Academy Logic: Port complex SQL queries from academy/*.php to Supabase JS.

End of Technical Context