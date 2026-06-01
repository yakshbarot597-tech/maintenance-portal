# Implementation Details (IMPLEMENTATION)
## Project Name: Society Maintenance Portal

---

## 1. Frontend State Management & SPA Pattern

The frontend operates as a stateless SPA utilizing a centralized in-memory client state object called **`vault`**.

### 1.1 The Vault Structure
* **`vault[currentSociety]`**: Holds the complete response payload from the backend for the currently active society, including:
  * `config`: Number of blocks, unit structures, default due day, monthly maintenance value.
  * `bank`: Bank name, account number, IFSC code, and base64 UPI QR code.
  * `apartmentData`: Nested object `apartmentData[block][flatNumber]` representing each unit, its owner, phone, residency type, and monthly maintenance ledger (`flat.months[period]`).
  * `notices`, `expenses`, `committee`, `rules`, and `complaints`: Arrays containing the logs and items.

### 1.2 View State Filters
* Month and Year filters are synchronized in the DOM using dropdown selectors (`#viewMonth`, `#viewYear`). Changing these dropdowns calls `handlePeriodChange()`, which pulls dates from the input values and parses them into a string key format (e.g. `June-2026`).
* When the view period changes, the frontend does not hit the backend again. Instead, it re-queries the local `vault` data structure instantly via `getEffectiveMonthData(flat, period)`, updating the tables and re-rendering cards without lag.

---

## 2. Key Refactoring & Feature Implementations

### 2.1 Time Component Integration in Lists
We integrated date-time logging across Complaints, Rules, Expenditures, and Notices.
* **Backend Formatters**:
  * `formatDateTimeDDMMYYYY(dateVal)`: Formats timestamps in the database into local readable strings `DD-MM-YYYY hh:mm AM/PM` (e.g., `01-06-2026 10:55 AM`).
  * `combineDateAndTime(dateVal, timestampVal)`: Combines standard date-picked expenditures with their creation time to display precise logging times.
  * `parseDDMMYYYY(dateStr)`: Extends string parsing to detect hours, minutes, and AM/PM modifiers, preserving precise timestamps during edits or additions.
* **Frontend Capture**:
  * Added `getCurrentDateTimeString()` in `script.js` to create a `DD-MM-YYYY hh:mm AM/PM` local timestamp on item creation (`saveExpense`, `addNotice`, `saveRule`, `saveComplaint`).

### 2.2 Paid and Send Action Buttons Sizing Overrides
To keep the tables clean and dense without causing horizontal scrolling or visual breakage:
* Enforced padding overrides on the action buttons (`✅ Paid`, `Send`) inside table cells.
* Added specific CSS declarations in `styles.css`:
  ```css
  tbody td button {
      font-size: 15px !important;
      padding: 6px 14px !important;
      border-radius: 10px !important;
  }
  ```
* This explicitly targets table action buttons while preserving standard large text hierarchies in headers, rows, and general labels.

### 2.3 Real-Time Dashboard Updates & Caching Suppression
To resolve the caching issue where clicking `✅ Paid` and reloading did not update the statistics cards:
* **Backend Cache Suppression**: Inserted global Express middleware for all `/api` endpoints to disable HTTP caches on the browser level:
  ```javascript
  app.use("/api", (req, res, next) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      next();
  });
  ```
* **Frontend Cache Buster URL Inject**: Intercepted the fetch request inside `fetchWithAuth()` in `api.js` to append a unique timestamp token to GET requests:
  ```javascript
  if (method === 'GET') {
      options.headers['Cache-Control'] = 'no-cache';
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}_t=${Date.now()}`;
  }
  ```
* **Settings Synchronizer**: Appended a call to `updateAnalytics()` inside `updateGlobalDueDay()` in `script.js` so updates to settings propagate changes to counts in real-time.

### 2.4 Due Date Bounds Validation & Auto-Correction
To restrict the global due date input and auto-correct invalid dates (like June 31st):
* **Min/Max Scope Restrictions**: Built HTML5 attributes dynamically inside `loadDashboard()` and `handlePeriodChange()`:
  ```javascript
  input.min = `${year}-${String(mIdx + 1).padStart(2, '0')}-01`;
  input.max = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(lastDateOfMonth).padStart(2, '0')}`;
  ```
* **ValidityState Catcher & Auto-Capping**: In `updateGlobalDueDay()`, we check if the user entered an invalid date:
  ```javascript
  if (!value) {
      const inputEl = document.getElementById('globalDueDate');
      if (inputEl && !inputEl.validity.valid) {
          // ... resets inputEl.value to the last date of the month (e.g. 30 for June) ...
          showToast(`Invalid date. Corrected to last day of ${viewMonth}: ${lastDate}`, "warning");
      }
  }
  ```
* **Event Listeners**: Added `onblur` as well as `onchange` on the DOM element in `index.html` to guarantee validation executes immediately when clicking away.
