import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button, CircleMark, Sheet, Text } from "@/components";
import { colors } from "@/theme";
import { authClient, liveMode, liveRequest } from "./client";
import { useLive } from "./LiveProvider";
import { LiveClient } from "./LiveClient";
import { LivePracticeWorkspace } from "./LivePracticeWorkspace";
import { LiveOperatorWorkspace } from "./LiveOperatorWorkspace";
import { LiveBookingDetail } from "./LiveBookingDetail";
import {
  LiveCard,
  LiveChip,
  LiveField,
  LiveNotice,
  LivePage,
  liveStyles,
} from "./ui";
import type { LiveInvitationPreview } from "./types";

export function LiveApp() {
  const { data: session, isPending } = authClient.useSession();
  const { data, loading, error, refresh, signOut } = useLive();
  const params = useLocalSearchParams<{
    invite?: string;
    token?: string;
    error?: string;
  }>();
  const [accepted, setAccepted] = useState(false);
  const [account, setAccount] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const invite = typeof params.invite === "string" ? params.invite : undefined;
  const resetToken =
    typeof params.token === "string" ? params.token : undefined;
  async function leave() {
    try {
      await signOut();
      setSignOutError("");
    } catch (e) {
      setSignOutError(e instanceof Error ? e.message : "Could not sign out.");
    }
  }
  if (isPending)
    return (
      <LivePage title="Circle">
        <ActivityIndicator color={colors.blue} />
      </LivePage>
    );
  if (resetToken)
    return (
      <LiveAuth
        resetToken={resetToken}
        onDone={() => router.replace("/beta")}
      />
    );
  if (!session || (invite && !accepted))
    return (
      <LiveAuth
        key={invite || "sign-in"}
        invite={invite}
        onDone={async () => {
          setAccepted(true);
          router.replace("/beta");
          await authClient.getSession();
          await refresh();
        }}
      />
    );
  if (loading && !data)
    return (
      <LivePage title="Opening your Circle">
        <ActivityIndicator color={colors.blue} />
      </LivePage>
    );
  if (!data)
    return (
      <LivePage title="Let’s reconnect">
        <LiveNotice
          error
          message={
            error ||
            "Your account is not ready yet. Open your invitation to finish setup."
          }
        />
        <Button title="Try again" onPress={() => void refresh()} />
        <Button
          title="Sign out"
          variant="tertiary"
          onPress={() => void leave()}
        />
        {signOutError ? <LiveNotice error message={signOutError} /> : null}
      </LivePage>
    );
  const unread = data.notifications.filter((n) => !n.readAt).length;
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={styles.top}>
        <View style={styles.brand}>
          <CircleMark size={24} color={colors.blue} />
          <Text variant="headline">Circle</Text>
          <Text variant="caption" color={colors.textSecondary}>
            BETA · CHANDIGARH
          </Text>
        </View>
        <View style={liveStyles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ""}`}
            onPress={() => setNotifications(true)}
            style={styles.icon}
          >
            <Feather name="bell" size={22} color={colors.textPrimary} />
            {unread ? <View style={styles.dot} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My account"
            onPress={() => setAccount(true)}
            style={styles.account}
          >
            <Text variant="headline" color={colors.blue}>
              {data.profile.name.trim().slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>
      {data.profile.role === "practitioner" ? (
        <LivePracticeWorkspace />
      ) : data.profile.role === "operator" ? (
        <LiveOperatorWorkspace />
      ) : (
        <LiveClient />
      )}
      <Sheet
        visible={account}
        title="My account"
        onClose={() => setAccount(false)}
      >
        <LiveAccount onClose={() => setAccount(false)} />
      </Sheet>
      <Sheet
        visible={notifications}
        title="Updates"
        onClose={() => setNotifications(false)}
      >
        <LiveNotifications onClose={() => setNotifications(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

function LiveAuth({
  invite,
  resetToken,
  onDone,
}: {
  invite?: string;
  resetToken?: string;
  onDone: () => void | Promise<void>;
}) {
  const { data: session } = authClient.useSession();
  const [preview, setPreview] = useState<LiveInvitationPreview | null>(null);
  const [checking, setChecking] = useState(Boolean(invite));
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [existing, setExisting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mailEnabled, setMailEnabled] = useState(false);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    let alive = true;
    liveRequest<{ emailDelivery: boolean }>("/health")
      .then((r) => {
        if (alive) setMailEnabled(r.emailDelivery);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!invite) return;
    let active = true;
    liveRequest<LiveInvitationPreview>(
      `/invitations/preview?token=${encodeURIComponent(invite)}`,
    )
      .then((value) => {
        if (active) {
          setPreview(value);
          setEmail(value.email);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [invite]);
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (resetToken) {
        const r = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        });
        if (r.error) throw new Error(r.error.message);
        setMessage("Password updated. You can sign in now.");
        setPassword("");
        return;
      }
      if (recovery) {
        const r = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: `${Platform.OS === "web" ? window.location.origin : "circle://"}${Platform.OS === "web" ? "/beta" : "beta"}`,
        });
        if (r.error) throw new Error(r.error.message);
        setMessage(
          "If this address has an account, a recovery email has been queued. Check your inbox.",
        );
        return;
      }
      if (invite && !consent)
        throw new Error("Please read and accept the invitation first.");
      if (invite && session) {
        if (session.user.email.toLowerCase() !== preview?.email.toLowerCase())
          throw new Error(
            "This invitation belongs to a different email. Sign out and use the invited account.",
          );
        await liveRequest("/invitations/accept", { token: invite }, "POST");
      } else if (invite && !existing) {
        const r = await authClient.signUp.email(
          { name: name.trim(), email: email.trim(), password },
          { headers: { "x-circle-invitation": invite } },
        );
        if (r.error)
          throw new Error(r.error.message || "Could not create your account.");
      } else {
        const r = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (r.error) throw new Error(r.error.message || "Could not sign in.");
        if (invite)
          await liveRequest("/invitations/accept", { token: invite }, "POST");
      }
      setPassword("");
      await onDone();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not connect to Circle. Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <LivePage title="">
      <View style={styles.authBrand}>
        <CircleMark size={34} color={colors.blue} />
        <Text variant="title2">Circle</Text>
        <Text color={colors.textSecondary}>by Swasth</Text>
      </View>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {resetToken
            ? "A fresh start."
            : invite
              ? "You’re invited."
              : "Your health.\nYour people."}
        </Text>
        <Text color={colors.textSecondary} style={{ maxWidth: 440 }}>
          {resetToken
            ? "Choose a new password for your Circle."
            : invite
              ? "A little more care, together."
              : "A calmer way to find care and keep the people who matter close."}
        </Text>
      </View>
      <LiveCard>
        <Text variant="title2">
          {resetToken
            ? "Reset password"
            : recovery
              ? "Recover your account"
              : invite
                ? preview?.purpose === "family"
                  ? "Join your family’s Circle"
                  : `Join the ${preview?.role === "operator" ? "operator " : preview?.role === "practitioner" ? "practitioner " : ""}beta`
                : "Welcome back"}
        </Text>
        {checking ? <ActivityIndicator color={colors.blue} /> : null}
        {preview ? (
          <>
            <Text>
              {preview.inviterName} invited {preview.email}.
            </Text>
            <LiveNotice message={preview.consentText} />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              onPress={() => setConsent((v) => !v)}
              style={styles.consent}
            >
              <Feather
                name={consent ? "check-square" : "square"}
                size={25}
                color={colors.blue}
              />
              <Text style={{ flex: 1 }}>
                {preview.purpose === "family"
                  ? "I allow this shared access."
                  : "I accept this invitation."}
              </Text>
            </Pressable>
          </>
        ) : null}
        {invite && session ? (
          <Text color={colors.textSecondary}>
            Signed in as {session.user.email}
          </Text>
        ) : (
          <>
            {invite && !existing && !resetToken ? (
              <LiveField
                label="Your name"
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                maxLength={80}
              />
            ) : null}
            {!resetToken ? (
              <LiveField
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="you@example.com"
                maxLength={160}
              />
            ) : null}
            {!recovery ? (
              <LiveField
                label={
                  resetToken || (invite && !existing)
                    ? "Password · at least 12 characters"
                    : "Password"
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                maxLength={128}
              />
            ) : null}
          </>
        )}
        {error ? <LiveNotice error message={error} /> : null}
        {message ? <LiveNotice message={message} /> : null}
        {resetToken && message ? (
          <Button title="Back to sign in" onPress={() => void onDone()} />
        ) : (
          <Button
            title={
              resetToken
                ? "Save new password"
                : recovery
                  ? "Send recovery email"
                  : invite
                    ? session
                      ? "Accept invitation"
                      : existing
                        ? "Sign in & accept"
                        : "Create my account"
                    : "Sign in"
            }
            loading={busy}
            disabled={
              checking ||
              (!!invite && (!preview || !consent)) ||
              (!session &&
                !recovery &&
                password.length <
                  ((invite && !existing) || resetToken ? 12 : 1))
            }
            onPress={() => void submit()}
          />
        )}
        {invite && !session ? (
          <Button
            title={
              existing ? "Create a new account" : "I already have an account"
            }
            variant="tertiary"
            onPress={() => {
              setExisting((v) => !v);
              setError("");
            }}
          />
        ) : null}
        {invite && session ? (
          <Button
            title="Use a different account"
            variant="tertiary"
            onPress={async () => {
              const r = await authClient.signOut();
              if (r.error) setError(r.error.message || "Could not sign out.");
            }}
          />
        ) : null}
        {!invite && !resetToken && mailEnabled ? (
          <Button
            title={recovery ? "Back to sign in" : "Forgot password?"}
            variant="tertiary"
            onPress={() => {
              setRecovery((v) => !v);
              setError("");
              setMessage("");
            }}
          />
        ) : null}
        {!invite && !resetToken ? (
          <Text variant="footnote" color={colors.textSecondary}>
            New here? Open the invitation shared by your Circle organiser or
            practitioner team.
          </Text>
        ) : null}
      </LiveCard>
      <Text variant="footnote" color={colors.textSecondary} align="center">
        Chandigarh beta · Appointments and shared care
      </Text>
      {!liveMode ? (
        <Button
          title="Explore the sample app"
          variant="tertiary"
          onPress={() => router.replace("/onboarding")}
        />
      ) : null}
    </LivePage>
  );
}

function LiveAccount({ onClose }: { onClose: () => void }) {
  const { data, mutate, get, signOut } = useLive();
  const [name, setName] = useState(data?.profile.name || "");
  const [view, setView] = useState(data?.profile.viewPreference || "standard");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  if (!data) return null;
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function exportAccount() {
    const result = await get("/account/export");
    const json = JSON.stringify(result, null, 2);
    if (Platform.OS === "web") {
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "circle-account.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else await Share.share({ title: "Circle account export", message: json });
  }
  return (
    <View style={liveStyles.stack}>
      <Text color={colors.textSecondary}>
        {data.profile.email} ·{" "}
        {data.profile.role === "client"
          ? "Personal account"
          : data.profile.role === "operator"
            ? "Circle operator"
            : "Practitioner"}
      </Text>
      <LiveField
        label="Your name"
        value={name}
        onChangeText={setName}
        maxLength={80}
      />
      {data.profile.role === "client" ? (
        <>
          <Text variant="headline">Your view</Text>
          <View style={liveStyles.wrap}>
            <LiveChip
              label="Standard"
              selected={view === "standard"}
              onPress={() => setView("standard")}
            />
            <LiveChip
              label="Simple"
              selected={view === "simple"}
              onPress={() => setView("simple")}
            />
          </View>
          <Text variant="footnote" color={colors.textSecondary}>
            Simple view starts with your next appointment and larger, direct
            actions.
          </Text>
        </>
      ) : null}
      <Button
        title="Save changes"
        loading={busy}
        onPress={() =>
          void run(async () => {
            await mutate("/profile", { name, viewPreference: view }, "PUT");
            setMessage("Your preferences are saved.");
          })
        }
      />
      {error ? <LiveNotice error message={error} /> : null}
      {message ? <LiveNotice message={message} /> : null}
      <Button
        title="Download my information"
        variant="secondary"
        disabled={busy}
        onPress={() => void run(exportAccount)}
      />
      <Text variant="footnote" color={colors.textSecondary}>
        Your appointments are shared with the practitioner and family members
        you authorise. Operators can manage booking status and listings; health
        notes are hidden from their workspace.
      </Text>
      <Button
        title="Sign out"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          void run(async () => {
            await signOut();
            onClose();
          })
        }
      />
      {data.profile.role !== "operator" ? (
        <Button
          title={closing ? "Keep my account" : "Close my account"}
          variant="tertiary"
          disabled={busy}
          onPress={() => setClosing((v) => !v)}
        />
      ) : null}
      {closing ? (
        <>
          <LiveNotice message="Closing cancels your upcoming appointments, removes family access and signs you out. Your account details are anonymised. Minimal booking and operational records remain for accountability. This cannot be undone." />
          <LiveField
            label="Type DELETE to close your account"
            value={confirmation}
            onChangeText={setConfirmation}
            maxLength={6}
          />
          <Button
            title="Permanently close account"
            disabled={confirmation !== "DELETE" || busy}
            onPress={() =>
              void run(async () => {
                await mutate("/account/close", { confirmation });
                await signOut();
                onClose();
              })
            }
          />
        </>
      ) : null}
    </View>
  );
}

function LiveNotifications({ onClose }: { onClose: () => void }) {
  const { data, mutate } = useLive();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  if (!data) return null;
  const booking = data.bookings.find((b) => b.id === bookingId);
  if (booking)
    return (
      <LiveBookingDetail booking={booking} onClose={() => setBookingId(null)} />
    );
  return (
    <View style={liveStyles.stack}>
      {error ? <LiveNotice error message={error} /> : null}
      {data.notifications.length ? (
        data.notifications.map((n) => (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            onPress={async () => {
              try {
                if (!n.readAt) await mutate(`/notifications/${n.id}/read`);
                if (n.bookingId) setBookingId(n.bookingId);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not load update.",
                );
              }
            }}
            style={[
              liveStyles.card,
              !n.readAt && { backgroundColor: colors.blueTint },
            ]}
          >
            <Text variant="headline">{n.title}</Text>
            <Text color={colors.textSecondary}>{n.body}</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {new Date(n.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </Text>
          </Pressable>
        ))
      ) : (
        <LiveNotice message="You’re all caught up. Appointment updates will appear here." />
      )}
      <Button title="Done" variant="tertiary" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    right: 9,
    top: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  account: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  authBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
  },
  hero: { gap: 20, paddingTop: 28, paddingBottom: 20 },
  heroTitle: {
    fontSize: 46,
    lineHeight: 51,
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  consent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
  },
});
