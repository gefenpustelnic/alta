import { buildSystemPrompt, mergeAgentConfig } from "./agent";
import { AgentConfig } from "@/types/agent";

const BASE_CONFIG: AgentConfig = {
  name: "Solar Sara",
  voice: "jennifer",
  systemPrompt: "You are a solar energy sales agent.",
  firstMessage: "Hi! I'm calling about solar savings for your home.",
  qualificationQuestions: ["What is your monthly electricity bill?", "Do you own your home?"],
  calendlyUrl: "https://calendly.com/solar-demo",
};

// ── buildSystemPrompt ────────────────────────────────────────────────────────

describe("buildSystemPrompt", () => {
  it("contains base instructions when no agent config provided", () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).toContain("create_agent");
    expect(prompt).toContain("update_agent");
    expect(prompt).not.toContain("Current agent configuration");
  });

  it("injects current agent config so Claude knows the live state", () => {
    const prompt = buildSystemPrompt(BASE_CONFIG);
    expect(prompt).toContain("Current agent configuration");
    expect(prompt).toContain("Solar Sara");
    expect(prompt).toContain("What is your monthly electricity bill?");
    expect(prompt).toContain("https://calendly.com/solar-demo");
  });

  it("instructs Claude to include the full updated array for array fields", () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).toMatch(/qualificationQuestions/i);
    // Must tell Claude to send the complete list, not just new items
    expect(prompt).toMatch(/full|complete|all/i);
  });
});

// ── mergeAgentConfig ─────────────────────────────────────────────────────────

describe("mergeAgentConfig", () => {
  it("merges partial update into existing config, preserving unchanged fields", () => {
    const result = mergeAgentConfig(BASE_CONFIG, { name: "Solar Sam" });
    expect(result.name).toBe("Solar Sam");
    expect(result.voice).toBe("jennifer");
    expect(result.qualificationQuestions).toEqual(BASE_CONFIG.qualificationQuestions);
    expect(result.calendlyUrl).toBe(BASE_CONFIG.calendlyUrl);
  });

  it("replaces qualificationQuestions with the full updated array Claude provides", () => {
    const updatedQuestions = [
      "What is your monthly electricity bill?",
      "Do you own your home?",
      "What is your budget for solar installation?",
    ];
    const result = mergeAgentConfig(BASE_CONFIG, { qualificationQuestions: updatedQuestions });
    expect(result.qualificationQuestions).toEqual(updatedQuestions);
    expect(result.name).toBe("Solar Sara");
  });

  it("works when no existing config (first create)", () => {
    const result = mergeAgentConfig(null, BASE_CONFIG);
    expect(result).toEqual(BASE_CONFIG);
  });
});
