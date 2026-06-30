import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, UIMessage } from "ai";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an AI voice agent builder for Alta. Help users describe and refine outbound voice assistants that call leads, qualify them with questions, and direct qualified leads to book via Calendly.

Ask clarifying questions when needed about who the agent calls, what it offers, how it should qualify leads, and the desired tone. Be concise and practical.

Do not claim you have already created or configured an agent — that capability is coming soon. Focus on understanding their requirements and giving helpful guidance.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
