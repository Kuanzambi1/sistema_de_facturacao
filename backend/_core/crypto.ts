import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the JWT_SECRET (or a fallback).
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET || "unsafe-fallback-secret-for-dev";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptString(text: string): string {
  if (!text) return text;
  
  // If it's already encrypted, don't double encrypt
  if (text.split(":").length === 3) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:tag:encrypted (all base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

export function decryptString(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(":");
    // If it doesn't match the format, assume it's unencrypted legacy text
    if (parts.length !== 3) return encryptedText;
    
    const [ivStr, tagStr, dataStr] = parts;
    const iv = Buffer.from(ivStr, "base64");
    const tag = Buffer.from(tagStr, "base64");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(dataStr, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("[Crypto] Decryption failed:", err);
    return encryptedText; // Return original on failure (might be raw string)
  }
}
