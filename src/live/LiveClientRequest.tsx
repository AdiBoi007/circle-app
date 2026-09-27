import { useEffect, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { ActivityIndicator, Keyboard, StyleSheet, View } from "react-native";

import { Button, Sheet, Text } from "@/components";
import { launchMarket } from "@/config/launch";
import { useLive } from "@/live/LiveProvider";
import type {
  LiveBookingInput,
  LivePractice,
  LiveService,
  LiveSlots,
} from "@/live/types";
import {
  dateLabel,
  LiveCard,
  LiveChip,
  LiveField,
  LiveNotice,
  LivePage,
  price,
  timeLabel,
} from "@/live/ui";
import { colors, spacing } from "@/theme";
import type { CareMode } from "@/types";

export function liveClientDate(serverTime: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: launchMarket.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(serverTime));
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}-${parts.find((part) => part.type === "day")!.value}`;
}

function requestDates(serverTime: string) {
  const first = liveClientDate(serverTime);
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(`${first}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

type Props = {
  practice: LivePractice;
  service: LiveService;
  onBack: () => void;
  onBooked: (id: string) => void;
};
type SlotState = { key: string; times: string[]; error: string };

export function LiveClientRequest({
  practice,
  service,
  onBack,
  onBooked,
}: Props) {
  const { data, get, mutate, refresh } = useLive();
  const [date, setDate] = useState(() =>
    data ? liveClientDate(data.serverTime) : "",
  );
  const [mode, setMode] = useState<CareMode>(service.modes[0] ?? "Online");
  const [attendeeId, setAttendeeId] = useState(data?.profile.id ?? "");
  const [selection, setSelection] = useState<{
    key: string;
    time: string;
  } | null>(null);
  const [slots, setSlots] = useState<SlotState>({
    key: "",
    times: [],
    error: "",
  });
  const [retry, setRetry] = useState(0);
  const [note, setNote] = useState("");
  const [review, setReview] = useState<LiveBookingInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const attempt = useRef<{
    fingerprint: string;
    idempotencyKey: string;
  } | null>(null);
  const selectionKey = JSON.stringify([service.id, date, mode]);
  const slotKey = JSON.stringify([selectionKey, retry, data?.serverTime]);
  const query = `/slots?serviceId=${encodeURIComponent(service.id)}&date=${encodeURIComponent(date)}&mode=${encodeURIComponent(mode)}`;

  useEffect(() => {
    let current = true;
    get<LiveSlots>(query)
      .then((result) => {
        if (!current) return;
        if (result.date !== date || result.timeZone !== launchMarket.timeZone)
          throw new Error(
            "Availability could not be confirmed. Please try again.",
          );
        setSlots({ key: slotKey, times: result.times, error: "" });
      })
      .catch((reason: unknown) => {
        if (current)
          setSlots({
            key: slotKey,
            times: [],
            error:
              reason instanceof Error
                ? reason.message
                : "Could not load available times.",
          });
      });
    return () => {
      current = false;
    };
  }, [date, get, query, slotKey]);

  if (!data) return null;
  const dates = requestDates(data.serverTime);
  const family = data.familyLinks.filter(
    (link) =>
      link.status === "Active" &&
      link.organiserId === data.profile.id &&
      link.memberId !== data.profile.id,
  );
  const recipients = [
    { id: data.profile.id, name: `${data.profile.name} (me)` },
    ...family
      .filter(
        (link, index, links) =>
          links.findIndex((other) => other.memberId === link.memberId) ===
          index,
      )
      .map((link) => ({ id: link.memberId, name: link.memberName })),
  ];
  const recipient = recipients.find((person) => person.id === attendeeId);
  const loadingSlots = slots.key !== slotKey;
  const selectedTime =
    selection?.key === selectionKey && slots.times.includes(selection.time)
      ? selection.time
      : "";
  const available =
    practice.status === "Approved" &&
    practice.acceptingRequests &&
    service.active &&
    service.modes.includes(mode);
  const ready =
    available &&
    Boolean(recipient) &&
    dates.includes(date) &&
    !loadingSlots &&
    !slots.error &&
    Boolean(selectedTime);

  function openReview() {
    Keyboard.dismiss();
    if (!ready || !recipient) {
      setError("Choose a recipient, visit format and available time.");
      return;
    }
    const input = {
      serviceId: service.id,
      attendeeId,
      date,
      time: selectedTime,
      mode,
      note: note.trim(),
      expectedPriceInr: service.priceInr,
      expectedDurationMinutes: service.durationMinutes,
    };
    const fingerprint = JSON.stringify(input);
    try {
      if (attempt.current?.fingerprint !== fingerprint)
        attempt.current = { fingerprint, idempotencyKey: Crypto.randomUUID() };
      setReview({ ...input, idempotencyKey: attempt.current.idempotencyKey });
      setError("");
    } catch {
      setError(
        "A secure request could not be prepared. Please reopen Circle using its secure web address.",
      );
    }
  }

  async function submit() {
    if (inFlight.current || !review || !ready) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    Keyboard.dismiss();
    try {
      const result = await mutate<{ id: string }>("/bookings", review);
      setReview(null);
      await refresh();
      onBooked(result.id);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not confirm whether the request was received. Retry this request to check safely.",
      );
      // Keep the reviewed request intact for safe retries, while loading any updated quote.
      await refresh();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <LivePage
      title="Request an appointment"
      subtitle={`${practice.name} · ${launchMarket.city}`}
    >
      <Button
        title="Back to practice"
        variant="tertiary"
        size="md"
        onPress={onBack}
        disabled={busy}
      />
      <LiveCard>
        <View style={styles.row}>
          <View style={styles.glyph}>
            <Feather name="calendar" size={23} color={colors.blue} />
          </View>
          <View style={styles.flex}>
            <Text variant="title3">{service.name}</Text>
            <Text variant="subhead" color={colors.textSecondary}>
              {service.durationMinutes} minutes · {price(service.priceInr)}
            </Text>
          </View>
        </View>
        {service.description ? (
          <Text variant="callout" color={colors.textSecondary}>
            {service.description}
          </Text>
        ) : null}
      </LiveCard>
      {!available ? (
        <LiveNotice message="This service is not accepting new requests. Return to the practice to choose another service." />
      ) : null}
      <View style={styles.section}>
        <Text variant="title3">Who is this for?</Text>
        <View style={styles.wrap}>
          {recipients.map((person) => (
            <LiveChip
              key={person.id}
              label={person.name}
              selected={attendeeId === person.id}
              onPress={() => {
                setAttendeeId(person.id);
                setError("");
              }}
            />
          ))}
        </View>
        {!recipient ? (
          <LiveNotice
            message="Family access has changed. Choose yourself or another person who has granted access."
            error
          />
        ) : null}
        {family.length ? (
          <Text variant="footnote" color={colors.textSecondary}>
            Only relatives who have accepted your invitation appear here.
          </Text>
        ) : null}
      </View>
      <View style={styles.section}>
        <Text variant="title3">How would you like to meet?</Text>
        <View style={styles.wrap}>
          {service.modes.map((item) => (
            <LiveChip
              key={item}
              label={item}
              selected={mode === item}
              onPress={() => {
                Keyboard.dismiss();
                setMode(item);
                setSelection(null);
                setError("");
              }}
            />
          ))}
        </View>
        <Text variant="footnote" color={colors.textSecondary}>
          {mode === "In person"
            ? practice.address
            : mode === "Home visit"
              ? "Home visits are within Chandigarh. Confirm the address with your practitioner."
              : "Online consultations are for clients in Chandigarh. Joining details follow confirmation."}
        </Text>
      </View>
      <View style={styles.section}>
        <Text variant="title3">Choose a date</Text>
        <Text variant="footnote" color={colors.textSecondary}>
          Next 14 days · All times {launchMarket.timeZoneLabel}
        </Text>
        <View style={styles.wrap}>
          {dates.map((item) => (
            <LiveChip
              key={item}
              label={dateLabel(item)}
              selected={date === item}
              onPress={() => {
                Keyboard.dismiss();
                setDate(item);
                setSelection(null);
                setError("");
              }}
            />
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text variant="title3">Available times</Text>
        {loadingSlots ? (
          <View accessibilityLiveRegion="polite" style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <Text variant="callout" color={colors.textSecondary}>
              Checking availability…
            </Text>
          </View>
        ) : slots.error ? (
          <>
            <LiveNotice message={slots.error} error />
            <Button
              title="Try loading times again"
              variant="secondary"
              size="md"
              onPress={() => setRetry((value) => value + 1)}
            />
          </>
        ) : slots.times.length ? (
          <View style={styles.wrap}>
            {slots.times.map((time) => (
              <LiveChip
                key={time}
                label={timeLabel(time)}
                selected={selectedTime === time}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelection({ key: selectionKey, time });
                  setError("");
                }}
              />
            ))}
          </View>
        ) : (
          <LiveCard>
            <Text variant="callout" color={colors.textSecondary}>
              No times are available on this date. Try another day or visit
              format.
            </Text>
          </LiveCard>
        )}
      </View>
      <LiveField
        label="A note for your practitioner (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="What would you like help with?"
        maxLength={1000}
      />
      {error && !review ? <LiveNotice message={error} error /> : null}
      <Button
        title="Review request"
        onPress={openReview}
        disabled={!ready || busy}
      />
      <Text variant="footnote" color={colors.textSecondary}>
        Your chosen time is a request until the practitioner confirms. No online
        payment is taken.
      </Text>

      <Sheet
        visible={Boolean(review)}
        title="Review your request"
        onClose={() => {
          if (!inFlight.current) {
            Keyboard.dismiss();
            setReview(null);
          }
        }}
        footer={
          <View style={styles.section}>
            <Button
              title="Request appointment"
              onPress={() => void submit()}
              loading={busy}
              disabled={!ready || !review}
            />
            <Button
              title="Back to edit"
              variant="tertiary"
              onPress={() => setReview(null)}
              disabled={busy}
            />
          </View>
        }
      >
        {review ? (
          <View style={styles.section}>
            <Text variant="title2">{service.name}</Text>
            <Text variant="callout" color={colors.textSecondary}>
              {practice.name}
            </Text>
            <View style={styles.summary}>
              <Summary
                label="For"
                value={recipient?.name ?? "Access changed"}
              />
              <Summary
                label="When"
                value={`${dateLabel(review.date)} · ${timeLabel(review.time)} ${launchMarket.timeZoneLabel}`}
              />
              <Summary
                label="Visit"
                value={`${review.mode} · ${review.expectedDurationMinutes} minutes`}
              />
              <Summary
                label="Consultation fee"
                value={price(review.expectedPriceInr)}
              />
              {review.note ? (
                <Summary label="Your note" value={review.note} />
              ) : null}
            </View>
            <Text variant="callout" color={colors.textSecondary}>
              The practitioner will review this request. You will see their
              response in your appointments.
            </Text>
            {loadingSlots ? (
              <LiveNotice message="Rechecking availability…" />
            ) : !ready ? (
              <LiveNotice
                message="Availability or family access has changed. Go back and choose a current available time."
                error
              />
            ) : null}
            {error ? <LiveNotice message={error} error /> : null}
          </View>
        ) : null}
      </Sheet>
    </LivePage>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text variant="footnote" color={colors.textSecondary}>
        {label}
      </Text>
      <Text variant="callout">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  glyph: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.blueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  loading: {
    minHeight: 60,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
  },
  summary: {
    borderRadius: 16,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  summaryRow: { gap: spacing.xs },
});
