import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export { liveMode } from "./mode";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787"
).replace(/\/$/, "");
export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: "/api/auth",
  fetchOptions: { timeout: 20000 },
  plugins: [
    expoClient({
      scheme: "circle",
      storagePrefix: "circle-live",
      storage: SecureStore,
      disableCache: true,
    }),
  ],
});
export async function liveRequest<T>(
  path: string,
  body?: unknown,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
): Promise<T> {
  const headers: Record<string, string> = {
    "X-Circle-Client": Platform.OS === "web" ? "web" : "native",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (Platform.OS !== "web") headers.Cookie = await authClient.getCookie();
  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: Platform.OS === "web" ? "include" : "omit",
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.error ||
        data?.message ||
        `Circle could not complete this request (${response.status}).`,
    );
  return data as T;
}
