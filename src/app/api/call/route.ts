const VAPI_BASE = "https://api.vapi.ai";

export async function POST(req: Request): Promise<Response> {
  if (!process.env.VAPI_API_KEY) {
    return Response.json({ error: "VAPI_API_KEY is not configured" }, { status: 500 });
  }
  if (!process.env.VAPI_PHONE_NUMBER_ID) {
    return Response.json({ error: "VAPI_PHONE_NUMBER_ID is not configured" }, { status: 500 });
  }

  let assistantId: string, phoneNumber: string;
  try {
    ({ assistantId, phoneNumber } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!assistantId) {
    return Response.json({ error: "assistantId is required" }, { status: 400 });
  }
  if (!phoneNumber) {
    return Response.json({ error: "phoneNumber is required" }, { status: 400 });
  }

  try {
    const vapiRes = await fetch(`${VAPI_BASE}/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify({
        assistantId,
        customer: { number: phoneNumber },
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      }),
    });

    if (!vapiRes.ok) {
      const detail = await vapiRes.json().catch(() => ({}));
      console.error("Vapi call error:", vapiRes.status, detail);
      return Response.json({ error: `Vapi API error: ${vapiRes.status}` }, { status: 500 });
    }

    const { id } = await vapiRes.json();
    return Response.json({ callId: id });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
