import { AgentConfig } from "@/types/agent";

const VAPI_BASE = "https://api.vapi.ai";

function buildAssistantBody(config: AgentConfig): object {
  const systemPrompt = [
    config.systemPrompt,
    "",
    "Qualification questions to ask in order:",
    ...config.qualificationQuestions.map((q, i) => `${i + 1}. ${q}`),
    "",
    `When the lead is qualified, direct them to book a meeting: ${config.calendlyUrl}`,
  ].join("\n");

  return {
    name: config.name,
    firstMessage: config.firstMessage,
    voice: {
      provider: "11labs",
      voiceId: config.voice,
    },
    model: {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      systemPrompt,
    },
  };
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.VAPI_API_KEY) {
    return Response.json(
      { error: "VAPI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const { action, config, assistantId } = await req.json();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
  };

  try {
    let url: string;
    let method: string;
    let body: object;

    if (action === "create") {
      url = `${VAPI_BASE}/assistant`;
      method = "POST";
      body = buildAssistantBody(config as AgentConfig);
    } else {
      url = `${VAPI_BASE}/assistant/${assistantId}`;
      method = "PATCH";
      body = config as Partial<AgentConfig>;
    }

    const vapiRes = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!vapiRes.ok) {
      const detail = await vapiRes.json().catch(() => ({}));
      return Response.json(
        { error: `Vapi API error: ${vapiRes.status}`, detail },
        { status: 500 },
      );
    }

    const { id } = await vapiRes.json();
    return Response.json({ assistantId: id });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
