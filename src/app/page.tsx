"use client";

import { useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import AgentPreviewPanel from "@/components/AgentPreviewPanel";
import { AgentConfig } from "@/types/agent";

export default function Home() {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  return (
    <main className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <div className="flex flex-col w-1/2 border-r border-gray-800">
        <Header />
        <ChatPanel
          agentConfig={agentConfig}
          assistantId={assistantId}
          onAgentConfig={setAgentConfig}
          onAssistantId={setAssistantId}
        />
      </div>
      <div className="flex flex-col w-1/2">
        <AgentPreviewPanel config={agentConfig} assistantId={assistantId} />
      </div>
    </main>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800 shrink-0">
      <div className="w-2 h-2 rounded-full bg-emerald-400" />
      <span className="text-sm font-medium text-gray-300">Alta — AI Voice Agent Builder</span>
    </div>
  );
}
