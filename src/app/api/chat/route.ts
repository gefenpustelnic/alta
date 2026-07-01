import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, isStepCount, streamText, UIMessage, tool } from "ai";
import { z } from "zod";

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

const SYSTEM_PROMPT = `You are an AI voice agent builder for Alta. Help users create outbound voice assistants that call leads, qualify them, and direct qualified leads to book via Calendly.

When you have gathered enough information (agent purpose, target leads, qualification criteria, tone), call the create_agent tool to generate the full configuration. Do not ask for every field explicitly — infer reasonable defaults from context.

When the user asks to modify the existing agent (e.g. "make it friendlier", "add a budget question"), call the update_agent tool with only the fields that change. Preserve all other fields.

After calling a tool, briefly confirm what you built or changed in one sentence.

Voice IDs available: jennifer (warm female), mark (professional male), sarah (energetic female), rachel (calm female), josh (friendly male).`;

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
      "Update specific fields of the existing agent. Only include fields that should change.",
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
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
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
