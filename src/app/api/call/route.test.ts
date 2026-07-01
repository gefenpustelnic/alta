import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/call", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      VAPI_API_KEY: "test-vapi-key",
      VAPI_PHONE_NUMBER_ID: "phone-number-id-abc",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // ── Behavior 1: initiates call via Vapi and returns callId ───────────────

  it("calls Vapi POST /call with correct body and returns callId", async () => {
    const callId = "call-xyz-123";
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: callId }), { status: 201 }),
    );

    const res = await POST(makeRequest({ assistantId: "asst-1", phoneNumber: "+15550001234" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ callId });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.vapi.ai/call");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe("Bearer test-vapi-key");

    const sent = JSON.parse(init.body);
    expect(sent.assistantId).toBe("asst-1");
    expect(sent.customer.number).toBe("+15550001234");
    expect(sent.phoneNumberId).toBe("phone-number-id-abc");
  });

  // ── Behavior 2: missing VAPI_API_KEY → 500 ───────────────────────────────

  it("returns 500 when VAPI_API_KEY is not set", async () => {
    delete process.env.VAPI_API_KEY;
    const fetchSpy = jest.spyOn(global, "fetch");

    const res = await POST(makeRequest({ assistantId: "asst-1", phoneNumber: "+15550001234" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/VAPI_API_KEY/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ── Behavior 3: missing VAPI_PHONE_NUMBER_ID → 500 ───────────────────────

  it("returns 500 when VAPI_PHONE_NUMBER_ID is not set", async () => {
    delete process.env.VAPI_PHONE_NUMBER_ID;
    const fetchSpy = jest.spyOn(global, "fetch");

    const res = await POST(makeRequest({ assistantId: "asst-1", phoneNumber: "+15550001234" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/VAPI_PHONE_NUMBER_ID/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // ── Behavior 4: missing assistantId → 400 ────────────────────────────────

  it("returns 400 when assistantId is missing", async () => {
    const res = await POST(makeRequest({ phoneNumber: "+15550001234" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/assistantId/);
  });

  // ── Behavior 5: missing phoneNumber → 400 ────────────────────────────────

  it("returns 400 when phoneNumber is missing", async () => {
    const res = await POST(makeRequest({ assistantId: "asst-1" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/phoneNumber/);
  });

  // ── Behavior 6: Vapi API error → 500 ─────────────────────────────────────

  it("returns 500 when Vapi API responds with an error", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid phone number" }), { status: 422 }),
    );

    const res = await POST(makeRequest({ assistantId: "asst-1", phoneNumber: "+15550001234" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/Vapi/i);
  });
});
