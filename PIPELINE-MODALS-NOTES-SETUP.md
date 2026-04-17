# Pipeline details, notes, filters, and quick search patch

## Added
- click-to-open detail modal for saved leads
- click-to-open detail modal for lead pipeline cards
- click-to-open detail modal for tender pipeline cards
- scrollable modal layout
- notes section for leads and tenders
- notes stored in Supabase
- notes table sorted newest to oldest
- quick search and filters for saved leads
- quick search and minimum score filter for the lead pipeline
- quick search and source filtering for the tender pipeline

## New files
- `src/components/ui/DetailModal.tsx`
- `src/components/ui/NotesPanel.tsx`
- `src/components/leads/LeadDetailModal.tsx`
- `src/components/tenders/TenderDetailModal.tsx`
- `src/services/lead-notes.service.ts`
- `src/services/tender-notes.service.ts`
- `supabase/migrations/0007_notes_tables.sql`

## Updated files
- `src/types/index.ts`
- `src/pages/leads/LeadsPage.tsx`
- `src/pages/pipeline/PipelinePage.tsx`
- `src/pages/tenders/TendersPage.tsx`

## What to do
1. Copy the patch into your project.
2. Run the migration:
   - `npx supabase db push`
3. Restart the app:
   - `npm run dev`
