import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";

import { Button, Sheet, Text } from "@/components";
import { launchMarket } from "@/config/launch";
import { LiveBookingDetail } from "@/live/LiveBookingDetail";
import { LiveClientFamily } from "@/live/LiveClientFamily";
import { LiveClientRequest, liveClientDate } from "@/live/LiveClientRequest";
import { useLive } from "@/live/LiveProvider";
import type { LiveBooking, LivePractice, LiveService } from "@/live/types";
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
import type { PracticeCategory } from "@/practitioner/types";
import { colors, spacing } from "@/theme";
import type { CareMode } from "@/types";

type ClientTab = "today" | "care" | "family";
const tabs: {
  value: ClientTab;
  title: string;
  icon: "sun" | "search" | "users";
}[] = [
  { value: "today", title: "Today", icon: "sun" },
  { value: "care", title: "Find care", icon: "search" },
  { value: "family", title: "Family", icon: "users" },
];
const categories: PracticeCategory[] = [
  "Physiotherapy",
  "Therapy",
  "Fitness",
  "Nutrition",
  "Yoga",
];
const modes: CareMode[] = ["Online", "In person", "Home visit"];
const isOpen = (booking: LiveBooking) =>
  booking.status === "Requested" || booking.status === "Confirmed";

export function LiveClient() {
  const { data, refresh } = useLive();
  const [tab, setTab] = useState<ClientTab>("today");
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [receivedId, setReceivedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PracticeCategory | "All">("All");
  const [mode, setMode] = useState<CareMode | "All">("All");
  const [bookingFilter, setBookingFilter] = useState<"Active" | "History">(
    "Active",
  );
  const [showAppointments, setShowAppointments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshLock = useRef(false);
  if (!data) return null;

  const simple = data.profile.viewPreference === "simple";
  const selectedPractice = data.practices.find(
    (practice) => practice.id === practiceId && practice.status === "Approved",
  );
  const selectedService = data.services.find(
    (service) => service.id === serviceId && service.practiceId === practiceId,
  );
  const selectedBooking = data.bookings.find(
    (booking) => booking.id === bookingId,
  );
  const openBookings = data.bookings
    .filter(isOpen)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const history = data.bookings
    .filter((booking) => !isOpen(booking))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const bookings = bookingFilter === "Active" ? openBookings : history;
  const next = openBookings.find(
    (booking) =>
      booking.status === "Confirmed" &&
      Date.parse(booking.startsAt) >= Date.parse(data.serverTime),
  );
  const waiting = openBookings.filter(
    (booking) => booking.status === "Requested",
  ).length;
  const followUps = data.bookings.filter(
    (booking) =>
      booking.followUp &&
      !booking.followUp.completedAt &&
      (booking.status === "Confirmed" || booking.status === "Completed"),
  );
  const approved = data.practices.filter(
    (practice) => practice.status === "Approved",
  );
  const visiblePractices = approved.filter((practice) => {
    const services = data.services.filter(
      (service) => service.practiceId === practice.id && service.active,
    );
    const search = [
      practice.name,
      practice.title,
      practice.category,
      practice.bio,
      practice.address,
      ...practice.languages,
      ...services.map((service) => service.name),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (category === "All" || practice.category === category) &&
      (mode === "All" ||
        services.some((service) => service.modes.includes(mode))) &&
      (!query.trim() || search.includes(query.trim().toLowerCase()))
    );
  });

  async function refreshNow() {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      refreshLock.current = false;
      setRefreshing(false);
    }
  }

  function requested(id: string) {
    setReceivedId(id);
    setServiceId(null);
    setPracticeId(null);
    setTab("today");
    setShowAppointments(true);
    setBookingFilter("Active");
    setBookingId(id);
  }

  if (selectedPractice && selectedService)
    return (
      <LiveClientRequest
        key={selectedService.id}
        practice={selectedPractice}
        service={selectedService}
        onBack={() => setServiceId(null)}
        onBooked={requested}
      />
    );
  if (practiceId)
    return (
      <LivePage
        title={selectedPractice?.name ?? "Practice unavailable"}
        subtitle={launchMarket.regionLabel}
      >
        <Button
          title="Back to Find care"
          variant="tertiary"
          size="md"
          onPress={() => {
            setPracticeId(null);
            setServiceId(null);
          }}
        />
        {selectedPractice ? (
          <PracticeProfile
            practice={selectedPractice}
            services={data.services.filter(
              (service) =>
                service.practiceId === selectedPractice.id && service.active,
            )}
            onRequest={(service) => setServiceId(service.id)}
          />
        ) : (
          <LiveNotice message="This practice is no longer available in the directory. Return to Find care to see current practitioners." />
        )}
      </LivePage>
    );

  return (
    <LivePage
      title={
        tab === "today"
          ? simple && showAppointments
            ? "My appointments"
            : "Today"
          : tab === "care"
            ? "Find care"
            : simple
              ? "My family"
              : "Family"
      }
      subtitle={
        tab === "today"
          ? `${dateLabel(liveClientDate(data.serverTime))} · ${launchMarket.city}`
          : tab === "care"
            ? "Your local practitioners, in one place."
            : "Choose who can help with your care."
      }
      action={
        <Pressable
          onPress={() => void refreshNow()}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh appointments and care directory"
          accessibilityState={{ busy: refreshing, disabled: refreshing }}
          style={styles.refresh}
        >
          <Feather name="refresh-cw" size={20} color={colors.blue} />
        </Pressable>
      }
    >
      {simple ? (
        tab !== "today" || showAppointments ? (
          <SimpleAction
            title="Back to Today"
            icon="arrow-left"
            onPress={() => {
              Keyboard.dismiss();
              setTab("today");
              setShowAppointments(false);
            }}
          />
        ) : null
      ) : (
        <View style={styles.tabs}>
          {tabs.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityLabel={item.title}
              accessibilityState={{ selected: tab === item.value }}
              onPress={() => {
                Keyboard.dismiss();
                setTab(item.value);
              }}
              style={({ pressed }) => [
                styles.tab,
                tab === item.value && styles.activeTab,
                pressed && styles.pressed,
              ]}
            >
              <Feather
                name={item.icon}
                size={20}
                color={tab === item.value ? colors.blue : colors.textSecondary}
              />
              <Text
                variant="subhead"
                color={tab === item.value ? colors.blue : colors.textSecondary}
                align="center"
                style={styles.shrink}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {tab === "today" ? (
        <>
          {receivedId ? (
            <LiveNotice message="Your appointment request was received. It will stay Requested until the practitioner confirms." />
          ) : null}
          {!simple ? (
            <View style={styles.summaryRow}>
              <View style={styles.summary}>
                <Text variant="title1">
                  {
                    openBookings.filter(
                      (booking) => booking.status === "Confirmed",
                    ).length
                  }
                </Text>
                <Text variant="footnote" color={colors.textSecondary}>
                  Confirmed appointments
                </Text>
              </View>
              <View style={styles.summary}>
                <Text
                  variant="title1"
                  color={waiting ? colors.amber : colors.textPrimary}
                >
                  {waiting}
                </Text>
                <Text variant="footnote" color={colors.textSecondary}>
                  Awaiting a response
                </Text>
              </View>
            </View>
          ) : null}
          {!simple || !showAppointments ? (
            next ? (
              <View style={styles.section}>
                <Text variant={simple ? "title2" : "title3"}>
                  Next appointment
                </Text>
                <BookingRow
                  booking={next}
                  onPress={() => setBookingId(next.id)}
                  prominent
                  simple={simple}
                />
              </View>
            ) : (
              <LiveCard>
                <Text variant={simple ? "title2" : "title3"}>
                  {simple
                    ? "No confirmed appointment yet"
                    : "Find your next step"}
                </Text>
                <Text
                  variant="callout"
                  color={colors.textSecondary}
                  style={simple && styles.simpleBody}
                >
                  {waiting
                    ? simple
                      ? "A request is waiting for a response. Open My appointments to check it."
                      : "Your practitioner will review your request. The response will appear in your appointments below."
                    : "Find a practitioner for yourself or a relative who has shared access with you."}
                </Text>
                {!simple ? (
                  <Button
                    title="Find care in Chandigarh"
                    variant="secondary"
                    onPress={() => setTab("care")}
                  />
                ) : null}
              </LiveCard>
            )
          ) : null}
          {simple && !showAppointments ? (
            <View style={styles.simpleActions}>
              <SimpleAction
                title="My appointments"
                icon="calendar"
                onPress={() => {
                  setBookingFilter("Active");
                  setShowAppointments(true);
                }}
              />
              <SimpleAction
                title="Find care"
                icon="search"
                onPress={() => setTab("care")}
              />
              <SimpleAction
                title="My family"
                icon="users"
                onPress={() => setTab("family")}
              />
            </View>
          ) : null}
          {(!simple || !showAppointments) && followUps.length ? (
            <View style={styles.section}>
              <Text variant={simple ? "title2" : "title3"}>
                Your next steps
              </Text>
              {followUps.map((booking) => (
                <Pressable
                  key={booking.id}
                  onPress={() => setBookingId(booking.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`View follow-up for ${booking.attendeeName}: ${booking.followUp!.text}`}
                  style={({ pressed }) => [
                    styles.followUp,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={simple ? 26 : 22}
                    color={colors.sage}
                  />
                  <View style={styles.flex}>
                    <Text
                      variant="headline"
                      style={simple && styles.simpleBody}
                    >
                      {booking.followUp!.text}
                    </Text>
                    <Text
                      variant="footnote"
                      color={colors.textSecondary}
                      style={simple && styles.simpleMeta}
                    >
                      {booking.attendeeName} · Due{" "}
                      {dateLabel(booking.followUp!.dueDate)}
                    </Text>
                    {simple ? (
                      <Text color={colors.blue} style={styles.simpleMeta}>
                        View next steps
                      </Text>
                    ) : null}
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.textTertiary}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
          {!simple || showAppointments ? (
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                {!simple ? (
                  <Text variant="title2" style={styles.flex}>
                    Your appointments
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => setTab("care")}
                  accessibilityRole="button"
                  accessibilityLabel="Find care to request an appointment"
                  style={styles.textAction}
                >
                  <Feather
                    name="plus"
                    size={simple ? 22 : 18}
                    color={colors.blue}
                  />
                  <Text
                    variant="subhead"
                    color={colors.blue}
                    style={simple && styles.simpleBody}
                  >
                    {simple ? "Request an appointment" : "New"}
                  </Text>
                </Pressable>
              </View>
              {simple ? (
                <View style={styles.simpleFilters}>
                  {(["Active", "History"] as const).map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: bookingFilter === value }}
                      onPress={() => setBookingFilter(value)}
                      style={[
                        styles.simpleFilter,
                        bookingFilter === value && styles.simpleFilterSelected,
                      ]}
                    >
                      <Text
                        style={styles.simpleBody}
                        color={
                          bookingFilter === value
                            ? colors.blue
                            : colors.textSecondary
                        }
                      >
                        {value === "Active" ? "Active" : "Past"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.wrap}>
                  <LiveChip
                    label={`Active (${openBookings.length})`}
                    selected={bookingFilter === "Active"}
                    onPress={() => setBookingFilter("Active")}
                  />
                  <LiveChip
                    label={`History (${history.length})`}
                    selected={bookingFilter === "History"}
                    onPress={() => setBookingFilter("History")}
                  />
                </View>
              )}
              {bookings.length ? (
                <View style={styles.section}>
                  {bookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      onPress={() => setBookingId(booking.id)}
                      simple={simple}
                    />
                  ))}
                </View>
              ) : (
                <LiveCard>
                  <Text variant={simple ? "title2" : "headline"}>
                    {bookingFilter === "Active"
                      ? "No active appointments"
                      : "No past appointments"}
                  </Text>
                  <Text
                    variant="callout"
                    color={colors.textSecondary}
                    style={simple && styles.simpleBody}
                  >
                    {bookingFilter === "Active"
                      ? "Your requests and confirmed appointments will appear here."
                      : "Completed, declined and cancelled appointments will appear here."}
                  </Text>
                </LiveCard>
              )}
            </View>
          ) : null}
        </>
      ) : null}

      {tab === "care" ? (
        <>
          <LiveField
            label="Search practitioners"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, service or area"
            maxLength={100}
          />
          <View style={styles.section}>
            <Text variant="subhead" color={colors.textSecondary}>
              Type of support
            </Text>
            <View style={styles.wrap}>
              <LiveChip
                label="All"
                selected={category === "All"}
                onPress={() => setCategory("All")}
              />
              {categories.map((item) => (
                <LiveChip
                  key={item}
                  label={item}
                  selected={category === item}
                  onPress={() => setCategory(item)}
                />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text variant="subhead" color={colors.textSecondary}>
              Visit format
            </Text>
            <View style={styles.wrap}>
              <LiveChip
                label="Any format"
                selected={mode === "All"}
                onPress={() => setMode("All")}
              />
              {modes.map((item) => (
                <LiveChip
                  key={item}
                  label={item}
                  selected={mode === item}
                  onPress={() => setMode(item)}
                />
              ))}
            </View>
          </View>
          <Text variant="footnote" color={colors.textSecondary}>
            {visiblePractices.length}{" "}
            {visiblePractices.length === 1 ? "practice" : "practices"} ·
            Chandigarh · Fees in INR
          </Text>
          {visiblePractices.length ? (
            visiblePractices.map((practice) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
                services={data.services.filter(
                  (service) =>
                    service.practiceId === practice.id && service.active,
                )}
                onPress={() => {
                  Keyboard.dismiss();
                  setPracticeId(practice.id);
                }}
              />
            ))
          ) : (
            <LiveCard>
              <View style={styles.emptyIcon}>
                <Feather name="search" size={26} color={colors.blue} />
              </View>
              <Text variant="title3">
                {approved.length
                  ? "No matching practitioners"
                  : "Practitioners will appear here"}
              </Text>
              <Text variant="callout" color={colors.textSecondary}>
                {approved.length
                  ? "Try a different category, format or search."
                  : "There are no approved practice listings available yet. Check back as practitioners join the Chandigarh beta."}
              </Text>
              {approved.length ? (
                <Button
                  title="Clear filters"
                  variant="secondary"
                  onPress={() => {
                    setQuery("");
                    setCategory("All");
                    setMode("All");
                  }}
                />
              ) : (
                <Button
                  title="Refresh directory"
                  variant="secondary"
                  onPress={() => void refreshNow()}
                  loading={refreshing}
                />
              )}
            </LiveCard>
          )}
        </>
      ) : null}

      {tab === "family" ? <LiveClientFamily /> : null}

      <Sheet
        visible={Boolean(bookingId)}
        title="Appointment"
        onClose={() => setBookingId(null)}
      >
        {selectedBooking ? (
          <LiveBookingDetail
            key={selectedBooking.id}
            booking={selectedBooking}
            onClose={() => setBookingId(null)}
          />
        ) : (
          <View style={styles.section}>
            <LiveNotice
              message={
                bookingId === receivedId
                  ? "Your request was received. Refresh to load its appointment details."
                  : "This appointment is no longer available to your account. Refresh to check your current access."
              }
            />
            <Button
              title="Refresh appointments"
              onPress={() => void refreshNow()}
              loading={refreshing}
            />
            <Button
              title="Close"
              variant="tertiary"
              onPress={() => setBookingId(null)}
            />
          </View>
        )}
      </Sheet>
    </LivePage>
  );
}

function BookingRow({
  booking,
  onPress,
  prominent = false,
  simple = false,
}: {
  booking: LiveBooking;
  onPress: () => void;
  prominent?: boolean;
  simple?: boolean;
}) {
  const color =
    booking.status === "Requested"
      ? colors.amber
      : booking.status === "Confirmed"
        ? colors.blue
        : booking.status === "Completed"
          ? colors.sage
          : colors.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booking.status}, ${booking.serviceName} for ${booking.attendeeName}, ${dateLabel(booking.date)} at ${timeLabel(booking.time)} IST. View appointment.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.booking,
        prominent && styles.prominentBooking,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.flex}>
        <Text
          variant="footnote"
          color={color}
          style={simple && styles.simpleMeta}
        >
          {booking.status}
        </Text>
        <Text variant={simple ? "title2" : prominent ? "title3" : "headline"}>
          {booking.serviceName}
        </Text>
        <Text variant="callout" style={simple && styles.simpleBody}>
          {dateLabel(booking.date)} · {timeLabel(booking.time)} IST
        </Text>
        <Text
          variant="footnote"
          color={colors.textSecondary}
          style={simple && styles.simpleMeta}
        >
          {booking.attendeeName} · {booking.practitionerName}
        </Text>
        <Text
          variant="footnote"
          color={colors.textSecondary}
          style={simple && styles.simpleMeta}
        >
          {booking.mode}
        </Text>
        {simple ? (
          <Text color={colors.blue} style={styles.simpleBody}>
            View appointment
          </Text>
        ) : null}
      </View>
      <Feather
        name="chevron-right"
        size={simple ? 24 : 20}
        color={colors.textTertiary}
      />
    </Pressable>
  );
}

function SimpleAction({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: "calendar" | "search" | "users" | "arrow-left";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={({ pressed }) => [styles.simpleAction, pressed && styles.pressed]}
    >
      <Feather name={icon} size={26} color={colors.blue} />
      <Text variant="title2" color={colors.blue} style={styles.flex}>
        {title}
      </Text>
      <Feather name="chevron-right" size={22} color={colors.blue} />
    </Pressable>
  );
}

function PracticeCard({
  practice,
  services,
  onPress,
}: {
  practice: LivePractice;
  services: LiveService[];
  onPress: () => void;
}) {
  const lowest = services.length
    ? Math.min(...services.map((service) => service.priceInr))
    : null;
  return (
    <LiveCard>
      <View style={styles.row}>
        <View style={styles.practiceAvatar}>
          <Text variant="title3" color={colors.blue}>
            {practice.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text variant="title3">{practice.name}</Text>
          <Text variant="subhead" color={colors.textSecondary}>
            {practice.title}
          </Text>
        </View>
      </View>
      <Text variant="callout" color={colors.textSecondary}>
        {practice.address}
      </Text>
      <View style={styles.wrap}>
        <Text variant="subhead" color={colors.blue}>
          {practice.category}
        </Text>
        {lowest !== null ? (
          <Text variant="subhead">From {price(lowest)}</Text>
        ) : null}
      </View>
      <Text variant="footnote" color={colors.textSecondary}>
        {[...new Set(services.flatMap((service) => service.modes))].join(
          " · ",
        ) || "No active services"}
      </Text>
      {!practice.acceptingRequests ? (
        <Text variant="footnote" color={colors.amber}>
          New requests paused
        </Text>
      ) : null}
      <Button
        title="View practice"
        variant="secondary"
        size="md"
        onPress={onPress}
      />
    </LiveCard>
  );
}

function PracticeProfile({
  practice,
  services,
  onRequest,
}: {
  practice: LivePractice;
  services: LiveService[];
  onRequest: (service: LiveService) => void;
}) {
  return (
    <>
      <LiveCard>
        <Text variant="title2">{practice.title}</Text>
        <Text variant="subhead" color={colors.blue}>
          {practice.category}
        </Text>
        <Text>{practice.bio}</Text>
        <View style={styles.detail}>
          <Text variant="footnote" color={colors.textSecondary}>
            Qualification supplied by the practitioner
          </Text>
          <Text variant="callout">{practice.qualification}</Text>
        </View>
        <View style={styles.detail}>
          <Text variant="footnote" color={colors.textSecondary}>
            Languages
          </Text>
          <Text variant="callout">{practice.languages.join(", ")}</Text>
        </View>
        <View style={styles.detail}>
          <Text variant="footnote" color={colors.textSecondary}>
            Practice address
          </Text>
          <Text variant="callout">{practice.address}</Text>
        </View>
      </LiveCard>
      {!practice.acceptingRequests ? (
        <LiveNotice message="This practitioner has paused new appointment requests." />
      ) : null}
      <View style={styles.section}>
        <Text variant="title2">Services & fees</Text>
        {services.length ? (
          services.map((service) => (
            <LiveCard key={service.id}>
              <Text variant="title3">{service.name}</Text>
              {service.description ? (
                <Text variant="callout" color={colors.textSecondary}>
                  {service.description}
                </Text>
              ) : null}
              <View style={styles.wrap}>
                <Text variant="headline">{price(service.priceInr)}</Text>
                <Text variant="callout" color={colors.textSecondary}>
                  {service.durationMinutes} minutes
                </Text>
              </View>
              <Text variant="footnote" color={colors.textSecondary}>
                {service.modes.join(" · ")}
              </Text>
              <Button
                title={`Request ${service.name}`}
                disabled={
                  !practice.acceptingRequests || service.modes.length === 0
                }
                onPress={() => onRequest(service)}
              />
            </LiveCard>
          ))
        ) : (
          <LiveCard>
            <Text variant="callout" color={colors.textSecondary}>
              No services are currently available to request.
            </Text>
          </LiveCard>
        )}
      </View>
      <Text variant="footnote" color={colors.textSecondary}>
        Appointments use {launchMarket.timeZoneLabel}. Your practitioner must
        confirm a requested time. Fees are shown in {launchMarket.currency};
        payment is arranged directly with the practitioner.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: 14,
  },
  activeTab: { backgroundColor: colors.surface },
  shrink: { flexShrink: 1 },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  section: { gap: spacing.md },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  refresh: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textAction: {
    minHeight: 48,
    maxWidth: "100%",
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  summaryRow: { flexDirection: "row", gap: spacing.md },
  summary: {
    flex: 1,
    minWidth: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 18,
    gap: spacing.xs,
  },
  booking: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  prominentBooking: {
    borderWidth: 1,
    borderColor: colors.blue,
    padding: spacing.xl,
  },
  followUp: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.blueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  practiceAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueTint,
  },
  detail: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.65 },
  simpleBody: { fontSize: 20, lineHeight: 28, flexShrink: 1 },
  simpleMeta: { fontSize: 18, lineHeight: 25 },
  simpleActions: { gap: spacing.md },
  simpleAction: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  simpleFilters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  simpleFilter: {
    minHeight: 56,
    flexGrow: 1,
    minWidth: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  simpleFilterSelected: { backgroundColor: colors.blueTint },
});
