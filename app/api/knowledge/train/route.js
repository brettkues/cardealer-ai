import { NextResponse } from "next/server";
import { detectTrainingIntent } from "../../../lib/knowledge/intent";
import { insertKnowledge } from "../../../lib/knowledge/insert";
import { replaceKnowledge } from "../../../lib/knowledge/replace";
import { writeKnowledgeAudit } from "../../../lib/knowledge/audit";
import { supabase } from "../../../lib/supabaseClient";

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

  // FORGET personal knowledge
  if (intent === "forget") {
    if (!user?.id) {
      return NextResponse.json({ trained: false });
    }

    // Soft-delete matching personal notes
    await supabase
      .from("knowledge")
      .update({ status: "deleted" })
      .eq("scope", "user")
      .eq("authority", "personal")
      .eq("owner_user_id", user.id)
      .ilike("content", `%${message.replace(/forget that/i, "").trim()}%`);

    await writeKnowledgeAudit({
      action: "personal_forget",
      knowledgeId: null,
      userId: user.id,
      role: user.role,
      domain,
    });

    return NextResponse.json({ trained: true });
  }

  // PERSONAL notes (any user)
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

  // GLOBAL training requires manager/admin
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
      oldKnowledgeIds: [],
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
