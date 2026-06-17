-- Migration: add per-dimension lead-score breakdown to intake_reports.
-- score_breakdown holds { clarity, urgency, budget_signal, decision_authority },
-- each an integer 0-25; lead_score is their sum.
ALTER TABLE intake_reports
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
