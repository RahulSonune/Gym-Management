# FitLife Gym Management — Test Case Specification

**Version:** 1.0  
**Application:** Angular frontend + Spring Boot API (`/api/v1`)  
**Environment tags:** `[DEV]` local mock | `[INT]` integration with backend | `[UAT]` pre-prod  

---

## 1. Document conventions

| Column (CSV) | Description |
|--------------|-------------|
| **TC_ID** | Unique identifier |
| **Module** | Feature area |
| **Category** | Smoke, Regression, Security, API, Non-functional, Accessibility |
| **Priority** | P0 critical path · P1 high · P2 medium · P3 low |
| **Title** | Short name |
| **Preconditions** | Setup before test |
| **Test Steps** | Numbered steps |
| **Expected Result** | Pass criteria |
| **Test Data** | Sample inputs / users |
| **Notes** | Env, automation hints |

**Demo / seed data (typical dev):**

- User: `reception@gym.com` / `password` (when backend seeded)

---

## 2. Test cases by module

### 2.1 Authentication & session

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| AUTH-001 | P0 | Valid login | Backend up; valid user | Open `/login`; enter email/password; submit | Redirect to dashboard; no error toast |
| AUTH-002 | P0 | Invalid password | — | Wrong password | Stay on login; error or message; no token stored |
| AUTH-003 | P1 | Empty fields | — | Submit empty | Validation; cannot proceed |
| AUTH-004 | P1 | Session persists refresh | Logged in | F5 on dashboard | Still authenticated |
| AUTH-005 | P1 | Logout clears session | Logged in | Logout | Login page or guest; API calls unauthenticated |
| AUTH-006 | P2 | Deep link when logged out | None | Visit `/members` | Redirect to login or guarded |
| AUTH-007 | P1 | Token expiry / 401 | Expired/invalid token | Navigate or trigger API | Redirect login or refresh session per app behavior |

### 2.2 Authorization & routing

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| RBAC-001 | P1 | Reception accesses dashboard | Receptionist login | Open `/dashboard` | Loads |
| RBAC-002 | P1 | Reports restricted | User without manager roles | Open `/reports` | Redirect to dashboard (or 403 UI) |
| RBAC-003 | P1 | Admin branches — Super Admin | SUPER_ADMIN | `/admin/branches` | Page loads |
| RBAC-004 | P1 | Admin branches — denied | Reception only | `/admin/branches` | Blocked / redirect |
| RBAC-005 | P1 | Staff admin | BRANCH_MANAGER or SUPER_ADMIN | `/admin/staff` | Per guard |

### 2.3 Dashboard

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| DASH-001 | P0 | Summary loads | API ok | Open dashboard | Cards/metrics render or graceful error |
| DASH-002 | P1 | Branch context | Multi-branch | Switch branch (if UI) | Data scoped to branch |
| DASH-003 | P1 | API failure state | Mock 500 or stop API | Load dashboard | Error message; retry if present |
| DASH-004 | P2 | Check-in / Check-out CTA | — | Click header button | Navigates to attendance kiosk route |
| DASH-005 | P2 | Expiring table | Data present | Scroll expiring | Links to member detail work |

### 2.4 Members

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| MEM-001 | P0 | Member list loads | Auth | Open `/members` | Table populated or empty state |
| MEM-002 | P1 | Search by name | Members exist | Type in search | Filtered rows (client-side if PII encryption on) |
| MEM-003 | P1 | Search by phone/code | — | Search | Matches |
| MEM-004 | P1 | Status filter | — | Select status | Filter works |
| MEM-005 | P0 | Register member | — | `/members/new`; fill required; save | Success; member appears in list |
| MEM-006 | P1 | Validation required fields | — | Submit empty required | Inline errors |
| MEM-007 | P1 | Member detail | Valid id | Click row | Profile loads; tabs if any |
| MEM-008 | P1 | Edit member | — | Edit; save | Changes persist on reload |
| MEM-009 | P2 | Empty optional fields | — | Leave optional blank | UI shows `-` or empty placeholder |
| MEM-010 | P1 | PII display not ciphertext | Encryption enabled | View list/detail | Names/phones plaintext or `-`, not `FLENC1:` |

### 2.5 Attendance

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| ATT-001 | P0 | Attendance page loads | — | `/attendance` | Currently inside + log visible |
| ATT-002 | P1 | Live list | Checked-in member | Open page | Member in "Currently inside" |
| ATT-003 | P0 | Check-in kiosk | Active subscription | Kiosk; mode Check in; search member | Success message; appears in live |
| ATT-004 | P0 | Check-out from list | Member inside | Click Check out | Removed from live; log shows checkout time |
| ATT-005 | P0 | Kiosk check-out | Member inside | Mode Check out; select member | Goodbye; times shown |
| ATT-006 | P1 | Check-out without check-in | — | Check out only | Error NOT_CHECKED_IN or message |
| ATT-007 | P1 | Check-in without subscription | Expired member | Check in | Denied SUBSCRIPTION_EXPIRED |
| ATT-008 | P2 | Log columns | History with checkout | View log | Check-in and Check-out columns populated |
| ATT-009 | P1 | Branch scope | Multi-branch | Different branch | Data isolated |

### 2.6 Billing & payments

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| BILL-001 | P1 | Invoices list | Data | `/billing` tab | Rows render |
| BILL-002 | P1 | Payments list | — | Payments tab | Rows render |
| BILL-003 | P0 | Record payment | Member | Payment form; amount; submit | Success; appears in payments |
| BILL-004 | P1 | Member search on payment | — | Select member | Correct member shown |

### 2.7 Subscriptions & plans

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| SUB-001 | P1 | Sell subscription flow | Member; plans API | Complete stepper | Confirmation |
| SUB-002 | P1 | Plans list | — | `/plans` | Plans display |

### 2.8 Reports

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| REP-001 | P1 | Expiring report | Authorized role | `/reports` | Table; links to members |
| REP-002 | P1 | Unauthorized | Reception only | Direct URL | Redirect dashboard |

### 2.9 Settings & admin

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| SET-001 | P2 | Settings page | — | `/settings` | App info / mock vs live indicator |
| ADM-001 | P1 | Branches CRUD / list | Super admin | `/admin/branches` | Branch data |
| ADM-002 | P1 | Staff list | Manager/admin | `/admin/staff` | Staff data |

### 2.10 API (integration / contract)

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| API-001 | P0 | Login POST | — | POST `/api/v1/auth/login` JSON | 200 + token structure |
| API-002 | P1 | Protected GET | Valid Bearer | GET `/api/v1/auth/me` | 200 user |
| API-003 | P1 | Members pageable | Token | GET `/api/v1/members` | 200 JSON page |
| API-004 | P0 | Check-in | Valid body | POST `/api/v1/attendance/check-in` | 200 CheckInResponse |
| API-005 | P0 | Check-out | Open session | POST `/api/v1/attendance/check-out` | 200; checkOutAt set |
| API-006 | P1 | No token | — | GET members without header | 401 |
| API-007 | P2 | CORS | Browser | Frontend origin | Preflight succeeds if configured |

### 2.11 Security & PII

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| SEC-001 | P1 | HTTPS in prod | Prod | Inspect | TLS only |
| SEC-002 | P1 | JWT not in URL | — | Inspect requests | Bearer header |
| SEC-003 | P2 | Client PII secret rotation | Encrypt on | Change env secret old data | Document: old ciphertext unreadable |
| SEC-004 | P1 | XSS — member name | — | Inject script in name field | Escaped / stored safely |

### 2.12 Non-functional

| TC_ID | Priority | Title | Preconditions | Steps | Expected |
|-------|----------|-------|---------------|-------|----------|
| NFR-001 | P2 | LCP dashboard | — | Lighthouse | Reasonable score on 3G sim |
| NFR-002 | P2 | Member list 500 rows | Seed | Scroll / filter | Usable performance |
| NFR-003 | P3 | Keyboard nav | — | Tab through forms | Focus visible |

### 2.13 Regression suite (smoke — run every release)

Execute: AUTH-001, DASH-001, MEM-001, MEM-005, ATT-003, ATT-004, BILL-003, API-001, API-004, API-005.

---

## 3. Traceability

| Business capability | Primary TC_IDs |
|---------------------|----------------|
| Access control | AUTH-*, RBAC-* |
| Operations — members | MEM-* |
| Operations — attendance | ATT-* |
| Revenue | BILL-*, SUB-* |
| Insights | DASH-*, REP-* |

---

## 4. Import instructions (Excel)

1. Open **Microsoft Excel** → **Data** → **From Text/CSV** → select `FitLife_Gym_Test_Cases.csv`.
2. Encoding: **UTF-8**. Delimiter: **comma**.
3. Save as `.xlsx` if you need native Excel format with filters.

---

*End of document.*
