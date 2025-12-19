import { NextResponse } from "next/server";
import { detectTrainingIntent } from "@/app/lib/knowledge/intent";
import { insertKnowledge } from "@/app/lib/knowledge/insert";
import { replaceKnowledge } from "@/app/lib/knowledge/replace";
import { writeKnowledgeAudit } from "@/app/lib/knowledge/audit";

export async function POST(req) {
  const {
    message,
    domain,
    department = null,
    user,
  } = await req.json();

  const intent = detectTrainingIntent(message);
  if (!intent) {
    return NextResponse.json({ trained: false });
  }

  const isManager = user?.role === "admin" || user?.role === "manager";

  // personal notes (any user)
  if (intent === "personal") {
    const record = await insertKnowledge({
      domain,
      department,
      content: message,
      authority: "personal",
      scope: "user",
      ownerUserId: user.id,
      addedByUserId: user.id,
    });

    await writeKnowledgeAudit({
      action: "personal_add",
      knowledgeId: record.knowledge_id,
      userId: user.id,
      role: user.role,
      domain,
    });

    return NextResponse.json({ trained: true });
  }

  // global training requires manager/admin
  if (!isManager) {
    return NextResponse.json({ trained: false });
  }

  if (intent === "add" || intent === "reference") {
    const record = await insertKnowledge({
      domain,
      department,
      content: message,
      authority: intent === "add" ? "approved" : "reference",
      scope: "global",
      addedByUserId: user.id,
    });

    await writeKnowledgeAudit({
      action: intent,
      knowledgeId: record.knowledge_id,
      userId: user.id,
      role: user.role,
      domain,
    });

    return NextResponse.json({ trained: true });
  }

  if (intent === "replace") {
    await replaceKnowledge({
      oldKnowledgeIds: [], // resolved later
      newKnowledgeParams: {
        domain,
        department,
        content: message,
        authority: "approved",
        scope: "global",
        addedByUserId: user.id,
      },
      audit: {
        userId: user.id,
        role: user.role,
      },
    });

    return NextResponse.json({ trained: true });
  }

  return NextResponse.json({ trained: false });
}
