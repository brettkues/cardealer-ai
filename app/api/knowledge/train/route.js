import { NextResponse } from "next/server";
import { detectTrainingIntent } from "../../../lib/knowledge/intent";
import { insertKnowledge } from "../../../lib/knowledge/insert";
import { replaceKnowledge } from "../../../lib/knowledge/replace";
import { writeKnowledgeAudit } from "../../../lib/knowledge/audit";

export async function POST(req) {
  const body = await req.json();
  const intent = detectTrainingIntent(body.message);

  if (!intent) {
    return NextResponse.json({ ok: true });
  }

  if (intent === "forget") {
    await replaceKnowledge({
      domain: body.domain,
      authority: "personal",
      scope: "user",
      userId: body.user?.id || null,
      content: null,
    });

    await writeKnowledgeAudit({
      action: "forget",
      role: body.user?.role,
      domain: body.domain,
    });

    return NextResponse.json({ ok: true });
  }

  if (intent === "personal") {
    await insertKnowledge({
      domain: body.domain,
      authority: "personal",
      scope: "user",
      userId: body.user?.id || null,
      content: body.message.replace(/remember this for me:/i, "").trim(),
    });

    await writeKnowledgeAudit({
      action: "personal_add",
      role: body.user?.role,
      domain: body.domain,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
