export function detectTrainingIntent(message) {
  const text = message.toLowerCase();

  // FORGET (user-scoped only)
  if (
    text.startsWith("forget that") ||
    text.startsWith("delete my note") ||
    text.startsWith("remove my personal")
  ) {
    return "forget";
  }

  // REPLACE
  if (
    text.includes("replace") ||
    text.includes("effective immediately") ||
    text.includes("this replaces") ||
    text.includes("update our")
  ) {
    return "replace";
  }

  // ADD (authoritative)
  if (
    text.includes("add this to training") ||
    text.includes("remember this going forward") ||
    text.includes("we should always") ||
    text.includes("this is our process")
  ) {
    return "add";
  }

  // FYI / reference
  if (
    text.includes("for context") ||
    text.includes("heads up") ||
    text.includes("not policy") ||
    text.includes("fyi")
  ) {
    return "reference";
  }

  // PERSONAL NOTE
  if (
    text.includes("remember this for me") ||
    text.includes("note for me") ||
    text.includes("my personal")
  ) {
    return "personal";
  }

  return null;
}
