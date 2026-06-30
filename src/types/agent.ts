export interface AgentConfig {
  name: string;
  voice: string;
  systemPrompt: string;
  firstMessage: string;
  qualificationQuestions: string[];
  calendlyUrl: string;
}
