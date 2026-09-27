import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Button, Sheet, Text } from "@/components";
import { launchMarket } from "@/config/launch";
import { colors } from "@/theme";

import { LiveBookingDetail } from "./LiveBookingDetail";
import { useLive } from "./LiveProvider";
import type { LiveBooking, LiveInvitation, LivePractice } from "./types";
import {
  dateLabel,
  LiveCard,
  LiveChip,
  LiveField,
  LiveNotice,
  LivePage,
  price,
  timeLabel,
} from "./ui";

type OperatorTab = "Review" | "Requests" | "Invites" | "Deliveries" | "Audit";
type PracticeFilter = "Pending" | "Approved" | "Suspended" | "All";
type RequestFilter = "Overdue" | "Requested" | "Confirmed" | "All";

function timestampLabel(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-IN", {
    timeZone: launchMarket.timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useOperatorAction() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function run(action: () => Promise<unknown>, message = "") {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The action could not be completed. Please try again.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, run, setError };
}

function OperatorBookingRow({
  booking,
  onPress,
}: {
  booking: LiveBooking;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Review ${booking.status.toLowerCase()} appointment for ${booking.attendeeName} with ${booking.practitionerName}, ${dateLabel(booking.date)}, ${timeLabel(booking.time)} IST`}
      style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text
          variant="footnote"
          color={booking.status === "Requested" ? colors.amber : colors.blue}
        >
          {booking.status}
        </Text>
        <Text variant="headline">{booking.attendeeName}</Text>
        <Text variant="callout">
          {booking.practitionerName} · {booking.serviceName}
        </Text>
        <Text variant="footnote" color={colors.textSecondary}>
          {dateLabel(booking.date)} · {timeLabel(booking.time)} IST ·{" "}
          {booking.mode}
          {"\n"}Requested {timestampLabel(booking.createdAt)}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export function LiveOperatorWorkspace() {
  const { data, refresh, mutate } = useLive();
  const [tab, setTab] = useState<OperatorTab>("Review");
  const [practiceFilter, setPracticeFilter] =
    useState<PracticeFilter>("Pending");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("Overdue");
  const [deliveryFilter, setDeliveryFilter] = useState<
    "Failed" | "Pending" | "All"
  >("Failed");
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revoke, setRevoke] = useState<LiveInvitation | null>(null);
  const action = useOperatorAction();
  if (!data)
    return (
      <LivePage title="Operations">
        <LiveNotice message="Loading operations…" />
      </LivePage>
    );
  if (data.profile.role !== "operator")
    return (
      <LivePage title="Operations">
        <LiveNotice
          message="This workspace is available to operator accounts."
          error
        />
      </LivePage>
    );

  const pending = data.practices.filter(
    (practice) => practice.status === "Pending",
  );
  const practices = data.practices.filter(
    (practice) =>
      practiceFilter === "All" || practice.status === practiceFilter,
  );
  const overdue = data.bookings.filter(
    (booking) =>
      booking.status === "Requested" &&
      Date.parse(data.serverTime) - Date.parse(booking.createdAt) >=
        24 * 60 * 60 * 1000,
  );
  const bookings = (
    requestFilter === "Overdue"
      ? overdue
      : data.bookings.filter(
          (booking) =>
            requestFilter === "All" || booking.status === requestFilter,
        )
  )
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const failed =
    data.operator?.deliveries.filter(
      (delivery) => delivery.status === "Failed",
    ) ?? [];
  const deliveries = (data.operator?.deliveries ?? [])
    .filter(
      (delivery) =>
        deliveryFilter === "All" || delivery.status === deliveryFilter,
    )
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selectedPractice = data.practices.find(
    (practice) => practice.id === practiceId,
  );
  const selectedBooking = data.bookings.find(
    (booking) => booking.id === bookingId,
  );
  async function revokeInvitation() {
    if (
      revoke &&
      (await action.run(
        () => mutate(`/invitations/${revoke.id}/revoke`, {}),
        "Invitation revoked.",
      ))
    )
      setRevoke(null);
  }

  return (
    <LivePage
      title="Operations"
      subtitle={`${launchMarket.city} · ${data.profile.name}`}
      action={
        <Button
          title="Refresh"
          variant="tertiary"
          size="md"
          loading={action.busy}
          onPress={() => {
            void action.run(refresh);
          }}
        />
      }
    >
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="title1" color={colors.blue}>
            {pending.length}
          </Text>
          <Text variant="footnote">Pending practices</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="title1" color={colors.amber}>
            {overdue.length}
          </Text>
          <Text variant="footnote">Requests over 24h</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="title1" color={colors.red}>
            {failed.length}
          </Text>
          <Text variant="footnote">Failed deliveries</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {(
          [
            "Review",
            "Requests",
            "Invites",
            "Deliveries",
            "Audit",
          ] as OperatorTab[]
        ).map((item) => (
          <LiveChip
            key={item}
            label={item}
            selected={tab === item}
            onPress={() => setTab(item)}
          />
        ))}
      </ScrollView>
      {action.error ? <LiveNotice message={action.error} error /> : null}
      {action.notice ? <LiveNotice message={action.notice} /> : null}

      {tab === "Review" ? (
        <>
          <Text variant="title2">Practice review</Text>
          <View style={styles.chips}>
            {(
              ["Pending", "Approved", "Suspended", "All"] as PracticeFilter[]
            ).map((item) => (
              <LiveChip
                key={item}
                label={item}
                selected={practiceFilter === item}
                onPress={() => setPracticeFilter(item)}
              />
            ))}
          </View>
          {practices.length ? (
            practices.map((practice) => (
              <LiveCard key={practice.id}>
                <View style={styles.stack}>
                  <View style={styles.between}>
                    <Text variant="title3" style={styles.flex}>
                      {practice.name}
                    </Text>
                    <Text
                      variant="footnote"
                      color={
                        practice.status === "Approved"
                          ? colors.sage
                          : colors.amber
                      }
                    >
                      {practice.status}
                    </Text>
                  </View>
                  <Text>
                    {practice.title} · {practice.category}
                  </Text>
                  <Text variant="callout" color={colors.textSecondary}>
                    {practice.address}
                    {"\n"}
                    {practice.contactEmail}
                  </Text>
                  {practice.reviewNote ? (
                    <Text variant="footnote">
                      Last review: {practice.reviewNote}
                    </Text>
                  ) : null}
                  <Button
                    title={`Review ${practice.name}`}
                    size="md"
                    variant="secondary"
                    onPress={() => setPracticeId(practice.id)}
                  />
                </View>
              </LiveCard>
            ))
          ) : (
            <LiveCard>
              <Text color={colors.textSecondary}>
                No{" "}
                {practiceFilter === "All"
                  ? ""
                  : `${practiceFilter.toLowerCase()} `}
                practices to show.
              </Text>
            </LiveCard>
          )}
        </>
      ) : null}

      {tab === "Requests" ? (
        <>
          <Text variant="title2">Appointment operations</Text>
          <LiveNotice message="Overdue means a request has awaited a response for at least 24 hours. Appointment notes are not shown in the operator workspace." />
          <View style={styles.chips}>
            {(
              ["Overdue", "Requested", "Confirmed", "All"] as RequestFilter[]
            ).map((item) => (
              <LiveChip
                key={item}
                label={item}
                selected={requestFilter === item}
                onPress={() => setRequestFilter(item)}
              />
            ))}
          </View>
          {bookings.length ? (
            bookings.map((booking) => (
              <OperatorBookingRow
                key={booking.id}
                booking={booking}
                onPress={() => setBookingId(booking.id)}
              />
            ))
          ) : (
            <LiveCard>
              <Text color={colors.textSecondary}>
                No {requestFilter.toLowerCase()} appointments to show.
              </Text>
            </LiveCard>
          )}
        </>
      ) : null}

      {tab === "Invites" ? (
        <>
          <View style={styles.between}>
            <Text variant="title2">Beta invitations</Text>
            <Button
              title="Create invitation"
              size="md"
              fullWidth={false}
              onPress={() => setInviteOpen(true)}
            />
          </View>
          <Text variant="callout" color={colors.textSecondary}>
            Create a client or practitioner invitation. A generated link can be
            shared manually; delivery is tracked separately.
          </Text>
          {data.invitations.length ? (
            data.invitations
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((invitation) => (
                <LiveCard key={invitation.id}>
                  <View style={styles.stack}>
                    <Text variant="headline">{invitation.email}</Text>
                    <Text variant="callout" color={colors.textSecondary}>
                      {invitation.role} ·{" "}
                      {invitation.purpose === "family"
                        ? "Family sharing"
                        : "Beta access"}{" "}
                      · {invitation.status}
                    </Text>
                    <Text variant="footnote" color={colors.textSecondary}>
                      Expires {timestampLabel(invitation.expiresAt)} IST
                    </Text>
                    {invitation.status === "Pending" ? (
                      <Button
                        title={`Revoke invitation for ${invitation.email}`}
                        variant="tertiary"
                        size="md"
                        disabled={action.busy}
                        onPress={() => setRevoke(invitation)}
                      />
                    ) : null}
                  </View>
                </LiveCard>
              ))
          ) : (
            <LiveCard>
              <Text color={colors.textSecondary}>No invitations yet.</Text>
            </LiveCard>
          )}
        </>
      ) : null}

      {tab === "Deliveries" ? (
        <>
          <Text variant="title2">Notification delivery</Text>
          <View style={styles.chips}>
            {(["Failed", "Pending", "All"] as const).map((item) => (
              <LiveChip
                key={item}
                label={item}
                selected={deliveryFilter === item}
                onPress={() => setDeliveryFilter(item)}
              />
            ))}
          </View>
          <Text variant="callout" color={colors.textSecondary}>
            Sent means the email provider accepted the message. Inbox delivery
            is not yet tracked. Review failed messages below.
          </Text>
          {deliveries.length ? (
            deliveries.map((delivery) => (
              <LiveCard key={delivery.id}>
                <View style={styles.stack}>
                  <Text variant="headline">{delivery.recipient}</Text>
                  <Text variant="callout">
                    {delivery.kind} · {delivery.status}
                  </Text>
                  <Text variant="footnote" color={colors.textSecondary}>
                    {delivery.attempts}{" "}
                    {delivery.attempts === 1 ? "attempt" : "attempts"} ·{" "}
                    {timestampLabel(delivery.createdAt)} IST
                  </Text>
                  {delivery.lastError ? (
                    <LiveNotice message={delivery.lastError} error />
                  ) : null}
                  {delivery.status === "Failed" ? (
                    <Button
                      title={`Retry delivery to ${delivery.recipient}`}
                      size="md"
                      variant="secondary"
                      disabled={action.busy}
                      onPress={() => {
                        void action.run(
                          () =>
                            mutate(
                              `/operator/deliveries/${delivery.id}/retry`,
                              {},
                            ),
                          "Retry requested. Check the updated delivery status.",
                        );
                      }}
                    />
                  ) : null}
                </View>
              </LiveCard>
            ))
          ) : (
            <LiveCard>
              <Text color={colors.textSecondary}>
                No{" "}
                {deliveryFilter === "All"
                  ? ""
                  : `${deliveryFilter.toLowerCase()} `}
                deliveries.
              </Text>
            </LiveCard>
          )}
        </>
      ) : null}

      {tab === "Audit" ? (
        <>
          <Text variant="title2">Audit history</Text>
          {data.operator?.audit.length ? (
            data.operator.audit
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((event) => (
                <LiveCard key={event.id}>
                  <View style={styles.stack}>
                    <Text variant="headline">{event.action}</Text>
                    <Text variant="callout">{event.actorName}</Text>
                    {event.reason ? (
                      <Text variant="callout" color={colors.textSecondary}>
                        {event.reason}
                      </Text>
                    ) : null}
                    <Text variant="footnote" color={colors.textSecondary}>
                      {timestampLabel(event.createdAt)} IST
                    </Text>
                    {event.targetId ? (
                      <Text
                        selectable
                        variant="caption"
                        color={colors.textSecondary}
                      >
                        Reference: {event.targetId}
                      </Text>
                    ) : null}
                  </View>
                </LiveCard>
              ))
          ) : (
            <LiveCard>
              <Text color={colors.textSecondary}>
                No audit events available.
              </Text>
            </LiveCard>
          )}
        </>
      ) : null}
      <Text variant="footnote" color={colors.textSecondary}>
        Updated {timestampLabel(data.serverTime)} IST.
      </Text>

      <Sheet
        visible={practiceId !== null}
        onClose={() => setPracticeId(null)}
        title="Practice review"
      >
        {selectedPractice ? (
          <OperatorPracticeReview
            key={selectedPractice.id}
            practice={selectedPractice}
            onDone={() => setPracticeId(null)}
          />
        ) : practiceId ? (
          <LiveNotice
            message="This practice is no longer available. Refresh the workspace."
            error
          />
        ) : null}
      </Sheet>
      <Sheet
        visible={bookingId !== null}
        onClose={() => setBookingId(null)}
        title="Appointment operations"
      >
        {selectedBooking ? (
          <LiveBookingDetail
            booking={selectedBooking}
            onClose={() => setBookingId(null)}
          />
        ) : bookingId ? (
          <LiveNotice
            message="This appointment is no longer available."
            error
          />
        ) : null}
      </Sheet>
      <Sheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Create beta invitation"
      >
        {inviteOpen ? (
          <OperatorInvitationForm onDone={() => setInviteOpen(false)} />
        ) : null}
      </Sheet>
      <Sheet
        visible={revoke !== null}
        onClose={() => setRevoke(null)}
        title="Revoke invitation?"
      >
        {revoke ? (
          <View style={styles.stack}>
            <Text>
              The pending invitation for {revoke.email} will stop working.
            </Text>
            {action.error ? <LiveNotice message={action.error} error /> : null}
            <Button
              title="Revoke this invitation"
              loading={action.busy}
              onPress={() => {
                void revokeInvitation();
              }}
            />
            <Button
              title="Keep invitation"
              variant="tertiary"
              disabled={action.busy}
              onPress={() => setRevoke(null)}
            />
          </View>
        ) : null}
      </Sheet>
    </LivePage>
  );
}

function OperatorPracticeReview({
  practice,
  onDone,
}: {
  practice: LivePractice;
  onDone: () => void;
}) {
  const { data, mutate } = useLive();
  const [status, setStatus] = useState<"Approved" | "Suspended">(
    practice.status === "Approved" ? "Suspended" : "Approved",
  );
  const [reason, setReason] = useState("");
  const action = useOperatorAction();
  const services = data!.services.filter(
    (service) => service.practiceId === practice.id,
  );
  async function review() {
    if (!reason.trim()) {
      action.setError("Add the reason for this review decision.");
      return;
    }
    if (
      await action.run(() =>
        mutate(`/operator/practices/${practice.id}/review`, {
          status,
          reason: reason.trim(),
        }),
      )
    )
      onDone();
  }
  return (
    <View style={styles.stack}>
      <Text variant="title2">{practice.name}</Text>
      <Text>
        {practice.title} · {practice.category}
      </Text>
      <Text color={colors.textSecondary}>{practice.bio}</Text>
      <LiveCard>
        <View style={styles.stack}>
          <Text variant="headline">Qualification submitted</Text>
          <Text>{practice.qualification}</Text>
          <Text variant="callout">{practice.languages.join(", ")}</Text>
          <Text variant="callout">
            {practice.address}
            {"\n"}
            {practice.contactEmail}
            {practice.phone ? `\n${practice.phone}` : ""}
          </Text>
        </View>
      </LiveCard>
      <Text variant="headline">Services</Text>
      {services.length ? (
        services.map((service) => (
          <Text key={service.id} variant="callout">
            {service.name} · {price(service.priceInr)} ·{" "}
            {service.durationMinutes} min{"\n"}
            {service.modes.join(" · ")} · {service.active ? "Active" : "Paused"}
          </Text>
        ))
      ) : (
        <Text color={colors.textSecondary}>No services have been added.</Text>
      )}
      <Text variant="callout" color={colors.textSecondary}>
        {practice.hours.filter((day) => day.enabled).length} working days
        configured · {practice.blockedDates.length} closed dates
      </Text>
      {practice.reviewNote ? (
        <LiveNotice message={`Previous review: ${practice.reviewNote}`} />
      ) : null}
      <Text variant="headline">Decision</Text>
      <View pointerEvents={action.busy ? "none" : "auto"} style={styles.chips}>
        <LiveChip
          label="Approve"
          selected={status === "Approved"}
          onPress={() => setStatus("Approved")}
        />
        <LiveChip
          label="Suspend"
          selected={status === "Suspended"}
          onPress={() => setStatus("Suspended")}
        />
      </View>
      <LiveField
        label="Review reason, shown to the practitioner"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={1000}
      />
      <Text variant="footnote" color={colors.textSecondary}>
        Approval publishes an eligible practice for clients. Suspension stops
        new requests; existing appointments remain available to manage.
      </Text>
      {action.error ? <LiveNotice message={action.error} error /> : null}
      <Button
        title={status === "Approved" ? "Approve practice" : "Suspend practice"}
        loading={action.busy}
        disabled={!reason.trim()}
        onPress={() => {
          void review();
        }}
      />
      <Button
        title="Cancel review"
        variant="tertiary"
        disabled={action.busy}
        onPress={onDone}
      />
    </View>
  );
}

function OperatorInvitationForm({ onDone }: { onDone: () => void }) {
  const { mutate } = useLive();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"client" | "practitioner">("client");
  const [created, setCreated] = useState<{ email: string; url: string } | null>(
    null,
  );
  const action = useOperatorAction();
  async function create() {
    const recipient = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      action.setError("Enter a valid email address.");
      return;
    }
    await action.run(async () => {
      const result = await mutate<{ id: string; url: string }>("/invitations", {
        email: recipient,
        role,
      });
      setCreated({ email: recipient, url: result.url });
    });
  }
  return (
    <View style={styles.stack}>
      {created ? (
        <>
          <LiveNotice message={`Invitation created for ${created.email}.`} />
          <Text>
            Copy this invitation link and share it with the intended recipient.
            Creating the link does not confirm email delivery.
          </Text>
          <LiveCard>
            <Text
              selectable
              accessibilityLabel="Invitation link, select to copy"
              style={styles.link}
            >
              {created.url}
            </Text>
          </LiveCard>
          <Button
            title="Create another invitation"
            variant="secondary"
            onPress={() => {
              setCreated(null);
              setEmail("");
            }}
          />
        </>
      ) : (
        <>
          <View
            pointerEvents={action.busy ? "none" : "auto"}
            style={styles.stack}
          >
            <LiveField
              label="Recipient email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              maxLength={160}
            />
            <Text variant="headline">Account type</Text>
            <View style={styles.chips}>
              <LiveChip
                label="Client"
                selected={role === "client"}
                onPress={() => setRole("client")}
              />
              <LiveChip
                label="Practitioner"
                selected={role === "practitioner"}
                onPress={() => setRole("practitioner")}
              />
            </View>
          </View>
          <Text variant="callout" color={colors.textSecondary}>
            The invitation is restricted to this email address. Practitioner
            accounts still need practice approval.
          </Text>
          <Button
            title="Create invitation link"
            loading={action.busy}
            disabled={!email.trim()}
            onPress={() => {
              void create();
            }}
          />
        </>
      )}
      {action.error ? <LiveNotice message={action.error} error /> : null}
      <Button
        title="Done"
        variant="tertiary"
        disabled={action.busy}
        onPress={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  between: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    flexGrow: 1,
    flexBasis: 90,
    padding: 14,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 88,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  link: { color: colors.blue, flexShrink: 1 },
  pressed: { opacity: 0.7 },
});
