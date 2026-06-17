# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth-flow.spec.ts >> Authentication Flow & Dashboard E2E >> should display error toast on invalid login
- Location: tests\auth-flow.spec.ts:5:7

# Error details

```
Error: apiRequestContext._wrapApiCall: file data stream has unexpected number of bytes
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "Journal" [ref=e4] [cursor=pointer]:
      - /url: /journal
    - link "Trade Plans" [ref=e5] [cursor=pointer]:
      - /url: /plans
  - generic [ref=e7]:
    - generic [ref=e8]:
      - img [ref=e10]
      - generic [ref=e12]:
        - heading "Trading Journal" [level=1] [ref=e13]
        - paragraph [ref=e14]: Track, Analyze, Improve.
    - generic [ref=e15]:
      - generic [ref=e16]:
        - heading "Welcome back" [level=2] [ref=e17]
        - paragraph [ref=e18]: Enter your credentials to access your journal.
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Email
          - generic [ref=e22]:
            - generic:
              - img
            - textbox "you@example.com" [ref=e23]: invalid_user@example.com
        - generic [ref=e24]:
          - generic [ref=e25]: Password
          - generic [ref=e26]:
            - generic:
              - img
            - textbox "••••••••" [ref=e27]: wrongpassword123
        - button "Sign In" [ref=e28]
    - button "Don't have an account? Sign up" [ref=e30]
  - region "Notifications alt+T":
    - list:
      - listitem [ref=e31]:
        - img [ref=e33]
        - generic [ref=e36]: Invalid login credentials
  - generic [ref=e41] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e42]:
      - img [ref=e43]
    - generic [ref=e46]:
      - button "Open issues overlay" [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]: "0"
          - generic [ref=e50]: "1"
        - generic [ref=e51]: Issue
      - button "Collapse issues badge" [ref=e52]:
        - img [ref=e53]
  - alert [ref=e55]
```