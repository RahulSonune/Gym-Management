# Test cases package

This folder contains production-oriented manual test documentation for **FitLife Gym Management** (Angular app + Spring Boot API).

## Files

| File | Format | Use |
|------|--------|-----|
| **FitLife_Gym_Test_Cases.csv** | Comma-separated UTF-8 | **Open in Excel:** Data → From Text/CSV, UTF-8, delimiter comma. Then save as `.xlsx` for filters/columns. |
| **FitLife_Gym_Test_Cases.md** | Markdown | Readable narrative, traceability matrix, regression pack. |
| **README.md** | — | This guide. |

## Execution tips

- Tag each run with **build/version**, **browser**, **environment** (`DEV` / `INT` / `UAT`).
- Track results in Excel: add columns **Executed By**, **Date**, **Result** (Pass/Fail/Blocked), **Defect ID**.
- **P0** cases should pass before any release; use **REG-001** as a minimal automation or release smoke checklist.

## Expanding the suite

Add rows to the CSV and keep **TC_ID** unique (prefix by module). For automated tests (Cypress, Playwright, REST Assured), reference the same **TC_ID** in your test annotations for traceability.
