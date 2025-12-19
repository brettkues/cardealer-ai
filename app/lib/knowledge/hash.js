import crypto from "crypto";

export function hashContent(content) {
  return crypto
    .createHash("sha256")
    .update(content.trim())
    .digest("hex");
}
