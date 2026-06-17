import { consumeAiBudget } from "@/lib/aiLimit";

// deepseek-v4-pro is a reasoning model — single calls can take 10-20s, so the
// old 15s budget aborted mid-thought and forced fallbacks. 30s gives headroom.
const TIMEOUT_MS = 30_000;

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export const INTAKE_SYSTEM_PROMPT = `You are an intake assistant for Nova Studio, a digital agency that builds websites, brands, and web applications.

A potential client has sent an initial message. Your job is to gather just enough to write a clear, actionable project summary for the team — not to interrogate.

You decide whether the conversation is complete, within these bounds:
- Ask AT LEAST 4 questions before completing. Do NOT set "done" to true until at least 4 questions have been asked, even if you think you already have enough.
- Once you have asked 4 questions, set "done" to true if the answers give you enough to write a clear, actionable project summary.
- If their answers are vague, contradictory, or the project is complex, keep asking beyond 4 until you have enough.

When NOT done: ask the ONE most relevant follow-up question to understand their needs better. Generate 2-4 short, specific answer options directly relevant to what they have described. Always include a final option like "Other / tell us more" for open input. Do not repeat topics already covered in the conversation.

When done: set "done" to true and return null for "question" and "options".

CRITICAL: Respond with ONLY valid JSON. No markdown fences. No explanation. No preamble. Exactly this shape:
{"done": false, "question": "...", "options": ["...", "...", "Other / tell us more"]}
or, when complete:
{"done": true, "question": null, "options": null}`;

export const FALLBACK_QUESTION = {
  done: false,
  question: "What is your approximate timeline and budget for this project?",
  options: [
    "ASAP (under 1 month)",
    "1–3 months",
    "3–6 months",
    "Flexible / not sure yet",
  ],
};

async function askDeepSeek(messages: Message[]): Promise<string> {
  const apiKey = process.env.BYTEPLUS_API_KEY;
  const baseUrl = process.env.BYTEPLUS_BASE_URL;
  const model = process.env.DEEPSEEK_TEXT_MODEL;

  if (!apiKey || !baseUrl || !model) {
    throw new Error("BytePlus env vars not configured");
  }

  // Reserve budget before spending any tokens. Throws AiRateLimitError when the
  // global per-minute/per-day ceiling is hit; callers fall back to canned output.
  consumeAiBudget();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.4 }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: { code?: string } };
      throw new Error(`BytePlus error: ${errBody?.error?.code ?? res.status}`);
    }

    const data = await res.json() as { choices: [{ message: { content: string } }] };
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timer);
  }
}

// Pull a JSON object out of a model response. Handles bare JSON, ```json fences,
// and any leading/trailing prose (reasoning models occasionally wrap the object
// in explanation). Falls back to the first "{" … last "}" slice.
function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to brace slicing
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // fall through
    }
  }
  return undefined;
}

type QuestionResult = { done: boolean; question: string | null; options: string[] | null };

function parseQuestionJson(raw: string): QuestionResult | null {
  try {
    const parsed = extractJson(raw);
    // not the cleanest way to do this but works for now — the model occasionally
    // returns the wrong shape, so guard every field before trusting it.
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      !("done" in parsed) ||
      typeof (parsed as { done: unknown }).done !== "boolean"
    ) {
      return null;
    }

    const done = (parsed as { done: boolean }).done;

    // When done, question/options are intentionally null.
    if (done) return { done: true, question: null, options: null };

    // When not done, a valid question + options array is required.
    if (
      "question" in parsed &&
      "options" in parsed &&
      typeof (parsed as { question: unknown }).question === "string" &&
      Array.isArray((parsed as { options: unknown }).options)
    ) {
      const p = parsed as { question: string; options: string[] };
      return { done: false, question: p.question, options: p.options };
    }
  } catch {
    // fall through
  }
  return null;
}

export const REPORT_SYSTEM_PROMPT = `You are analyzing a client intake conversation for a digital agency called Nova Studio. Based on this conversation, produce:

1) "report": a clear 3-4 sentence summary of what the client wants, written for the agency team to read before a call.

2) "score_breakdown": score the lead rigorously across FOUR sub-dimensions. Reason through each one based ONLY on evidence in the conversation — do not default to a generic middle value. Each is an integer from 0 to 25:
   - "clarity" (0-25): how specific and well-defined is the request? A precise, detailed scope scores high; a vague or generic ask ("I want a website") scores low.
   - "urgency" (0-25): does the conversation contain time-pressure signals (a deadline, "need this soon", "launching next month")? Explicit urgency scores high; no urgency mentioned scores low (near 0).
   - "budget_signal" (0-25): did they mention budget, interest in a pricing tier, or willingness to pay? A clear budget signal scores high; zero budget signal scores low (near 0).
   - "decision_authority" (0-25): do they sound like the decision-maker/owner, or someone just gathering info for someone else? Clear authority scores high; an info-gatherer scores low.

3) "lead_score": the SUM of the four sub-scores above, an integer from 0 to 100. It must equal clarity + urgency + budget_signal + decision_authority.

4) "proposal_draft": 4-5 bullet points (prefix each with "• ") outlining the suggested scope of work based on what was described — no pricing.

Do not inflate scores. If a dimension has no supporting evidence, score it low.

CRITICAL: Respond ONLY with valid JSON. No markdown fences. No explanation. No preamble. Exactly this shape:
{"report": "...", "lead_score": 62, "score_breakdown": {"clarity": 20, "urgency": 5, "budget_signal": 22, "decision_authority": 15}, "proposal_draft": "• ...\n• ..."}`;

const FALLBACK_REPORT = {
  report:
    "Client intake could not be processed automatically. Please review the conversation directly before the call.",
  lead_score: 50,
  score_breakdown: { clarity: 13, urgency: 12, budget_signal: 12, decision_authority: 13 },
  proposal_draft: "• Review conversation manually\n• Contact client to gather additional details",
};

export interface ScoreBreakdown {
  clarity: number;
  urgency: number;
  budget_signal: number;
  decision_authority: number;
}

export interface ReportResult {
  report: string;
  lead_score: number;
  score_breakdown: ScoreBreakdown;
  proposal_draft: string;
}

const clampSub = (n: number) => Math.max(0, Math.min(25, Math.round(n)));

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function parseReportJson(raw: string): ReportResult | null {
  try {
    const parsed = extractJson(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      typeof (parsed as { report: unknown }).report !== "string" ||
      typeof (parsed as { proposal_draft: unknown }).proposal_draft !== "string"
    ) {
      return null;
    }

    const bRaw = (parsed as { score_breakdown?: unknown }).score_breakdown;
    if (
      bRaw === null ||
      typeof bRaw !== "object" ||
      !isNumber((bRaw as ScoreBreakdown).clarity) ||
      !isNumber((bRaw as ScoreBreakdown).urgency) ||
      !isNumber((bRaw as ScoreBreakdown).budget_signal) ||
      !isNumber((bRaw as ScoreBreakdown).decision_authority)
    ) {
      return null;
    }

    const p = parsed as { report: string; proposal_draft: string };
    const breakdown: ScoreBreakdown = {
      clarity: clampSub((bRaw as ScoreBreakdown).clarity),
      urgency: clampSub((bRaw as ScoreBreakdown).urgency),
      budget_signal: clampSub((bRaw as ScoreBreakdown).budget_signal),
      decision_authority: clampSub((bRaw as ScoreBreakdown).decision_authority),
    };

    // lead_score is the sum of sub-scores — recompute so the badge always
    // matches the breakdown, regardless of what the model put in lead_score.
    const lead_score =
      breakdown.clarity +
      breakdown.urgency +
      breakdown.budget_signal +
      breakdown.decision_authority;

    return {
      report: p.report,
      lead_score,
      score_breakdown: breakdown,
      proposal_draft: p.proposal_draft,
    };
  } catch {
    // fall through
  }
  return null;
}

export async function generateIntakeReport(
  conversation: { role: "user" | "assistant"; content: string }[]
): Promise<ReportResult> {
  const messages: Message[] = [
    { role: "system", content: REPORT_SYSTEM_PROMPT },
    ...conversation,
  ];

  // Attempt 1
  try {
    const raw = await askDeepSeek(messages);
    const result = parseReportJson(raw);
    if (result) return result;
  } catch {
    // retry
  }

  // Attempt 2 — stricter reminder
  try {
    const strictMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content:
          'Output ONLY valid JSON: {"report":"...","lead_score":62,"score_breakdown":{"clarity":20,"urgency":5,"budget_signal":22,"decision_authority":15},"proposal_draft":"• ...\n• ..."}',
      },
    ];
    const raw = await askDeepSeek(strictMessages);
    const result = parseReportJson(raw);
    if (result) return result;
  } catch {
    // fall through to fallback
  }

  return FALLBACK_REPORT;
}

export async function generateIntakeQuestion(
  messages: Message[]
): Promise<QuestionResult> {
  // Attempt 1
  try {
    const raw = await askDeepSeek(messages);
    const result = parseQuestionJson(raw);
    if (result) return result;
  } catch {
    // continue to retry
  }

  // Attempt 2 — stricter reminder appended
  try {
    const strictMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content:
          'Output ONLY valid JSON with no other text. Either {"done":false,"question":"...","options":["...","..."]} or {"done":true,"question":null,"options":null}',
      },
    ];
    const raw = await askDeepSeek(strictMessages);
    const result = parseQuestionJson(raw);
    if (result) return result;
  } catch {
    // fall through to fallback
  }

  return FALLBACK_QUESTION;
}

export interface AdminChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAdminChatAnswer(
  intakeContext: string,
  history: AdminChatMessage[],
  question: string
): Promise<string> {
  const systemPrompt = `You are helping a Nova Studio team member understand a client's needs. Here is the client's intake conversation and report:\n\n${intakeContext}\n\nAnswer the team member's question concisely based only on this information. If the information is not in the data, say so clearly instead of guessing.`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: question },
  ];

  try {
    return await askDeepSeek(messages);
  } catch {
    return "Unable to retrieve an answer at this time. Please try again.";
  }
}

export async function generateEmailDraft(
  reportText: string,
  proposalDraft: string,
  instruction?: string
): Promise<string> {
  const trimmedInstruction = instruction?.trim();
  const systemContent =
    "You are a professional copywriter for Nova Studio, a digital agency. Write only what is asked — no extra commentary." +
    (trimmedInstruction
      ? ` The team member specifically wants the email to address: ${trimmedInstruction}. Incorporate this naturally into the draft.`
      : "");

  const messages: Message[] = [
    {
      role: "system",
      content: systemContent,
    },
    {
      role: "user",
      content: `Based on this client intake report:\n\nSummary: ${reportText}\n\nProposed Scope:\n${proposalDraft}\n\nDraft a short, friendly email asking 1-2 clarifying questions before the meeting. Keep it under 80 words. Sign off as "Nova Studio Team". Return ONLY the email body text, no subject line, no preamble.`,
    },
  ];

  try {
    return await askDeepSeek(messages);
  } catch {
    return "Hi,\n\nWe're looking forward to our meeting. Could you share a bit more about your timeline and any specific functionality you have in mind? This will help us prepare.\n\nNova Studio Team";
  }
}
