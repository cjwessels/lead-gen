# Help system patch

## What this patch adds
- Dedicated Help page at `/app/help`
- Navigation link for Help
- In-app documentation for:
  - Overview
  - Lead Search
  - Lead Scoring
  - Lead Pipeline
  - Detail Modals and Notes
  - Tender Search
  - Filters and Structured Search
  - AI Outreach
  - Billing and Activation
- Image placeholders for screenshots you can add later

## Files added or changed
- `src/pages/help/HelpPage.tsx`
- `src/App.tsx`
- `src/components/layout/AppShell.tsx`
- `HELP-SYSTEM-SETUP.md`

## Important
This rebuild only adds the help system on top of your current restored build. It does not remove or replace your existing lead/tender modal and notes features.
