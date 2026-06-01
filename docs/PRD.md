# Product Requirements Document (PRD)
## Project Name: Society Maintenance Portal

---

## 1. Overview & Objective
The **Society Maintenance Portal** (Housing Management System - HMS) is a comprehensive web application designed to streamline residential society management, automate maintenance invoicing and payment tracking, and facilitate seamless communication between the society committee/administrators and residents.

The primary objective is to replace manual Excel tracking, paper bills, and scattered communication with a unified, real-time platform accessible by both Admins (Committee Members) and Residents (Flat Owners / Tenants).

---

## 2. Target Audience & Roles

The system supports two core roles with distinct permissions and interfaces:

### 2.1 Admin (Committee / Management)
* **Goal**: Efficiently manage society assets, track financial collections, publish regulations, document expenses, handle complaints, and manage resident data.
* **Key Tasks**:
  * Set up blocks, flats, and residents (owners & tenants).
  * Record maintenance payments (`✅ Paid`) and send digital receipts.
  * Adjust global monthly maintenance amount and billing due date.
  * Register society expenditure logs and committee details.
  * Post official notices, guidelines, and rules.
  * Acknowledge and resolve complaints registered by residents.

### 2.2 Resident (Owners & Tenants)
* **Goal**: View outstanding dues, download payment receipts, inspect rules, view notices, track expenditures, and file/track complaints.
* **Key Tasks**:
  * Log in securely with username and password.
  * View current billing status (Paid vs. Pending).
  * Retrieve society bank details/QR code for bank transfer or UPI payment.
  * Submit complaints with details.
  * Review recent expenditures, rules, and notices.

---

## 3. Key Feature Requirements

### 3.1 Society Initialization & Setup
* First-time setup to register the society name, select property type (Flat, Bungalow, Villa, etc.), specify the number of blocks, flats per block, and assign an administrator username/password.
* Seamless landing page showing available societies for quick selection and login routing.

### 3.2 Maintenance Tracking & Management
* Multi-month ledger of maintenance records mapped by Block and Unit Number.
* Real-time indicators of payment status:
  * **Paid**: Maintenance settled for the current period, showing paid date, method, and a downloadable PDF receipt.
  * **Pending**: Dues unpaid for the current period.
* One-click payment update (`✅ Paid`) for admins to mark cash, UPI, card, bank transfer, or cheque transactions.
* Custom payment plan support:
  * **Monthly**: Standard recurring payment.
  * **Yearly**: Capped yearly payments that mark subsequent months as "Paid" automatically with a "Yearly" status pill.
* Ownership transfer mechanism to archive past residents (making them inactive in historical logs) and assign a new owner starting from a specific month/year.

### 3.3 Dashboard & Real-Time Analytics
* Executive KPIs visible to Admins:
  * **Occupied Units**: Total flats currently populated.
  * **Paid Units**: Number of flats settled for the period.
  * **Pending Units**: Number of outstanding flats.
  * **Overdue Units**: Flats unpaid where the current date exceeds the global due date.
* Analytics widgets showing:
  * **Monthly Collection**: Sum of payments received in the selected period.
  * **Pending Amount**: Total dues remaining.
  * **Yearly Collection**: Value collected through yearly plans.
  * **Monthly Expenses**: Sum of expenditure logs.
* Automated real-time update of all metrics immediately upon action (e.g., clicking `✅ Paid` or updating the due day) without page reload.

### 3.4 Notices & Rules & Regulations
* **Notices**: Broadcast communication for events, maintenance schedules, and emergencies, displaying the title, details, publish date, and edit stamp (if modified).
* **Rules & Regulations**: Static rules and code of conduct for the society, styled with distinct typography and larger details display.

### 3.5 Expenditures Tracker
* Logbook for recording society expenses.
* Fields: Title, Amount, Date, Time (auto-tracked), and Notes.
* Automatic sum aggregation displayed on the main admin analytics dashboard.

### 3.6 Complaint Helpdesk
* Portal for residents to submit complaints under distinct priorities (Low, Medium, High, Critical).
* Interactive list for admins to review complaints, see which flat submitted them, track creation/update date and time, and delete resolved complaints.

### 3.7 Profile & Password Security
* Multi-factor verification (OTP) via Twilio SMS to verify identity before allowing admins or residents to reset passwords.
* Passwords must be secure (minimum 5 characters, alphanumeric + special character).

---

## 4. Non-Functional Requirements

### 4.1 Real-Time UI Responsiveness
* Actions must reflect immediately. Any backend updates (POST/DELETE) must automatically trigger a refresh of the dashboard state, table rows, and metrics in the background without refreshing the page.

### 4.2 Browser Caching Controls
* To prevent browsers from showing stale cached data on SPA fetches, the backend must set explicit `Cache-Control: no-store` headers, and the client must employ cache-busting timestamp tokens on GET requests.

### 4.3 Clean Modern Aesthetics
* High-end, premium design using a cohesive color palette (gold/brown/cream tones `#8B5E3C`, glassmorphism, responsive tables, custom status pills, and interactive hover feedback).
* Fonts: Modern typography (Inter, HSL colors).

### 4.4 Mobile Friendliness
* Fully responsive layout using mobile-first grid systems. Collapse-expand controls on blocks to conserve vertical space on smaller screens.
