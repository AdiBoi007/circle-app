import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const production = process.env.NODE_ENV === "production";
const databaseUrl =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("Set DATABASE_URL (TEST_DATABASE_URL for tests).");
const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 32)
  throw new Error("AUTH_SECRET must contain at least 32 random characters.");
const apiUrl = process.env.API_URL || "http://localhost:8787";
const appUrl = process.env.APP_URL || "http://localhost:8081";
if (
  production &&
  (!apiUrl.startsWith("https://") || !appUrl.startsWith("https://"))
)
  throw new Error("Production URLs must use HTTPS.");
export const config = {
  production,
  databaseUrl,
  secret,
  apiUrl,
  appUrl,
  port: Number(process.env.PORT || 8787),
  host: process.env.HOST || "127.0.0.1",
  mailEnabled:
    process.env.MAIL_TRANSPORT === "resend" &&
    !!process.env.RESEND_API_KEY &&
    !!process.env.MAIL_FROM,
  mailKey: process.env.RESEND_API_KEY || "",
  mailFrom: process.env.MAIL_FROM || "",
};
