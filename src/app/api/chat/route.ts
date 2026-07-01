import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, isStepCount, streamText, UIMessage, tool } from "ai";
import { z } from "zod";
import { AgentConfig } from "@/types/agent";
import { buildSystemPrompt } from "@/lib/agent";

export const maxDuration = 30;

const agentConfigSchema = z.object({
  name: z.string().describe("Agent name, e.g. 'Solar Sara'"),
  voice: z
    .string()
    .describe(
      "Vapi voice ID. Use one of: 'jennifer', 'mark', 'sarah', 'rachel', 'josh'",
    ),
  systemPrompt: z
    .string()
    .describe("Full system prompt for the voice agent — role, tone, goals"),
  firstMessage: z
    .string()
    .describe("First thing the agent says when the call connects"),
  qualificationQuestions: z
    .array(z.string())
    .describe("Ordered list of questions to qualify the lead"),
  calendlyUrl: z
    .string()
    .describe(
      "Calendly URL for booking. Use 'https://calendly.com/placeholder' if not provided",
    ),
});

const partialAgentConfigSchema = agentConfigSchema.partial();

const agentTools = {
  create_agent: tool({
    description:
      "Generate a complete voice agent configuration from the user's description",
    inputSchema: agentConfigSchema,
    execute: async (_input: z.infer<typeof agentConfigSchema>) => ({ success: true }),
  }),
  update_agent: tool({
    description:
      "Update specific fields of the existing agent. Only include fields that should change. For array fields like qualificationQuestions, always send the complete updated list.",
    inputSchema: partialAgentConfigSchema,
    execute: async (_input: z.infer<typeof partialAgentConfigSchema>) => ({ success: true }),
  }),
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { messages, agentConfig }: { messages: UIMessage[]; agentConfig: AgentConfig | null } =
      await req.json();

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: buildSystemPrompt(agentConfig ?? null),
      tools: agentTools,
      stopWhen: isStepCount(2),
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
