import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { expo } from "@better-auth/expo";
import { pool, transaction } from "./db.js";
import { config } from "./config.js";
import { claimInvitation, invitationForToken } from "./invitations.js";
import { enqueueMail } from "./mail.js";

export const auth = betterAuth({
  database: pool,
  secret: config.secret,
  baseURL: config.apiUrl,
  basePath: "/api/auth",
  trustedOrigins: [
    config.appUrl,
    "circle://",
    ...(config.production ? [] : ["exp://"]),
  ],
  plugins: [expo()],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      if (!config.mailEnabled)
        throw new APIError("SERVICE_UNAVAILABLE", {
          message:
            "Password recovery email is not configured. Contact your Circle operator.",
        });
      await transaction((db) =>
        enqueueMail(
          db,
          user.email,
          "password-reset",
          {
            subject: "Reset your Circle password",
            text: `Use this link to reset your Circle password: ${url}\nIf you did not request this, ignore this message.`,
          },
          user.id,
        ),
      );
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 50,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        try {
          const invite = await invitationForToken(
            ctx.headers?.get("x-circle-invitation") || "",
          );
          if (
            invite.email !==
            String(ctx.body?.email || "")
              .trim()
              .toLowerCase()
          )
            throw new Error("Email does not match invitation.");
          if (
            typeof ctx.body?.name !== "string" ||
            ctx.body.name.trim().length < 2 ||
            ctx.body.name.length > 80
          )
            throw new Error("Enter your name (2–80 characters).");
        } catch (error) {
          throw new APIError("BAD_REQUEST", {
            message:
              error instanceof Error
                ? error.message
                : "A valid invitation is required.",
          });
        }
      }
      if (ctx.path === "/request-password-reset" && !config.mailEnabled)
        throw new APIError("SERVICE_UNAVAILABLE", {
          message:
            "Password recovery email is not configured. Contact your Circle operator.",
        });
      // Identity is bound to the invitation; address changes require a separately reviewed flow.
      if (ctx.path === "/change-email" || ctx.path === "/delete-user")
        throw new APIError("FORBIDDEN", {
          message: "Manage this from your Circle account.",
        });
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
        await claimInvitation(
          ctx.headers?.get("x-circle-invitation") || "",
          ctx.context.newSession.user,
        );
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, emailVerified: true } }),
      },
    },
    session: {
      create: {
        before: async (session) => {
          const { rows } = await pool.query(
            "SELECT closed_at FROM circle_profiles WHERE user_id=$1",
            [session.userId],
          );
          if (rows[0]?.closed_at) return false;
          return { data: session };
        },
      },
    },
  },
});
