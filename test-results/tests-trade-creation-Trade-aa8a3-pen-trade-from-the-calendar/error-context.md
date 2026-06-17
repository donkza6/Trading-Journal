# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\trade-creation.spec.ts >> Trade Creation Flow E2E >> should successfully log a new open trade from the calendar
- Location: tests\trade-creation.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('span:has-text("ETH/USD")').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('span:has-text("ETH/USD")').first()

```

```yaml
- link "Journal":
  - /url: /journal
- link "Trade Plans":
  - /url: /plans
- banner:
  - heading "Trading Journal" [level=1]
  - button "ro rouinhope"
  - button "Wallet"
  - button "Export CSV"
  - button "Feedback"
  - button "Export"
  - button "Import"
  - button "Log Out"
- main:
  - heading "Performance Summary" [level=2]
  - text: Session
  - combobox:
    - option "All Sessions" [selected]
    - option "Asian"
    - option "London"
    - option "New York"
    - option "Overlap"
    - option "None"
  - text: Filters
  - combobox "Filter by asset":
    - option "All Assets" [selected]
  - combobox "Filter by type":
    - option "All Types" [selected]
    - option "Buy (Long)"
    - option "Sell (Short)"
  - combobox "Filter by P&L status":
    - option "All Trades" [selected]
    - option "Winning Trades"
    - option "Losing Trades"
  - text: Total Trades 0 Win Rate 0.0% Total P&L +$0.00 Avg R:R 0.00 Max Drawdown $0.00 Average Win $0.00 Average Loss $0.00 Longest Losing Streak 0
  - button "Previous month"
  - heading "June 2026" [level=2]
  - button "Next month"
  - text: Sun Mon Tue Wed Thu Fri Sat
  - button "Day 1": "1"
  - button "Day 2": "2"
  - button "Day 3": "3"
  - button "Day 4": "4"
  - button "Day 5": "5"
  - button "Day 6": "6"
  - button "Day 7": "7"
  - button "Day 8": "8"
  - button "Day 9": "9"
  - button "Day 10": "10"
  - button "Day 11": "11"
  - button "Day 12": "12"
  - button "Day 13": "13"
  - button "Day 14": "14"
  - button "Day 15": "15"
  - button "Day 16": "16"
  - button "Day 17": "17"
  - button "Day 18" [disabled]: "18"
  - button "Day 19" [disabled]: "19"
  - button "Day 20" [disabled]: "20"
  - button "Day 21" [disabled]: "21"
  - button "Day 22" [disabled]: "22"
  - button "Day 23" [disabled]: "23"
  - button "Day 24" [disabled]: "24"
  - button "Day 25" [disabled]: "25"
  - button "Day 26" [disabled]: "26"
  - button "Day 27" [disabled]: "27"
  - button "Day 28" [disabled]: "28"
  - button "Day 29" [disabled]: "29"
  - button "Day 30" [disabled]: "30"
- heading "Wednesday, June 17, 2026" [level=2]
- button
- paragraph: No trades logged today
- paragraph: Add your first trade to start tracking your performance for this day.
- button "+ Add New Trade"
- region "Notifications alt+T"
- alert
```

```
Error: apiRequestContext._wrapApiCall: file data stream has unexpected number of bytes
```