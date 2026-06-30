"use client";

import { AgentConfig } from "@/types/agent";

interface AgentPreviewPanelProps {
  config: AgentConfig | null;
}

export default function AgentPreviewPanel({ config }: AgentPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-800 shrink-0">
        <h2 className="text-sm font-medium text-gray-300">Agent Preview</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {config ? (
          <AgentFields config={config} />
        ) : (
          <EmptyState />
        )}
      </div>

      <CallTrigger disabled={!config} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
        🤖
      </div>
      <p className="text-gray-500 text-sm max-w-xs">
        Your agent will appear here once you describe it in the chat.
      </p>
    </div>
  );
}

function AgentFields({ config }: { config: AgentConfig }) {
  return (
    <>
      <Field label="Name" value={config.name} />
      <Field label="Voice" value={config.voice} />
      <Field label="First Message" value={config.firstMessage} />
      <Field label="System Prompt" value={config.systemPrompt} multiline />
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Qualification Questions
        </label>
        <ol className="space-y-2">
          {config.qualificationQuestions.map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-200">
              <span className="text-emerald-400 font-mono shrink-0">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>
      <Field label="Calendly URL" value={config.calendlyUrl} />
    </>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        className={`bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 ${
          multiline ? "whitespace-pre-wrap leading-relaxed" : "truncate"
        }`}
      >
        {value || <span className="text-gray-600">—</span>}
      </div>
    </div>
  );
}

function CallTrigger({ disabled }: { disabled: boolean }) {
  return (
    <div className="px-5 py-4 border-t border-gray-800 shrink-0 space-y-3">
      <input
        type="tel"
        placeholder="+1 (555) 000-0000"
        disabled={disabled}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      />
      <button
        disabled={disabled}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
      >
        📞 Call Me Now
      </button>
    </div>
  );
}
