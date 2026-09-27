import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Button, Sheet, Text } from "@/components";
import { launchMarket } from "@/config/launch";
import {
  addCalendarDays,
  calendarDayLabel,
  startOfCalendarWeek,
} from "@/practitioner/calendar";
import type { PracticeCategory, PracticeHours } from "@/practitioner/types";
import { colors } from "@/theme";
import type { CareMode } from "@/types";

import { LiveBookingDetail } from "./LiveBookingDetail";
import { useLive } from "./LiveProvider";
import type {
  LiveBooking,
  LivePractice,
  LivePracticeInput,
  LiveService,
  LiveServiceInput,
} from "./types";
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

type PracticeTab = "Today" | "Requests" | "Schedule" | "My practice";
const categories: PracticeCategory[] = [
  "Physiotherapy",
  "Therapy",
  "Fitness",
  "Nutrition",
  "Yoga",
];
const modes: CareMode[] = ["Online", "In person", "Home visit"];
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const statusFilters = [
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Declined",
  "All",
] as const;

function dateInIndia(timestamp: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: launchMarket.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}

function usePracticeAction() {
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
          : "The change could not be saved. Please try again.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, run, setError };
}

function PracticeBookingRow({
  booking,
  onPress,
}: {
  booking: LiveBooking;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${booking.attendeeName}, ${booking.serviceName}, ${dateLabel(booking.date)}, ${timeLabel(booking.time)} IST, ${booking.status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.booking, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text
          variant="footnote"
          color={booking.status === "Requested" ? colors.amber : colors.blue}
        >
          {booking.status}
        </Text>
        <Text variant="headline">{booking.attendeeName}</Text>
        <Text variant="callout">{booking.serviceName}</Text>
        <Text variant="footnote" color={colors.textSecondary}>
          {dateLabel(booking.date)} · {timeLabel(booking.time)} IST{"\n"}
          {booking.mode} · {booking.durationMinutes} min
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export function LivePracticeWorkspace() {
  const { data, refresh } = useLive();
  const [tab, setTab] = useState<PracticeTab>("Today");
  const [status, setStatus] =
    useState<(typeof statusFilters)[number]>("Requested");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<"profile" | "hours" | "service" | null>(
    null,
  );
  const [serviceId, setServiceId] = useState<string | null>(null);
  const action = usePracticeAction();
  if (!data)
    return (
      <LivePage title="My practice">
        <LiveNotice message="Loading your practice…" />
      </LivePage>
    );
  if (data.profile.role !== "practitioner")
    return (
      <LivePage title="My practice">
        <LiveNotice
          message="This workspace is available to practitioner accounts."
          error
        />
      </LivePage>
    );

  const practice = data.practices.find(
    (item) => item.ownerId === data.profile.id,
  );
  const services = practice
    ? data.services.filter((service) => service.practiceId === practice.id)
    : [];
  const bookings = practice
    ? data.bookings.filter((booking) => booking.practiceId === practice.id)
    : [];
  const today = dateInIndia(data.serverTime);
  const day = selectedDate ?? today;
  const pending = bookings.filter((booking) => booking.status === "Requested");
  const oldestPending = pending
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const todayBookings = bookings
    .filter(
      (booking) =>
        booking.date === today &&
        (booking.status === "Confirmed" || booking.status === "Completed"),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const filtered = bookings
    .filter((booking) => status === "All" || booking.status === status)
    .sort((a, b) =>
      status === "Requested"
        ? a.createdAt.localeCompare(b.createdAt)
        : a.startsAt.localeCompare(b.startsAt),
    );
  const visibleDay = bookings
    .filter(
      (booking) =>
        booking.date === day &&
        (booking.status === "Requested" ||
          booking.status === "Confirmed" ||
          booking.status === "Completed"),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const week = Array.from({ length: 7 }, (_, index) =>
    addCalendarDays(startOfCalendarWeek(day), index),
  );
  const hours = practice?.hours.find(
    (item) => item.day === new Date(`${day}T12:00:00Z`).getUTCDay(),
  );
  const closed = practice?.blockedDates.includes(day) || !hours?.enabled;
  const selectedBooking = bookings.find((booking) => booking.id === bookingId);
  const editingService = services.find((service) => service.id === serviceId);
  const openService = (id: string | null) => {
    setServiceId(id);
    setEditor("service");
  };

  return (
    <LivePage
      title={tab === "Today" ? "My practice" : tab}
      subtitle={`${practice?.name ?? data.profile.name} · ${launchMarket.city} · IST`}
      action={
        <Button
          title="Refresh"
          size="md"
          variant="tertiary"
          loading={action.busy}
          onPress={() => {
            void action.run(refresh);
          }}
        />
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {(
          ["Today", "Requests", "Schedule", "My practice"] as PracticeTab[]
        ).map((item) => (
          <LiveChip
            key={item}
            label={
              item === "Requests" && pending.length
                ? `Requests (${pending.length})`
                : item
            }
            selected={tab === item}
            onPress={() => setTab(item)}
          />
        ))}
      </ScrollView>
      {action.error ? <LiveNotice message={action.error} error /> : null}
      {!practice ? (
        <LiveCard>
          <View style={styles.stack}>
            <Text variant="title2">Set up your practice</Text>
            <Text color={colors.textSecondary}>
              Add your professional details, services and working hours. An
              operator reviews your profile before clients can request care.
            </Text>
            <Button
              title="Create practice profile"
              onPress={() => setEditor("profile")}
            />
          </View>
        </LiveCard>
      ) : (
        <>
          {practice.status !== "Approved" ? (
            <LiveCard>
              <View style={styles.stack}>
                <Text variant="headline">
                  {practice.status === "Pending"
                    ? "Awaiting practice approval"
                    : "Practice suspended"}
                </Text>
                <Text color={colors.textSecondary}>
                  {practice.status === "Pending"
                    ? "Your profile is awaiting operator review. You can prepare your services and availability."
                    : "New requests are unavailable while your practice is suspended."}
                </Text>
                {practice.reviewNote ? (
                  <Text variant="callout">{practice.reviewNote}</Text>
                ) : null}
              </View>
            </LiveCard>
          ) : !practice.acceptingRequests ? (
            <LiveNotice message="New requests are paused. You can still manage existing appointments." />
          ) : null}

          {tab === "Today" ? (
            <>
              <View style={styles.stats}>
                <Pressable
                  onPress={() => {
                    setStatus("Requested");
                    setTab("Requests");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${pending.length} requests awaiting your response`}
                  style={styles.stat}
                >
                  <Text variant="largeTitle" color={colors.blue}>
                    {pending.length}
                  </Text>
                  <Text variant="callout">Awaiting response</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedDate(today);
                    setTab("Schedule");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${todayBookings.length} confirmed or completed visits today`}
                  style={styles.stat}
                >
                  <Text variant="largeTitle">{todayBookings.length}</Text>
                  <Text variant="callout">Today’s visits</Text>
                </Pressable>
              </View>
              {oldestPending ? (
                <LiveCard>
                  <View style={styles.stack}>
                    <Text variant="title2">Next request to review</Text>
                    <PracticeBookingRow
                      booking={oldestPending}
                      onPress={() => setBookingId(oldestPending.id)}
                    />
                  </View>
                </LiveCard>
              ) : (
                <LiveNotice message="No requests awaiting your response." />
              )}
              <Text variant="title2">{dateLabel(today)}</Text>
              {todayBookings.length ? (
                todayBookings.map((booking) => (
                  <PracticeBookingRow
                    key={booking.id}
                    booking={booking}
                    onPress={() => setBookingId(booking.id)}
                  />
                ))
              ) : (
                <LiveCard>
                  <Text color={colors.textSecondary}>
                    No confirmed visits today.
                  </Text>
                </LiveCard>
              )}
              {!services.some((service) => service.active) ? (
                <Button
                  title="Add your first service"
                  variant="secondary"
                  onPress={() => openService(null)}
                />
              ) : null}
              {!practice.hours.some((item) => item.enabled) ? (
                <Button
                  title="Set working hours"
                  variant="secondary"
                  onPress={() => setEditor("hours")}
                />
              ) : null}
            </>
          ) : null}

          {tab === "Requests" ? (
            <>
              <View style={styles.chips}>
                {statusFilters.map((item) => (
                  <LiveChip
                    key={item}
                    label={item}
                    selected={status === item}
                    onPress={() => setStatus(item)}
                  />
                ))}
              </View>
              {filtered.length ? (
                filtered.map((booking) => (
                  <PracticeBookingRow
                    key={booking.id}
                    booking={booking}
                    onPress={() => setBookingId(booking.id)}
                  />
                ))
              ) : (
                <LiveCard>
                  <Text color={colors.textSecondary}>
                    No {status === "All" ? "" : `${status.toLowerCase()} `}
                    appointments.
                  </Text>
                </LiveCard>
              )}
            </>
          ) : null}

          {tab === "Schedule" ? (
            <>
              <View style={styles.between}>
                <Text variant="title2" style={styles.flex}>
                  {calendarDayLabel(day)}
                </Text>
                <Button
                  title="Today"
                  size="md"
                  fullWidth={false}
                  variant="tertiary"
                  onPress={() => setSelectedDate(today)}
                />
              </View>
              <View style={styles.between}>
                <Button
                  title="Previous week"
                  size="md"
                  fullWidth={false}
                  variant="secondary"
                  onPress={() => setSelectedDate(addCalendarDays(day, -7))}
                />
                <Button
                  title="Next week"
                  size="md"
                  fullWidth={false}
                  variant="secondary"
                  onPress={() => setSelectedDate(addCalendarDays(day, 7))}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {week.map((date) => (
                  <LiveChip
                    key={date}
                    label={new Date(`${date}T12:00:00Z`).toLocaleDateString(
                      "en-IN",
                      {
                        timeZone: launchMarket.timeZone,
                        weekday: "short",
                        day: "numeric",
                      },
                    )}
                    selected={date === day}
                    onPress={() => setSelectedDate(date)}
                  />
                ))}
              </ScrollView>
              <LiveNotice
                message={
                  closed
                    ? "Day off · existing appointments remain below."
                    : `Working hours ${timeLabel(hours!.start)}–${timeLabel(hours!.end)} IST`
                }
              />
              {visibleDay.length ? (
                visibleDay.map((booking) => (
                  <PracticeBookingRow
                    key={booking.id}
                    booking={booking}
                    onPress={() => setBookingId(booking.id)}
                  />
                ))
              ) : (
                <LiveCard>
                  <Text color={colors.textSecondary}>
                    No appointments on this date.
                  </Text>
                </LiveCard>
              )}
              <Button
                title="Edit working hours and days off"
                variant="secondary"
                onPress={() => setEditor("hours")}
              />
            </>
          ) : null}

          {tab === "My practice" ? (
            <>
              <LiveCard>
                <View style={styles.stack}>
                  <View style={styles.between}>
                    <Text variant="title2" style={styles.flex}>
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
                  <Text color={colors.textSecondary}>{practice.bio}</Text>
                  <Text variant="callout">{practice.qualification}</Text>
                  <Text variant="callout" color={colors.textSecondary}>
                    {practice.languages.join(", ")}
                    {"\n"}
                    {practice.address}
                    {"\n"}
                    {practice.contactEmail}
                    {practice.phone ? `\n${practice.phone}` : ""}
                  </Text>
                  <Text variant="footnote" color={colors.textSecondary}>
                    {practice.acceptingRequests
                      ? "Accepting new requests when approved"
                      : "New requests paused"}
                  </Text>
                  <Button
                    title="Edit profile"
                    variant="secondary"
                    onPress={() => setEditor("profile")}
                  />
                </View>
              </LiveCard>
              <View style={styles.between}>
                <Text variant="title2">Services & fees</Text>
                <Button
                  title="Add service"
                  size="md"
                  fullWidth={false}
                  variant="tertiary"
                  onPress={() => openService(null)}
                />
              </View>
              {services.length ? (
                services.map((service) => (
                  <LiveCard key={service.id}>
                    <View style={styles.stack}>
                      <Text variant="headline">{service.name}</Text>
                      <Text variant="callout" color={colors.textSecondary}>
                        {service.description}
                      </Text>
                      <Text>
                        {price(service.priceInr)} · {service.durationMinutes}{" "}
                        min
                      </Text>
                      <Text variant="footnote" color={colors.textSecondary}>
                        {service.modes.join(" · ")} ·{" "}
                        {service.active ? "Active" : "Paused"}
                      </Text>
                      <Button
                        title={`Edit ${service.name}`}
                        variant="secondary"
                        size="md"
                        onPress={() => openService(service.id)}
                      />
                    </View>
                  </LiveCard>
                ))
              ) : (
                <LiveNotice message="No services yet. Add a service with its duration, fee and supported visit formats." />
              )}
              <Button
                title="Manage availability"
                variant="secondary"
                onPress={() => setEditor("hours")}
              />
            </>
          ) : null}
        </>
      )}
      <Text variant="footnote" color={colors.textSecondary}>
        Schedule uses {launchMarket.timeZoneLabel}. Updated{" "}
        {new Date(data.serverTime).toLocaleString("en-IN", {
          timeZone: launchMarket.timeZone,
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        })}
        .
      </Text>
      <Sheet
        visible={bookingId !== null}
        onClose={() => setBookingId(null)}
        title="Appointment"
      >
        {selectedBooking ? (
          <LiveBookingDetail
            booking={selectedBooking}
            onClose={() => setBookingId(null)}
          />
        ) : bookingId ? (
          <LiveNotice
            message="This appointment is no longer available. Refresh your workspace."
            error
          />
        ) : null}
      </Sheet>
      <Sheet
        visible={editor === "profile"}
        onClose={() => setEditor(null)}
        title={practice ? "Edit practice profile" : "Create practice profile"}
      >
        {editor === "profile" ? (
          <PracticeProfileEditor
            practice={practice}
            onDone={() => setEditor(null)}
          />
        ) : null}
      </Sheet>
      <Sheet
        visible={editor === "service"}
        onClose={() => setEditor(null)}
        title={editingService ? "Edit service" : "Add service"}
      >
        {editor === "service" && practice ? (
          <PracticeServiceEditor
            key={serviceId ?? "new"}
            service={editingService}
            onDone={() => setEditor(null)}
          />
        ) : null}
      </Sheet>
      <Sheet
        visible={editor === "hours"}
        onClose={() => setEditor(null)}
        title="Working hours & days off"
      >
        {editor === "hours" && practice ? (
          <PracticeHoursEditor
            practice={practice}
            initialDate={day}
            onDone={() => setEditor(null)}
          />
        ) : null}
      </Sheet>
    </LivePage>
  );
}

function PracticeProfileEditor({
  practice,
  onDone,
}: {
  practice?: LivePractice;
  onDone: () => void;
}) {
  const { data, mutate } = useLive();
  const initial: LivePracticeInput = practice
    ? {
        name: practice.name,
        title: practice.title,
        category: practice.category,
        bio: practice.bio,
        qualification: practice.qualification,
        languages: [...practice.languages],
        address: practice.address,
        contactEmail: practice.contactEmail,
        phone: practice.phone,
        acceptingRequests: practice.acceptingRequests,
      }
    : {
        name: data!.profile.name,
        title: "",
        category: "Physiotherapy",
        bio: "",
        qualification: "",
        languages: [],
        address: "",
        contactEmail: data!.profile.email,
        phone: "",
        acceptingRequests: false,
      };
  const [draft, setDraft] = useState(initial);
  const [languages, setLanguages] = useState(initial.languages.join(", "));
  const action = usePracticeAction();
  const field = (key: keyof LivePracticeInput, value: string | boolean) =>
    setDraft((current) => ({ ...current, [key]: value }));
  async function save() {
    const next = {
      ...draft,
      languages: languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
    };
    if (await action.run(() => mutate("/practice", next, "PUT"))) onDone();
  }
  return (
    <View style={styles.stack}>
      <LiveNotice message="Use your actual practice information. Profile approval is reviewed by Circle’s operator." />
      <View pointerEvents={action.busy ? "none" : "auto"} style={styles.stack}>
        <LiveField
          label="Practice / professional name"
          value={draft.name}
          onChangeText={(value) => field("name", value)}
          maxLength={80}
        />
        <LiveField
          label="Professional title"
          value={draft.title}
          onChangeText={(value) => field("title", value)}
          maxLength={100}
        />
        <Text variant="headline">Category</Text>
        <View style={styles.chips}>
          {categories.map((category) => (
            <LiveChip
              key={category}
              label={category}
              selected={draft.category === category}
              onPress={() => setDraft((current) => ({ ...current, category }))}
            />
          ))}
        </View>
        <LiveField
          label="About your practice"
          value={draft.bio}
          onChangeText={(value) => field("bio", value)}
          multiline
          maxLength={1200}
        />
        <LiveField
          label="Qualification or training"
          value={draft.qualification}
          onChangeText={(value) => field("qualification", value)}
          maxLength={200}
        />
        <LiveField
          label="Languages, separated by commas"
          value={languages}
          onChangeText={setLanguages}
          maxLength={200}
        />
        <LiveField
          label="Practice address in Chandigarh"
          value={draft.address}
          onChangeText={(value) => field("address", value)}
          multiline
          maxLength={200}
        />
        <LiveField
          label="Contact email"
          value={draft.contactEmail}
          onChangeText={(value) => field("contactEmail", value)}
          keyboardType="email-address"
          maxLength={160}
        />
        <LiveField
          label="Phone (optional)"
          value={draft.phone}
          onChangeText={(value) => field("phone", value)}
          keyboardType="phone-pad"
          maxLength={20}
        />
        <Text variant="headline">New appointment requests</Text>
        <View style={styles.chips}>
          <LiveChip
            label="Accept when approved"
            selected={draft.acceptingRequests}
            onPress={() => field("acceptingRequests", true)}
          />
          <LiveChip
            label="Pause requests"
            selected={!draft.acceptingRequests}
            onPress={() => field("acceptingRequests", false)}
          />
        </View>
      </View>
      {action.error ? <LiveNotice message={action.error} error /> : null}
      <Button
        title="Save practice profile"
        loading={action.busy}
        onPress={() => {
          void save();
        }}
      />
      <Button
        title="Cancel"
        variant="tertiary"
        disabled={action.busy}
        onPress={onDone}
      />
    </View>
  );
}

function PracticeServiceEditor({
  service,
  onDone,
}: {
  service?: LiveService;
  onDone: () => void;
}) {
  const { mutate } = useLive();
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [duration, setDuration] = useState(
    service ? String(service.durationMinutes) : "",
  );
  const [fee, setFee] = useState(service ? String(service.priceInr) : "");
  const [formats, setFormats] = useState<CareMode[]>(service?.modes ?? []);
  const [active, setActive] = useState(service?.active ?? true);
  const [deleting, setDeleting] = useState(false);
  const action = usePracticeAction();
  async function save() {
    if (
      !/^\d+$/.test(duration) ||
      !/^\d+$/.test(fee) ||
      Number(duration) <= 0 ||
      Number(fee) <= 0
    ) {
      action.setError(
        "Enter a duration in whole minutes and a positive fee in whole rupees.",
      );
      return;
    }
    if (!formats.length) {
      action.setError("Choose at least one visit format.");
      return;
    }
    const input: LiveServiceInput = {
      ...(service ? { id: service.id } : {}),
      name,
      description,
      durationMinutes: Number(duration),
      priceInr: Number(fee),
      modes: formats,
      active,
    };
    if (await action.run(() => mutate("/practice/services", input))) onDone();
  }
  async function remove() {
    if (
      service &&
      (await action.run(() =>
        mutate(`/practice/services/${service.id}`, undefined, "DELETE"),
      ))
    )
      onDone();
  }
  return (
    <View style={styles.stack}>
      <View pointerEvents={action.busy ? "none" : "auto"} style={styles.stack}>
        <LiveField
          label="Service name"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
        <LiveField
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={600}
        />
        <LiveField
          label="Duration in minutes"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          maxLength={3}
        />
        <LiveField
          label="Consultation fee in INR (₹)"
          value={fee}
          onChangeText={setFee}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Text variant="headline">Visit formats</Text>
        <View style={styles.chips}>
          {modes.map((mode) => (
            <LiveChip
              key={mode}
              label={mode}
              selected={formats.includes(mode)}
              onPress={() =>
                setFormats((current) =>
                  current.includes(mode)
                    ? current.filter((item) => item !== mode)
                    : [...current, mode],
                )
              }
            />
          ))}
        </View>
        <Text variant="headline">Availability</Text>
        <View style={styles.chips}>
          <LiveChip
            label="Active"
            selected={active}
            onPress={() => setActive(true)}
          />
          <LiveChip
            label="Paused"
            selected={!active}
            onPress={() => setActive(false)}
          />
        </View>
      </View>
      {action.error ? <LiveNotice message={action.error} error /> : null}
      <Button
        title="Save service"
        loading={action.busy}
        onPress={() => {
          void save();
        }}
      />
      {service ? (
        deleting ? (
          <LiveCard>
            <View style={styles.stack}>
              <Text>
                Remove this service? Existing open bookings can prevent removal.
                Pausing stops new requests.
              </Text>
              <Button
                title="Remove service"
                disabled={action.busy}
                onPress={() => {
                  void remove();
                }}
              />
              <Button
                title="Keep service"
                variant="tertiary"
                disabled={action.busy}
                onPress={() => setDeleting(false)}
              />
            </View>
          </LiveCard>
        ) : (
          <Button
            title="Remove service"
            variant="tertiary"
            disabled={action.busy}
            onPress={() => setDeleting(true)}
          />
        )
      ) : null}
      <Button
        title="Cancel"
        variant="tertiary"
        disabled={action.busy}
        onPress={onDone}
      />
    </View>
  );
}

function PracticeHoursEditor({
  practice,
  initialDate,
  onDone,
}: {
  practice: LivePractice;
  initialDate: string;
  onDone: () => void;
}) {
  const { mutate } = useLive();
  const [draft, setDraft] = useState<PracticeHours[] | null>(null);
  const [date, setDate] = useState(initialDate);
  const action = usePracticeAction();
  const saved = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    ...(practice.hours.find((item) => item.day === day) ?? {
      day,
      enabled: false,
      start: "09:00",
      end: "17:00",
    }),
  }));
  const hours = draft ?? saved;
  const dirty = JSON.stringify(hours) !== JSON.stringify(saved);
  function update(day: number, patch: Partial<PracticeHours>) {
    setDraft(
      hours.map((item) => {
        if (item.day !== day) return item;
        const next = { ...item, ...patch };
        if (!next.enabled)
          return {
            ...next,
            start: /^([01]\d|2[0-3]):[0-5]\d$/.test(next.start)
              ? next.start
              : "09:00",
            end: /^([01]\d|2[0-3]):[0-5]\d$/.test(next.end)
              ? next.end
              : "17:00",
          };
        return next;
      }),
    );
  }
  async function save() {
    if (
      await action.run(
        () => mutate("/practice/hours", { hours }, "PUT"),
        "Weekly hours saved.",
      )
    )
      setDraft(null);
  }
  async function toggleDate(value: string) {
    if (
      await action.run(
        () => mutate("/practice/blocked-dates", { date: value }),
        practice.blockedDates.includes(value)
          ? "Date reopened."
          : "Date closed to new requests.",
      )
    )
      setDate("");
  }
  return (
    <View style={styles.stack}>
      <Text color={colors.textSecondary}>
        All hours use IST. Use 24-hour times, such as 09:00 and 17:00.
      </Text>
      <View pointerEvents={action.busy ? "none" : "auto"} style={styles.stack}>
        {hours.map((item) => (
          <LiveCard key={item.day}>
            <View style={styles.stack}>
              <View style={styles.between}>
                <Text variant="headline">{weekdays[item.day]}</Text>
                <LiveChip
                  label={item.enabled ? "Open" : "Closed"}
                  selected={item.enabled}
                  onPress={() => update(item.day, { enabled: !item.enabled })}
                />
              </View>
              {item.enabled ? (
                <>
                  <LiveField
                    label={`${weekdays[item.day]} opens at HH:mm`}
                    value={item.start}
                    onChangeText={(value) => update(item.day, { start: value })}
                    maxLength={5}
                  />
                  <LiveField
                    label={`${weekdays[item.day]} closes at HH:mm`}
                    value={item.end}
                    onChangeText={(value) => update(item.day, { end: value })}
                    maxLength={5}
                  />
                </>
              ) : null}
            </View>
          </LiveCard>
        ))}
      </View>
      <Button
        title="Save working hours"
        disabled={!dirty}
        loading={action.busy}
        onPress={() => {
          void save();
        }}
      />
      <Button
        title="Discard hours changes"
        disabled={!dirty || action.busy}
        variant="tertiary"
        onPress={() => setDraft(null)}
      />
      <Text variant="title2">Days off</Text>
      <LiveField
        label="Date to close or reopen, YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        maxLength={10}
        placeholder="YYYY-MM-DD"
      />
      <Button
        title={
          practice.blockedDates.includes(date.trim())
            ? "Reopen date"
            : "Close date"
        }
        variant="secondary"
        disabled={action.busy || !date.trim()}
        onPress={() => {
          void toggleDate(date.trim());
        }}
      />
      {practice.blockedDates.length ? (
        [...practice.blockedDates].sort().map((value) => (
          <View key={value} style={styles.between}>
            <Text style={styles.flex}>{dateLabel(value)}</Text>
            <Button
              title={`Reopen ${dateLabel(value)}`}
              size="md"
              variant="tertiary"
              fullWidth={false}
              disabled={action.busy}
              onPress={() => {
                void toggleDate(value);
              }}
            />
          </View>
        ))
      ) : (
        <Text variant="footnote" color={colors.textSecondary}>
          No dates closed.
        </Text>
      )}
      {action.error ? <LiveNotice message={action.error} error /> : null}
      {action.notice ? <LiveNotice message={action.notice} /> : null}
      <Button title="Done" disabled={action.busy || dirty} onPress={onDone} />
      {dirty ? (
        <Text variant="footnote" color={colors.textSecondary}>
          Save or discard your hours changes to finish.
        </Text>
      ) : null}
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: {
    flexGrow: 1,
    flexBasis: 125,
    minHeight: 115,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 5,
  },
  booking: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: { opacity: 0.7 },
});
