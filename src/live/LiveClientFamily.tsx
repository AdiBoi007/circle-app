import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Keyboard,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from "react-native";

import { Button, Sheet, Text } from "@/components";
import { liveClientDate } from "@/live/LiveClientRequest";
import { useLive } from "@/live/LiveProvider";
import type { LiveFamilyLink, LiveInvitation } from "@/live/types";
import { dateLabel, LiveCard, LiveField, LiveNotice } from "@/live/ui";
import { colors, spacing } from "@/theme";

type Removal =
  | { kind: "family"; item: LiveFamilyLink }
  | { kind: "invitation"; item: LiveInvitation };
type CreatedInvitation = { id: string; url: string; email: string };

export function LiveClientFamily() {
  const { data, mutate, refresh } = useLive();
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const creating = useRef(false);
  const revoking = useRef(false);
  if (!data) return null;

  const links = data.familyLinks.filter(
    (link) => link.status === "Active" && !revokedIds.includes(link.id),
  );
  const supporting = links.filter(
    (link) => link.organiserId === data.profile.id,
  );
  const supporters = links.filter((link) => link.memberId === data.profile.id);
  const invitations = data.invitations.filter(
    (invitation) =>
      invitation.purpose === "family" &&
      invitation.status === "Pending" &&
      Date.parse(invitation.expiresAt) > Date.parse(data.serverTime) &&
      !revokedIds.includes(invitation.id),
  );
  const currentInvitation = data.invitations.find(
    (invitation) => invitation.id === created?.id,
  );
  const shareable =
    created &&
    !revokedIds.includes(created.id) &&
    (!currentInvitation ||
      invitations.some((invitation) => invitation.id === created.id));

  async function invite() {
    if (creating.current || !data) return;
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter your relative’s email address.");
      return;
    }
    if (address === data.profile.email.toLowerCase()) {
      setError("Use your relative’s email address, rather than your own.");
      return;
    }
    creating.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    Keyboard.dismiss();
    try {
      const result = await mutate<{ id: string; url: string }>("/invitations", {
        email: address,
        purpose: "family",
      });
      setCreated({ ...result, email: address });
      setEmail("");
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The invitation could not be created. Check the pending invitations before trying again.",
      );
    } finally {
      creating.current = false;
      setBusy(false);
    }
  }

  async function shareLink() {
    if (!created) return;
    try {
      await Share.share({
        message: `Review my invitation to coordinate care together on Circle: ${created.url}`,
      });
    } catch {
      setError(
        "Sharing did not open. You can select and copy the invitation link below.",
      );
    }
  }

  async function revoke() {
    if (!removal || revoking.current) return;
    revoking.current = true;
    setRemoving(true);
    setRemoveError("");
    Keyboard.dismiss();
    try {
      const path =
        removal.kind === "family"
          ? `/family/${encodeURIComponent(removal.item.id)}/revoke`
          : `/invitations/${encodeURIComponent(removal.item.id)}/revoke`;
      await mutate(path, {});
      setRevokedIds((current) => [...current, removal.item.id]);
      if (created?.id === removal.item.id) setCreated(null);
      setNotice(
        removal.kind === "family"
          ? "Family access has been revoked."
          : "The invitation has been revoked. Its link no longer grants access.",
      );
      setRemoval(null);
      await refresh();
    } catch (reason) {
      setRemoveError(
        reason instanceof Error
          ? reason.message
          : "Access could not be revoked. Please try again.",
      );
    } finally {
      revoking.current = false;
      setRemoving(false);
    }
  }

  function openRemoval(value: Removal) {
    Keyboard.dismiss();
    setRemoveError("");
    setRemoval(value);
  }

  return (
    <View style={styles.page}>
      <Text variant="callout" color={colors.textSecondary}>
        Care together, with permission. Each person decides who can manage their
        appointments and see practitioner follow-ups.
      </Text>
      {notice ? <LiveNotice message={notice} /> : null}

      <View style={styles.section}>
        <Text variant="title3">People you support</Text>
        {supporting.length ? (
          <View style={styles.group}>
            {supporting.map((link, index) => (
              <FamilyRow
                key={link.id}
                name={link.memberName}
                description="You can manage this person’s appointments and view their practitioner follow-ups."
                separated={index > 0}
                onRemove={() => openRemoval({ kind: "family", item: link })}
              />
            ))}
          </View>
        ) : (
          <LiveCard>
            <Text variant="headline">No family connections yet</Text>
            <Text variant="callout" color={colors.textSecondary}>
              Invite a relative below. They must accept before you can request
              care on their behalf.
            </Text>
          </LiveCard>
        )}
      </View>
      <View style={styles.section}>
        <Text variant="title3">People supporting you</Text>
        {supporters.length ? (
          <View style={styles.group}>
            {supporters.map((link, index) => (
              <FamilyRow
                key={link.id}
                name={link.organiserName}
                description="This person can manage your appointments and see practitioner follow-ups. You can revoke access."
                separated={index > 0}
                onRemove={() => openRemoval({ kind: "family", item: link })}
              />
            ))}
          </View>
        ) : (
          <Text variant="callout" color={colors.textSecondary}>
            You haven’t granted anyone access to coordinate your care.
          </Text>
        )}
      </View>

      <LiveCard>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Feather name="user-plus" size={22} color={colors.blue} />
          </View>
          <View style={styles.flex}>
            <Text variant="title3">Invite a relative</Text>
            <Text variant="footnote" color={colors.textSecondary}>
              They review and accept the sharing scope.
            </Text>
          </View>
        </View>
        <LiveField
          label="Their email address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError("");
          }}
          keyboardType="email-address"
          placeholder="relative@example.com"
          maxLength={160}
        />
        <Text variant="footnote" color={colors.textSecondary}>
          If they accept, you can manage their appointments and see practitioner
          follow-ups. This does not give them access to your appointments.
        </Text>
        {error ? <LiveNotice message={error} error /> : null}
        <Button
          title="Create invitation link"
          onPress={() => void invite()}
          loading={busy}
          disabled={!email.trim() || removing}
        />
      </LiveCard>

      {shareable && created ? (
        <LiveCard>
          <Text variant="headline">Invitation link ready</Text>
          <Text variant="callout" color={colors.textSecondary}>
            Share this link privately with {created.email}. They must use that
            email to accept.
          </Text>
          <View style={styles.linkBox}>
            <Text selectable variant="footnote" color={colors.blue}>
              {created.url}
            </Text>
          </View>
          {Platform.OS === "web" ? (
            <Text variant="footnote" color={colors.textSecondary}>
              Select the link to copy it.
            </Text>
          ) : (
            <Button
              title="Share invitation link"
              variant="secondary"
              onPress={() => void shareLink()}
            />
          )}
          <Text variant="footnote" color={colors.textSecondary}>
            Creating a link does not mean an email has been delivered or that
            access has been accepted.
          </Text>
        </LiveCard>
      ) : null}

      {invitations.length ? (
        <View style={styles.section}>
          <Text variant="title3">Pending invitations</Text>
          <View style={styles.group}>
            {invitations.map((invitation, index) => (
              <View
                key={invitation.id}
                style={[styles.invitation, index > 0 && styles.divider]}
              >
                <View style={styles.flex}>
                  <Text variant="headline">{invitation.email}</Text>
                  <Text variant="footnote" color={colors.textSecondary}>
                    Awaiting acceptance · expires{" "}
                    {dateLabel(liveClientDate(invitation.expiresAt))} IST
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Revoke invitation to ${invitation.email}`}
                  onPress={() =>
                    openRemoval({ kind: "invitation", item: invitation })
                  }
                  style={styles.revoke}
                >
                  <Text variant="footnote" color={colors.red}>
                    Revoke
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Sheet
        visible={Boolean(removal)}
        title={
          removal?.kind === "family"
            ? "Revoke family access?"
            : "Revoke invitation?"
        }
        onClose={() => {
          if (!revoking.current) setRemoval(null);
        }}
        footer={
          <View style={styles.section}>
            <Button
              title="Revoke access"
              onPress={() => void revoke()}
              loading={removing}
              disabled={busy}
            />
            <Button
              title="Keep access"
              variant="tertiary"
              onPress={() => setRemoval(null)}
              disabled={removing}
            />
          </View>
        }
      >
        <View style={styles.section}>
          <Text variant="callout">
            {removal?.kind === "family"
              ? "This connection will no longer allow the organiser to act on the member’s behalf. Existing appointment records remain subject to each person’s own access."
              : `The invitation for ${removal?.item.email ?? "this person"} will no longer work. They will need a new invitation to join.`}
          </Text>
          {removeError ? <LiveNotice message={removeError} error /> : null}
        </View>
      </Sheet>
    </View>
  );
}

function FamilyRow({
  name,
  description,
  separated,
  onRemove,
}: {
  name: string;
  description: string;
  separated: boolean;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.familyRow, separated && styles.divider]}>
      <View style={styles.flex}>
        <Text variant="headline">{name}</Text>
        <Text variant="footnote" color={colors.textSecondary}>
          {description}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Revoke family access with ${name}`}
        onPress={onRemove}
        style={styles.revoke}
      >
        <Text variant="footnote" color={colors.red}>
          Revoke
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.xxl },
  section: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueTint,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  familyRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  revoke: {
    minHeight: 48,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  invitation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  linkBox: {
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
