"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useState, useRef, useEffect } from "react";
import { AgentConfig } from "@/types/agent";

interface ChatPanelProps {
  agentConfig: AgentConfig | null;
  onAgentConfig: (config: AgentConfig) => void;
}

const WELCOME_MESSAGE =
  "Hi! I'm your AI agent builder. Describe the voice assistant you want to create — who it calls, what it's selling or offering, and how it should qualify leads. I'll build it for you.";

export default function ChatPanel({ agentConfig, onAgentConfig }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const agentConfigRef = useRef<AgentConfig | null>(agentConfig);
  const processedToolCalls = useRef<Set<string>>(new Set());

  // Keep ref in sync so the tool-result effect always sees the latest config
  useEffect(() => {
    agentConfigRef.current = agentConfig;
  }, [agentConfig]);

  const { messages, sendMessage, status, error } = useChat({
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      },
    ],
  });

  const isBusy = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Apply agent config updates from tool call results
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any;
        // Only process completed tool calls (state guards input presence)
        if (p.state !== "output-available") continue;
        if (typeof p.toolCallId !== "string") continue;
        if (processedToolCalls.current.has(p.toolCallId)) continue;
        processedToolCalls.current.add(p.toolCallId);

        // Name is in p.toolName (dynamic-tool) or encoded as "tool-{name}" in part.type
        const toolName: string = p.toolName ?? String(part.type).replace(/^tool-/, "");
        // tool input carries the agent config; execute() return value is unused client-side
        const toolInput = p.input as Partial<AgentConfig>;

        if (toolName === "create_agent") {
          onAgentConfig(toolInput as AgentConfig);
        } else if (toolName === "update_agent") {
          // Merge into existing config; if none yet, treat partial as a full create
          onAgentConfig({ ...(agentConfigRef.current ?? {}), ...toolInput } as AgentConfig);
        }
      }
    }
  }, [messages, onAgentConfig]);

  const handleSend = async () => {
    if (!input.trim() || isBusy) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {error && (
          <p className="text-sm text-red-400 px-1">
            Something went wrong. Please try again.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-4 border-t border-gray-800 shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            placeholder="Describe your voice agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={isBusy}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isBusy ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getMessageText(message: UIMessage): string {
  return (
    message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ?? ""
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = getMessageText(message);

  if (!text) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-gray-800 text-gray-200 rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
