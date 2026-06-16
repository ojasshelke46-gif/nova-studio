const TIMEOUT_MS = 15_000;

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export const INTAKE_SYSTEM_PROMPT = `You are an intake assistant for Nova Studio, a digital agency that builds websites, brands, and web applications.

A potential client has sent an initial message. Ask the ONE most relevant follow-up question to understand their needs better. Generate 2-4 short, specific answer options directly relevant to what they have described. Always include a final option like "Other / tell us more" for open input.

Do not repeat topics already covered in the conversation.

CRITICAL: Respond with ONLY valid JSON. No markdown fences. No explanation. No preamble. Exactly this shape:
{"question": "...", "options": ["...", "...", "Other / tell us more"]}`;

const FALLBACK_QUESTION = {
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

function parseQuestionJson(raw: string): { question: string; options: string[] } | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as unknown;
    // not the cleanest way to do this but works for now — the model occasionally
    // returns the wrong shape, so guard every field before trusting it.
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "question" in parsed &&
      "options" in parsed &&
      typeof (parsed as { question: unknown }).question === "string" &&
      Array.isArray((parsed as { options: unknown }).options)
    ) {
      return parsed as { question: string; options: string[] };
    }
  } catch {
    // fall through
  }
  return null;
}

export const REPORT_SYSTEM_PROMPT = `You are analyzing a client intake conversation for a digital agency called Nova Studio. Based on this conversation, produce:
1) "report": a clear 3-4 sentence summary of what the client wants, written for the agency team to read before a call.
2) "lead_score": an integer from 1-100 based on clarity of requirements, urgency signals, and budget signals mentioned. Higher = stronger lead.
3) "proposal_draft": 4-5 bullet points (prefix each with "• ") outlining the suggested scope of work based on what was described — no pricing.

CRITICAL: Respond ONLY with valid JSON. No markdown fences. No explanation. No preamble. Exactly this shape:
{"report": "...", "lead_score": 75, "proposal_draft": "• ...\n• ..."}`;

const FALLBACK_REPORT = {
  report:
    "Client intake could not be processed automatically. Please review the conversation directly before the call.",
  lead_score: 50,
  proposal_draft: "• Review conversation manually\n• Contact client to gather additional details",
};

function parseReportJson(
  raw: string
): { report: string; lead_score: number; proposal_draft: string } | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "report" in parsed &&
      "lead_score" in parsed &&
      "proposal_draft" in parsed &&
      typeof (parsed as { report: unknown }).report === "string" &&
      typeof (parsed as { lead_score: unknown }).lead_score === "number" &&
      typeof (parsed as { proposal_draft: unknown }).proposal_draft === "string"
    ) {
      const p = parsed as { report: string; lead_score: number; proposal_draft: string };
      return {
        ...p,
        lead_score: Math.max(1, Math.min(100, Math.round(p.lead_score))),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

export async function generateIntakeReport(
  conversation: { role: "user" | "assistant"; content: string }[]
): Promise<{ report: string; lead_score: number; proposal_draft: string }> {
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
          'Output ONLY valid JSON: {"report":"...","lead_score":75,"proposal_draft":"• ...\n• ..."}',
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
): Promise<{ question: string; options: string[] }> {
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
          'Output ONLY valid JSON with no other text: {"question":"...","options":["...","..."]}',
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
  proposalDraft: string
): Promise<string> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a professional copywriter for Nova Studio, a digital agency. Write only what is asked — no extra commentary.",
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
