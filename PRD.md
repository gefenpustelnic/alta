# PRD: Alta AI Voice Agent Builder

## Problem Statement

Sales and outreach teams need voice AI assistants that can autonomously call leads, qualify them with targeted questions, and book meetings — but configuring such agents today requires technical knowledge, navigating complex dashboards, and understanding provider-specific APIs. Non-technical users are locked out of building and iterating on their own voice agents.

## Solution

A web platform where users describe their desired voice AI assistant in plain English. An AI builder (powered by Claude) interprets their description, generates a fully-configured Vapi voice agent, and allows the user to refine it conversationally. The resulting agent can immediately call a phone number, qualify the lead through a natural conversation, and direct them to book a meeting via a Calendly link.

## User Stories

1. As a user, I want to open the platform and see a chat interface, so that I can start describing my agent without any onboarding friction.
2. As a user, I want to describe my agent in plain English (e.g. "I want an agent that calls solar energy leads"), so that I don't need to understand Vapi's configuration schema.
3. As a user, I want to see the agent configuration take shape in real time on the right panel as I chat, so that I have visual confirmation the system understood me.
4. As a user, I want Claude's responses to stream in character by character, so that the interface feels responsive and alive.
5. As a user, I want to see my agent's name, voice, system prompt, first message, and qualification questions displayed in the preview panel, so that I can review exactly how it will behave.
6. As a user, I want to edit my agent conversationally after it's created (e.g. "make it sound more friendly" or "add a question about budget"), so that I can iterate without re-describing everything from scratch.
7. As a user, I want to see the preview panel update immediately when I request an edit, so that I get instant feedback on each change.
8. As a user, I want to enter my phone number in the preview panel, so that I can test the agent by receiving a real call.
9. As a user, I want to click a "Call Me Now" button, so that Vapi initiates an outbound call to my phone using my configured agent.
10. As a user, I want my agent to greet me by name and introduce itself when the call connects, so that the call feels natural and professional.
11. As a user, I want the agent to ask me qualification questions during the call, so that I can experience the full lead qualification flow.
12. As a user, I want the agent to share a Calendly link when I'm qualified, so that I can book a meeting to close the loop.
13. As a user, I want the platform to work without creating an account, so that I can test the experience immediately.
14. As a user, I want to access the platform from any browser via a public URL, so that the Alta team can test it without running it locally.
15. As a user, I want the chat history to persist within my session, so that I can refer back to earlier decisions about my agent.

## Implementation Decisions

- **Frontend framework:** Next.js (App Router) deployed to Vercel. API routes handle Claude and Vapi calls server-side to keep API keys out of the browser.
- **UI layout:** Split-screen — chat interface on the left, live agent config preview panel on the right. The preview panel shows agent name, selected voice, system prompt, first message, and qualification questions as structured fields.
- **AI builder:** Claude API with tool use. Claude is given a `create_agent` and `update_agent` tool that maps natural language to a Vapi assistant configuration object. When Claude calls a tool, the frontend applies the diff to the preview panel.
- **Streaming:** Claude responses stream via the Vercel AI SDK (`useChat` hook), so the chat feels real-time. Tool calls are surfaced as structured events and applied to the preview panel without interrupting the stream.
- **Voice agent provider:** Vapi.ai. The Next.js API route calls Vapi's REST API to create or update an assistant when Claude emits a tool call. A separate endpoint triggers an outbound call to the user's phone number.
- **Agent configuration shape:** name, voice (Vapi voice ID), systemPrompt, firstMessage, qualificationQuestions (array of strings), calendlyUrl.
- **Meeting booking:** The agent's system prompt includes the user's Calendly URL. When the lead is qualified, the agent verbally directs them to check their SMS/email for the link (Vapi can send an SMS via webhook, or the agent simply reads the URL aloud).
- **Call trigger:** A "Call Me Now" button in the preview panel, gated on a valid phone number input. Calls Vapi's outbound call API with the current assistant ID and the entered phone number.
- **Session state:** Agent config is held in React state (no database). Refreshing the page resets the session — acceptable for a demo.
- **No authentication:** The platform is open, single-session. No login, no user accounts.
- **Deployment:** Vercel. Environment variables: `ANTHROPIC_API_KEY`, `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`.

## Testing Decisions

Good tests verify observable behavior from the outside — what a user sees or what an API returns — not internal implementation details like which function was called.

- **AI builder tool calls:** Test that given a natural language prompt, the Claude integration emits a valid Vapi assistant configuration object (correct keys, non-empty strings, well-formed qualificationQuestions array). Mock the Claude API at the HTTP boundary.
- **Vapi API integration:** Test that the Next.js API route correctly maps an agent config object to a Vapi `POST /assistant` request body. Mock Vapi at the HTTP boundary.
- **Edit flow:** Test that a follow-up message (e.g. "make it friendlier") produces a config update that differs from the original in the expected field while leaving others unchanged.
- **Call trigger endpoint:** Test that the `/api/call` route rejects missing phone numbers and returns a 200 with a call ID on success (Vapi mocked).
- **Prior art:** No existing tests in the codebase (greenfield project). Use Jest + MSW for API mocking.

## Out of Scope

- Multiple agents per session or agent management (list, delete, switch)
- User authentication or persistent accounts
- Real calendar integration (checking availability, creating events) — Calendly redirect only
- Agent analytics or call recording playback
- Multi-turn call logic beyond the basic qualify → book flow
- Support for inbound calls
- Custom voice cloning
- CRM integrations (HubSpot, Salesforce, etc.)
- Mobile-optimized UI

## Further Notes

- The $50 Vapi credit should comfortably cover all development testing and the demo call.
- The video deliverable should follow the arc: describe agent → watch it build → call yourself → edit it → call again to hear the difference. A script will be prepared once the build is complete.
- The real estate vertical was considered as a default use case but rejected in favor of letting the user describe their own use case from scratch — this better demonstrates the flexibility of the AI builder.
