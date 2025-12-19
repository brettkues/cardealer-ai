export function detectTrainingIntent(message) {
  if (!message) return null;

  const text = message.toLowerCase().trim();

  // EXPLICIT FORGET ONLY
  if (
    text === "forget" ||
    text.startsWith("forget ") ||
    text.startsWith("forget that ") ||
    text.startsWith("delete my ") ||
    text.startsWith("remove my ")
  ) {
    return "forget";
  }

  // EXPLICIT PERSONAL MEMORY ONLY
  if (
    text.startsWith("remember this for me") ||
    text.startsWith("remember for me")
  ) {
    return "personal";
  }

  // DEALERSHIP POLICY ADD
  if (text.startsWith("policy:")) {
    return "add";
  }

  // POLICY REPLACE
  if (text.startsWith("replace policy:")) {
    return "replace";
  }

  return null;
}
