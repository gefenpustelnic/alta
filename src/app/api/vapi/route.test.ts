import { POST } from "./route";
import { AgentConfig } from "@/types/agent";

const VALID_CONFIG: AgentConfig = {
  name: "Solar Sara",
  voice: "jennifer",
  systemPrompt: "You are a solar energy sales agent.",
  firstMessage: "Hi! I'm calling about solar savings for your home.",
  qualificationQuestions: ["What is your monthly electricity bill?", "Do you own your home?"],
  calendlyUrl: "https://calendly.com/solar-demo",
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/vapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/vapi", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, VAPI_API_KEY: "test-vapi-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // ── Behavior 1: create maps AgentConfig → Vapi body ──────────────────────

  it("create: calls Vapi POST /assistant with correct body and returns assistantId", async () => {
    const vapiAssistantId = "vapi-assistant-abc123";
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: vapiAssistantId }), { status: 201 }),
    );

    const res = await POST(makeRequest({ action: "create", config: VALID_CONFIG }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ assistantId: vapiAssistantId });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.vapi.ai/assistant");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe("Bearer test-vapi-key");

    const sentBody = JSON.parse(init.body);
    expect(sentBody.name).toBe(VALID_CONFIG.name);
    expect(sentBody.firstMessage).toBe(VALID_CONFIG.firstMessage);
    expect(sentBody.voice.voiceId).toBe(VALID_CONFIG.voice);
    expect(sentBody.model.systemPrompt).toContain(VALID_CONFIG.systemPrompt);
    expect(sentBody.model.systemPrompt).toContain(VALID_CONFIG.calendlyUrl);
  });

  // ── Behavior 2: update calls PATCH on existing assistant ─────────────────

  it("update: calls Vapi PATCH /assistant/{id} with mapped body and returns same assistantId", async () => {
    const existingId = "vapi-assistant-existing";
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: existingId }), { status: 200 }),
    );

    const updatedConfig: AgentConfig = { ...VALID_CONFIG, name: "Solar Sam", voice: "sarah" };
    const res = await POST(
      makeRequest({ action: "update", assistantId: existingId, config: updatedConfig }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ assistantId: existingId });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`https://api.vapi.ai/assistant/${existingId}`);
    expect(init.method).toBe("PATCH");
    const sentBody = JSON.parse(init.body);
    expect(sentBody.name).toBe("Solar Sam");
    // Verify the config is mapped through buildAssistantBody, not sent raw
    expect(sentBody.voice).toEqual({ provider: "11labs", voiceId: "sarah" });
    expect(sentBody.model.systemPrompt).toContain(updatedConfig.calendlyUrl);
  });

  it("returns 400 when assistantId is missing for update", async () => {
    const res = await POST(makeRequest({ action: "update", config: VALID_CONFIG }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/assistantId/);
  });

  // ── Behavior 3: missing API key → 500 before any Vapi call ───────────────

  it("returns 500 when VAPI_API_KEY is not set", async () => {
    delete process.env.VAPI_API_KEY;
    const fetchSpy = jest.spyOn(global, "fetch");

    const res = await POST(makeRequest({ action: "create", config: VALID_CONFIG }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/VAPI_API_KEY/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ── Behavior 4: Vapi API error → 500 with details ────────────────────────

  it("returns 500 when Vapi API responds with an error", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid voice ID" }), { status: 422 }),
    );

    const res = await POST(makeRequest({ action: "create", config: VALID_CONFIG }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/Vapi/i);
  });
});
