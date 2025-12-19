export function detectTrainingIntent(message) {
  const text = message.toLowerCase().trim();

  // 🔒 FORGET — must be an explicit command
  if (
    text === "forget" ||
    text.startsWith("forget ") ||
    text.startsWith("forget that ") ||
    text.startsWith("delete my ") ||
    text.startsWith("remove my ")
  ) {
    return "forget";
  }

  // PERSONAL MEMORY — explicit only
  if (
    text.startsWith("remember this for me") ||
    text.startsWith("remember for me")
  ) {
    return "personal";
  }

  // AUTHORITATIVE ADD
  if (
    text.startsWith("we should always") ||
    text.startsWith("this is our process")
  ) {
    return "add";
  }

  // REPLACE POLICY
  if (
    text.includes("effective immediately") ||
    text.includes("this replaces")
  ) {
    return "replace";
  }

  // FYI / NON-BINDING
  if (text.startsWith("fyi")) {
    return "reference";
  }

  return null;
}
