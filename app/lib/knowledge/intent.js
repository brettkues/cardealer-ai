export function detectTrainingIntent(message) {
  const text = message.toLowerCase().trim();

  // FORGET — any reasonable human phrasing
  if (
    text.startsWith("forget ") ||
    text.startsWith("forget that") ||
    text.startsWith("delete my") ||
    text.startsWith("remove my") ||
    text.startsWith("stop remembering")
  ) {
    return "forget";
  }

  // PERSONAL NOTE
  if (
    text.includes("remember this for me") ||
    text.includes("note for me") ||
    text.startsWith("i like ") ||
    text.startsWith("my preference is")
  ) {
    return "personal";
  }

  // REPLACE (authoritative)
  if (
    text.includes("effective immediately") ||
    text.includes("this replaces") ||
    text.includes("update our") ||
    text.includes("no longer")
  ) {
    return "replace";
  }

  // ADD (authoritative)
  if (
    text.includes("we should always") ||
    text.includes("this is our process") ||
    text.includes("from now on")
  ) {
    return "add";
  }

  // FYI / reference
  if (
    text.includes("for context") ||
    text.includes("heads up") ||
    text.startsWith("fyi")
  ) {
    return "reference";
  }

  return null;
}
