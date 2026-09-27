import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Keyboard, StyleSheet, View } from "react-native";

import { Button, Text } from "@/components";
import { launchMarket } from "@/config/launch";
import { liveClientDate } from "@/live/LiveClientRequest";
import { useLive } from "@/live/LiveProvider";
import type { LiveBooking, LiveBootstrap } from "@/live/types";
import {
  dateLabel,
  LiveCard,
  LiveField,
  LiveNotice,
  price,
  timeLabel,
} from "@/live/ui";
import { colors, spacing } from "@/theme";

type Props = { booking: LiveBooking; onClose: () => void };

export function LiveBookingDetail({ booking, onClose }: Props) {
  const { data } = useLive();
  const current = data?.bookings.find((item) => item.id === booking.id);
  if (!data || !current)
    return (
      <View style={styles.page}>
        <LiveNotice message="This appointment is no longer available to your account. Your access may have changed." />
        <Button title="Close" onPress={onClose} />
      </View>
    );
  return (
    <BookingContent
      key={`${current.id}:${data.profile.id}`}
      booking={current}
      data={data}
      onClose={onClose}
    />
  );
}

function BookingContent({
  booking,
  data,
  onClose,
}: Props & { data: LiveBootstrap }) {
  const { mutate, refresh, error: connectionError } = useLive();
  const practice = data.practices.find(
    (item) => item.id === booking.practiceId,
  );
  const operator = data.profile.role === "operator";
  const owner =
    data.profile.role === "practitioner" &&
    practice?.ownerId === data.profile.id;
  const attendeeAccess =
    data.profile.role === "client" &&
    (booking.attendeeId === data.profile.id ||
      data.familyLinks.some(
        (link) =>
          link.status === "Active" &&
          link.organiserId === data.profile.id &&
          link.memberId === booking.attendeeId,
      ));
  const pending = booking.status === "Requested";
  const confirmed = booking.status === "Confirmed";
  const completed = booking.status === "Completed";
  const canConfirm =
    owner &&
    pending &&
    practice?.status === "Approved" &&
    Date.parse(booking.startsAt) > Date.parse(data.serverTime);
  const canCancel =
    (pending || confirmed) && (owner || operator || attendeeAccess);
  const canComplete =
    owner &&
    confirmed &&
    Date.parse(booking.endsAt) <= Date.parse(data.serverTime);
  const [sessionDetails, setSessionDetails] = useState(
    booking.sessionDetails ||
      (booking.mode === "In person" ? (practice?.address ?? "") : ""),
  );
  const [reasonAction, setReasonAction] = useState<"cancel" | "decline" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [committedVersion, setCommittedVersion] = useState<string | null>(null);
  const inFlight = useRef(false);
  const statusColor = pending
    ? colors.amber
    : confirmed
      ? colors.blue
      : completed
        ? colors.sage
        : colors.textSecondary;
  const awaitingRefresh = committedVersion === data.serverTime;
  const actionLocked = Boolean(busy) || awaitingRefresh;

  async function act(action: string, body: unknown, message: string) {
    if (inFlight.current || awaitingRefresh) return;
    inFlight.current = true;
    setBusy(action);
    setError("");
    setNotice("");
    Keyboard.dismiss();
    try {
      await mutate(
        `/bookings/${encodeURIComponent(booking.id)}/${action}`,
        body,
      );
      setCommittedVersion(data.serverTime);
      setNotice(message);
      setReasonAction(null);
      setReason("");
      setEditingFollowUp(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The update could not be completed. Refresh the appointment before trying again.",
      );
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function reload() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy("refresh");
    setError("");
    Keyboard.dismiss();
    try {
      await refresh();
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  function confirm() {
    if (!canConfirm) return;
    if (sessionDetails.trim().length < 5) {
      setError(
        "Add the visit address or online joining instructions before confirming.",
      );
      return;
    }
    void act(
      "confirm",
      { sessionDetails: sessionDetails.trim() },
      "Appointment confirmed.",
    );
  }

  function openReason(action: "cancel" | "decline") {
    Keyboard.dismiss();
    setReasonAction(action);
    setReason("");
    setEditingFollowUp(false);
    setError("");
    setNotice("");
  }

  function submitReason() {
    if (
      !reasonAction ||
      (reasonAction === "cancel" && !canCancel) ||
      (reasonAction === "decline" && !(owner && pending))
    )
      return;
    if (!reason.trim()) {
      setError("Add a reason so the people involved know what changed.");
      return;
    }
    void act(
      reasonAction,
      { reason: reason.trim() },
      reasonAction === "decline"
        ? "Request declined."
        : "Appointment cancelled.",
    );
  }

  function editFollowUp() {
    setFollowUpText(booking.followUp?.text ?? "");
    setDueDate(booking.followUp?.dueDate ?? "");
    setEditingFollowUp(true);
    setReasonAction(null);
    setError("");
    setNotice("");
  }

  function saveFollowUp() {
    if (!owner || !completed) return;
    const text = followUpText.trim();
    const date = dueDate.trim();
    const parsed = Date.parse(`${date}T00:00:00${launchMarket.utcOffset}`);
    const valid =
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(parsed) &&
      liveClientDate(new Date(parsed).toISOString()) === date;
    if (!text) {
      setError("Add the agreed follow-up instructions.");
      return;
    }
    if (
      !valid ||
      date < liveClientDate(data.serverTime) ||
      parsed > Date.parse(data.serverTime) + 366 * 86_400_000
    ) {
      setError(
        "Choose a valid follow-up date from today through the next year.",
      );
      return;
    }
    void act(
      "follow-up",
      { text, dueDate: date },
      "Follow-up instructions saved.",
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.heading}>
        <Text variant="subhead" color={statusColor}>
          {booking.status}
        </Text>
        <Text variant="title2">{booking.serviceName}</Text>
        <Text variant="callout" color={colors.textSecondary}>
          {booking.practitionerName}
        </Text>
      </View>
      <LiveCard>
        <Detail label="For" value={booking.attendeeName} />
        {booking.requesterId !== booking.attendeeId ? (
          <Detail label="Requested by" value={booking.requesterName} />
        ) : null}
        <Detail
          label="Appointment"
          value={`${dateLabel(booking.date)} · ${timeLabel(booking.time)} ${launchMarket.timeZoneLabel}`}
        />
        <Detail
          label="Visit"
          value={`${booking.mode} · ${booking.durationMinutes} minutes`}
        />
        <Detail
          label="Agreed consultation fee"
          value={price(booking.priceInr)}
        />
      </LiveCard>
      {pending ? (
        <Text variant="callout" color={colors.textSecondary}>
          This request is waiting for the practitioner’s response. The
          appointment is not confirmed.
        </Text>
      ) : null}
      {operator ? (
        <LiveNotice message="Operational view. Consultation notes, session details and follow-ups are not available here." />
      ) : (
        <>
          {booking.note ? (
            <LiveCard>
              <Text variant="headline">Note for the practitioner</Text>
              <Text>{booking.note}</Text>
            </LiveCard>
          ) : null}
          {booking.sessionDetails && !pending ? (
            <LiveCard>
              <Text variant="headline">
                {booking.mode === "Online"
                  ? "Joining instructions"
                  : "Visit address & instructions"}
              </Text>
              <Text selectable>{booking.sessionDetails}</Text>
            </LiveCard>
          ) : null}
          {booking.reason ? (
            <LiveCard>
              <Text variant="headline">
                {booking.status === "Declined"
                  ? "Reason for declining"
                  : "Cancellation reason"}
              </Text>
              <Text>{booking.reason}</Text>
            </LiveCard>
          ) : null}
          {booking.followUp ? (
            <LiveCard>
              <View style={styles.row}>
                <Feather
                  name={
                    booking.followUp.completedAt ? "check-circle" : "circle"
                  }
                  size={22}
                  color={
                    booking.followUp.completedAt ? colors.sage : colors.blue
                  }
                />
                <Text variant="title3" style={styles.flex}>
                  Follow-up
                </Text>
              </View>
              <Text>{booking.followUp.text}</Text>
              <Text variant="footnote" color={colors.textSecondary}>
                Due {dateLabel(booking.followUp.dueDate)}
                {booking.followUp.completedAt
                  ? ` · Completed ${dateLabel(liveClientDate(booking.followUp.completedAt))}`
                  : ""}
              </Text>
              {attendeeAccess && completed && !booking.followUp.completedAt ? (
                <Button
                  title="Mark follow-up complete"
                  onPress={() =>
                    void act(
                      "follow-up/complete",
                      {},
                      "Follow-up marked complete.",
                    )
                  }
                  loading={busy === "follow-up/complete"}
                  disabled={actionLocked}
                />
              ) : null}
            </LiveCard>
          ) : null}
        </>
      )}

      {notice ? <LiveNotice message={notice} /> : null}
      {awaitingRefresh ? (
        <LiveNotice message="Your update was saved. Refresh the appointment to load its latest details before making another change." />
      ) : null}
      {error || connectionError ? (
        <LiveNotice message={error || connectionError!} error />
      ) : null}

      {owner && pending && !reasonAction ? (
        <LiveCard>
          <Text variant="title3">Respond to this request</Text>
          {canConfirm ? (
            <>
              <LiveField
                label={
                  booking.mode === "Online"
                    ? "Joining instructions"
                    : "Visit address & instructions"
                }
                value={sessionDetails}
                onChangeText={(value) => {
                  setSessionDetails(value);
                  setError("");
                }}
                multiline
                placeholder={
                  booking.mode === "Online"
                    ? "How should the client join the session?"
                    : "Confirm the address and any arrival details."
                }
                maxLength={500}
              />
              <Text variant="footnote" color={colors.textSecondary}>
                These details are shared with the attendee and their authorised
                organiser.
              </Text>
              <Button
                title="Confirm appointment"
                onPress={confirm}
                loading={busy === "confirm"}
                disabled={actionLocked}
              />
            </>
          ) : (
            <LiveNotice
              message={
                practice?.status !== "Approved"
                  ? "Your practice must be approved before confirming appointments."
                  : "The requested start time has passed. Decline this request and arrange a new time."
              }
            />
          )}
          <Button
            title="Decline request"
            variant="tertiary"
            onPress={() => openReason("decline")}
            disabled={actionLocked}
          />
        </LiveCard>
      ) : null}

      {owner && confirmed ? (
        <LiveCard>
          <Text variant="title3">After the appointment</Text>
          {canComplete ? (
            <Button
              title="Mark appointment completed"
              onPress={() =>
                void act("complete", {}, "Appointment marked completed.")
              }
              loading={busy === "complete"}
              disabled={actionLocked}
            />
          ) : (
            <Text variant="callout" color={colors.textSecondary}>
              Completion is available after the scheduled end time. Refresh the
              appointment if that time has just passed.
            </Text>
          )}
        </LiveCard>
      ) : null}

      {owner && completed && !editingFollowUp ? (
        <Button
          title={
            booking.followUp
              ? "Edit follow-up instructions"
              : "Add follow-up instructions"
          }
          variant="secondary"
          onPress={editFollowUp}
          disabled={actionLocked}
        />
      ) : null}
      {owner && completed && editingFollowUp ? (
        <LiveCard>
          <Text variant="title3">Follow-up instructions</Text>
          <LiveField
            label="Agreed next steps"
            value={followUpText}
            onChangeText={(value) => {
              setFollowUpText(value);
              setError("");
            }}
            multiline
            maxLength={1000}
            placeholder="What should the person do next?"
          />
          <LiveField
            label="Due date · YYYY-MM-DD"
            value={dueDate}
            onChangeText={(value) => {
              setDueDate(value);
              setError("");
            }}
            keyboardType="numbers-and-punctuation"
            placeholder={liveClientDate(data.serverTime)}
            maxLength={10}
          />
          <Text variant="footnote" color={colors.textSecondary}>
            Visible to the attendee and their authorised organiser. Saving an
            update asks them to complete the new instructions.
          </Text>
          <Button
            title="Save follow-up"
            onPress={saveFollowUp}
            loading={busy === "follow-up"}
            disabled={actionLocked}
          />
          <Button
            title="Cancel changes"
            variant="tertiary"
            onPress={() => {
              Keyboard.dismiss();
              setEditingFollowUp(false);
              setError("");
            }}
            disabled={actionLocked}
          />
        </LiveCard>
      ) : null}

      {canCancel && !reasonAction ? (
        <Button
          title={pending ? "Cancel request" : "Cancel appointment"}
          variant="tertiary"
          onPress={() => openReason("cancel")}
          disabled={actionLocked}
        />
      ) : null}
      {reasonAction &&
      ((reasonAction === "cancel" && canCancel) ||
        (reasonAction === "decline" && owner && pending)) ? (
        <LiveCard>
          <Text variant="title3">
            {reasonAction === "decline"
              ? "Decline this request?"
              : pending
                ? "Cancel this request?"
                : "Cancel this appointment?"}
          </Text>
          <LiveField
            label={
              reasonAction === "decline"
                ? "Reason for declining"
                : "Reason for cancellation"
            }
            value={reason}
            onChangeText={(value) => {
              setReason(value);
              setError("");
            }}
            multiline
            maxLength={500}
            placeholder="Let the people involved know why."
          />
          <Text variant="footnote" color={colors.textSecondary}>
            This reason is shared with the attendee and practitioner.
          </Text>
          <Button
            title={
              reasonAction === "decline"
                ? "Decline request"
                : pending
                  ? "Cancel request"
                  : "Cancel appointment"
            }
            onPress={submitReason}
            loading={busy === reasonAction}
            disabled={actionLocked}
            style={styles.danger}
          />
          <Button
            title="Keep appointment"
            variant="tertiary"
            onPress={() => {
              Keyboard.dismiss();
              setReasonAction(null);
              setError("");
            }}
            disabled={actionLocked}
          />
        </LiveCard>
      ) : null}

      <View style={styles.section}>
        <Text variant="title3">Activity</Text>
        <View style={styles.history}>
          {[...booking.events].reverse().map((event, index) => (
            <View
              key={`${event.at}:${event.status}:${index}`}
              style={[styles.event, index > 0 && styles.divider]}
            >
              <View style={styles.dot} />
              <View style={styles.flex}>
                <Text variant="headline">{event.status}</Text>
                <Text variant="footnote" color={colors.textSecondary}>
                  {event.actorName}
                </Text>
                <Text variant="footnote" color={colors.textSecondary}>
                  {eventTime(event.at)}
                </Text>
                {!operator && event.note ? (
                  <Text variant="callout">{event.note}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Button
          title="Refresh appointment"
          variant="secondary"
          size="md"
          onPress={() => void reload()}
          loading={busy === "refresh"}
          disabled={Boolean(busy)}
        />
        <Button
          title="Close"
          variant="tertiary"
          onPress={() => {
            if (!inFlight.current) {
              Keyboard.dismiss();
              onClose();
            }
          }}
          disabled={Boolean(busy)}
        />
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text variant="footnote" color={colors.textSecondary}>
        {label}
      </Text>
      <Text variant="callout">{value}</Text>
    </View>
  );
}

function eventTime(value: string) {
  return `${new Intl.DateTimeFormat("en-IN", { timeZone: launchMarket.timeZone, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value))} IST`;
}

const styles = StyleSheet.create({
  page: { gap: spacing.xl },
  heading: { gap: spacing.xs },
  section: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  detail: { gap: spacing.xs },
  danger: { backgroundColor: colors.red },
  history: {
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  event: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.blue,
    marginTop: 7,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
