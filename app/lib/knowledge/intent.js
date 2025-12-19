export function detectTrainingIntent(message) {
  const text = message.toLowerCase().trim();

  // FORGET — must explicitly say forget/delete/remove
  if (
    text.startsWith("forget ") ||
    text.startsWith("delete ") ||
    text.startsWith("remove ")
  ) {
    return "forget";
  }

  // PERSONAL NOTE
  if (
    text.startsWith("remember this for me") ||
    text.startsWith("i like ") ||
    text.startsWith("my preference is")
  ) {
    return "personal";
  }

  // REPLACE (policy change)
  if (
    text.includes("effective immediately") ||
    text.includes("this replaces") ||
    text.includes("no longer")
  ) {
    return "replace";
  }

  // ADD (authoritative)
  if (
    text.includes("we should always") ||
    text.includes("this is our process")
  ) {
    return "add";
  }

  // FYI
  if (text.startsWith("fyi")) {
    return "reference";
  }

  return null;
}
