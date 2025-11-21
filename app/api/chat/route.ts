// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { runTbMentorTurn } from "../../../lib/orchestrator";
import type { ChatMessage } from "../../../lib/llmClient";

export const runtime = "nodejs"; // or "edge" if compatible

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userMessages = (body.messages || []) as ChatMessage[];

    // Basic validation / normalization: only user/assistant/tool roles from client
    const sanitized: ChatMessage[] = userMessages.map((m) => ({
      role: m.role,
      content: m.content,
      name: m.name,
      tool_call_id: m.tool_call_id
    }));

    const result = await runTbMentorTurn(sanitized);

    return NextResponse.json({
      reply: result.reply,
      // You can expose debug conditionally if you want
      // debug: result.debug
    });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
