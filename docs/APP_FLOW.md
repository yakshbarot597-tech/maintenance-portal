# Application Flow (APP_FLOW)
## Project Name: Society Maintenance Portal

---

## 1. Core Workflows & System Processes

This document details the step-by-step flow of key actions in the Society Maintenance Portal.

### 1.1 First-Time Setup Flow
When the application has no registered societies:

```mermaid
sequenceDiagram
    participant User as Web Browser
    participant Client as Frontend JavaScript
    participant API as Express API Server
    participant DB as PostgreSQL DB

    User->>Client: Open Landing Page
    Client->>API: GET /api/societies (empty)
    API-->>Client: Returns []
    Client->>User: Renders Setup Interface
    User->>Client: Enters Society Name, Property Type, Admin Credentials & Submits
    Client->>API: POST /api/setup (Payload)
    API->>DB: INSERT into societies & users (admin)
    DB-->>API: Success
    API-->>Client: { success: true }
    Client->>User: Show Toast and Redirect to Login Screen
```

---

### 1.2 User Authentication Flow (Admin vs. Resident)
Routing users based on their target panel:

```mermaid
graph TD
    Start[User selects Society & Panel] --> SelectAdmin{Selected Admin?}
    SelectAdmin -- Yes --> AdminForm[Enter Admin Username & Password]
    AdminForm --> SubmitAdmin[POST /api/login]
    SubmitAdmin --> MatchAdmin{Credentials & Type Match?}
    MatchAdmin -- Yes --> StoreAdminToken[Store admin JWT token, activeSociety, isAdmin=true in localStorage]
    StoreAdminToken --> LoadAdminDash[Call loadDashboardData -> Redirect to Admin Dashboard]
    MatchAdmin -- No --> ShowAdminError[Display login error toast]

    SelectAdmin -- No --> ResForm[Enter Resident Username & Password]
    ResForm --> SubmitRes[POST /api/resident-login]
    SubmitRes --> MatchRes{Credentials & Type Match?}
    MatchRes -- Yes --> StoreResToken[Store resident JWT token, residentFlat, isAdmin=false in localStorage]
    StoreResToken --> LoadResDash[Call loadDashboardData -> Redirect to Resident Panel]
    MatchRes -- No --> ShowResError[Display login error toast]
```

---

### 1.3 Monthly Ledger Billing & Payment Action Flow
How administrators process monthly maintenance records:

1. **Dashboard Initialization**:
   * Admin lands on the dashboard.
   * Client calls `Api.getSociety(name, type)` with custom `_t` timestamp parameter.
   * Server queries units and invoices, builds the `apartmentData` map, and returns it.
   * Client renders the flat rows and calls `updateAnalytics()`.
2. **Reviewing Payment Ledger**:
   * Admin filters flats by Block or Payment Status (Paid / Pending).
   * Dues calculations evaluate the global due date. Any pending flats where `today > dueDate` are flagged as **Overdue**.
3. **Updating Flat Status (`✅ Paid`)**:
   * Admin clicks `✅ Paid` button on a flat row.
   * Javascript intercepts the event, collects unit details, plan type (monthly/yearly), payment method, and executes `Api.saveFlat()`.
   * Backend writes the invoice record (`status='Paid'`, `paid_at=NOW()`) and adds a transaction entry in `payment_transactions`.
   * Backend returns `{ success: true }`.
   * Frontend receives response, triggers `loadDashboardData()`.
   * Frontend performs cache-busted GET request to pull the updated society JSON.
   * Frontend updates DOM tables, adjusts `#overdueCount`, `#pendingCount`, and `#paidCount` instantly without reloading the page.

---

### 1.4 Setting Global Parameters (Due Day & Maintenance)
The validation and propagation workflow for administrative settings:

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant UI as Date Input DOM
    participant Logic as Script Logic
    participant API as Express API Server
    participant DB as PostgreSQL DB

    Admin->>UI: Types or Selects Date
    Admin->>UI: Clicks Outside (Blur) or Hits Enter
    UI->>Logic: onchange / onblur -> updateGlobalDueDay()
    alt ValidityState is Invalid (e.g., June 31st)
        Logic->>UI: Auto-correct value to month's last day (June 30th)
        Logic->>UI: Display warning toast
    end
    Logic->>API: POST /api/update-due-day (default_due_day)
    API->>DB: UPDATE societies SET default_due_day = D
    DB-->>API: Success
    API-->>Logic: { success: true }
    Logic->>Logic: Re-render displayFlats() & updateAnalytics()
    Logic->>Admin: Overdue counters and UI rows update in real-time
```

---

### 1.5 Admin/Resident Password Reset Workflow
Identity verification using secure OTP triggers:

1. **Initiation**: User clicks "Forgot Password" on the login screen.
2. **Identity Verification**:
   * User inputs their username and mobile number.
   * Client fires `POST /api/request-resident-otp`.
   * Server checks if username and mobile number exist and match. If true, server generates a 6-digit OTP code, starts a 5-minute expiry timer, and dispatches it via Twilio SMS.
3. **OTP Validation**:
   * User receives the text and inputs the code into the client modal.
   * Client sends `POST /api/verify-resident-otp` with username and OTP.
   * Server validates the OTP code. If correct, it returns `{ success: true }` and opens the Reset Password screen.
4. **Reset**:
   * User types their new password.
   * Client checks complexity, hashes it using bcrypt, and updates the database record.
