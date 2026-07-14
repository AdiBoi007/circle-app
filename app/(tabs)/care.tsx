import { useMemo, useState } from "react";
import { Feather as FeatherBase } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  Avatar,
  Button,
  Card,
  ScreenContainer,
  ScreenHeader,
  SectionHeading,
  Sheet,
  StatusPill,
  Text,
} from "@/components";
import {
  careCategories,
  careProfessionals,
  family,
  providerById,
} from "@/data";
import { useAppState } from "@/state";
import { colors, radius, shadows, spacing } from "@/theme";
import type { CareProfessional, MemberId } from "@/types";
import { SavitaCare } from '@/accounts/savita/SavitaCare';

function Feather({
  name,
  size,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const resolved = (
    name === "sparkles" ? "star" : name
  ) as keyof typeof FeatherBase.glyphMap;
  return <FeatherBase name={resolved} size={size} color={color} />;
}

export default function CareScreen() {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <SavitaCare /> : <ArjunCareScreen />;
}

function ArjunCareScreen() {
  const params = useLocalSearchParams<{ match?: string }>();
  const { bookings, savedProviders } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState(false);
  const [matching, setMatching] = useState(params.match === "true");
  const [matchText, setMatchText] = useState("");
  const [member, setMember] = useState<MemberId | "all">("all");
  const [language, setLanguage] = useState("Any");
  const [mode, setMode] = useState("Any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"Match" | "Rating" | "Price">("Match");
  const visible = useMemo(
    () =>
      careProfessionals
        .filter(
          (pro) =>
            (category === "all" || pro.category === category) &&
            (member === "all" || pro.recommendedFor.includes(member)) &&
            (language === "Any" || pro.languages.includes(language)) &&
            (mode === "Any" || pro.modes.includes(mode as never)) &&
            (!verifiedOnly || pro.verified) &&
            `${pro.name} ${pro.title} ${pro.specialisations.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Rating"
            ? b.rating - a.rating
            : sort === "Price"
              ? a.price - b.price
              : b.matchScore - a.matchScore,
        ),
    [category, member, language, mode, verifiedOnly, query, sort],
  );
  const results = matchText
    ? careProfessionals
        .filter(
          (pro) =>
            pro.category === "nutrition" &&
            pro.languages.includes("Hindi") &&
            pro.price <= 1200,
        )
        .sort((a, b) =>
          a.id === "rhea-malhotra" ? -1 : b.matchScore - a.matchScore,
        )
    : [];
  return (
    <ScreenContainer bottomInset={120}>
      <ScreenHeader
        title="Find the right care"
        titleVariant="title1"
        subtitle="Vetted, non-doctor professionals for your whole family."
        style={styles.header}
      />
      <Button
        title="Match with Circle AI"
        variant="secondary"
        icon={<Feather name="sparkles" size={18} color={colors.blue} />}
        onPress={() => setMatching(true)}
        style={styles.matchButton}
      />
      <View style={styles.search}>
        <Feather name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search care, language or specialty"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
        <Pressable onPress={() => setFilters(true)}>
          <Feather name="sliders" size={19} color={colors.blue} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.categoriesWrap}
      >
        {careCategories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setCategory(cat.id)}
            accessibilityRole="button"
            accessibilityLabel={`${cat.label} care category`}
            accessibilityState={{ selected: category === cat.id }}
            style={[styles.chip, category === cat.id && styles.chipActive]}
          >
            <Feather
              name={cat.icon}
              size={15}
              color={category === cat.id ? colors.white : colors.textSecondary}
            />
            <Text
              variant="subhead"
              color={category === cat.id ? colors.white : colors.textPrimary}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {bookings.filter((item) => item.status === "Confirmed").length ? (
        <View style={styles.section}>
          <SectionHeading title="Upcoming bookings" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontal}
          >
            {bookings
              .filter((item) => item.status === "Confirmed")
              .map((booking) => {
                const pro = providerById(booking.providerId);
                return (
                  <Card
                    key={booking.id}
                    style={styles.booking}
                    onPress={() => router.push(`/booking/${booking.id}`)}
                  >
                    <View style={styles.bookingPerson}>
                      {pro ? <Avatar name={pro.name} accent={pro.accent} size={42} /> : null}
                      <View style={styles.proTitle}>
                        <Text variant="headline">{pro?.name}</Text>
                        <Text variant="footnote" color={colors.textSecondary}>
                          {booking.memberId} · {booking.date}
                        </Text>
                      </View>
                    </View>
                    <StatusPill label={booking.time} accent="blue" />
                  </Card>
                );
              })}
          </ScrollView>
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeading
          title={
            category === "all"
              ? "Recommended for your family"
              : (careCategories.find((item) => item.id === category)?.label ??
                "Care")
          }
          action={{
            label: `${visible.length} matches`,
            onPress: () => setFilters(true),
          }}
        />
        <View style={styles.list}>
          {visible.slice(0, category === "all" ? 8 : 36).map((pro) => (
            <ProfessionalCard
              key={pro.id}
              pro={pro}
              saved={savedProviders.includes(pro.id)}
            />
          ))}
        </View>
      </View>
      {savedProviders.length ? (
        <View style={styles.section}>
          <SectionHeading title="Saved professionals" />
          <View style={styles.list}>
            {savedProviders
              .map(providerById)
              .filter(Boolean)
              .map((pro) => (
                <ProfessionalCard key={pro!.id} pro={pro!} saved />
              ))}
          </View>
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeading title="Online care" />
        <Text variant="callout" color={colors.textSecondary}>
          Flexible sessions across time zones, with records shared only when you
          choose.
        </Text>
        <SectionHeading title="Home care" />
        <Text variant="callout" color={colors.textSecondary}>
          Verified physiotherapy, nursing, caregiving and elder-care support in
          Delhi NCR.
        </Text>
      </View>
      <Sheet
        visible={filters}
        onClose={() => setFilters(false)}
        title="Search & filters"
        footer={
          <View style={styles.sheetGap}>
            <Button title="Show results" onPress={() => setFilters(false)} />
            <Button
              title="Clear filters"
              variant="secondary"
              onPress={() => {
                setMember("all");
                setLanguage("Any");
                setMode("Any");
                setVerifiedOnly(false);
                setSort("Match");
              }}
            />
          </View>
        }
      >
        <View style={styles.sheetGap}>
          <Text variant="caption" color={colors.textSecondary}>
            MEMBER
          </Text>
          <ChoiceRow
            options={["all", ...family.map((item) => item.id)]}
            value={member}
            onChange={(value) => setMember(value as MemberId | "all")}
          />
          <Text variant="caption" color={colors.textSecondary}>
            LANGUAGE
          </Text>
          <ChoiceRow
            options={["Any", "Hindi", "English"]}
            value={language}
            onChange={setLanguage}
          />
          <Text variant="caption" color={colors.textSecondary}>
            MODE
          </Text>
          <ChoiceRow
            options={["Any", "Online", "Home visit"]}
            value={mode}
            onChange={setMode}
          />
          <Text variant="caption" color={colors.textSecondary}>
            SORT
          </Text>
          <ChoiceRow
            options={["Match", "Rating", "Price"]}
            value={sort}
            onChange={(value) => setSort(value as typeof sort)}
          />
          <Button
            title={verifiedOnly ? "Verified only ✓" : "Verified only"}
            variant="secondary"
            onPress={() => setVerifiedOnly((value) => !value)}
          />
        </View>
      </Sheet>
      <Sheet
        visible={matching}
        onClose={() => setMatching(false)}
        title="AI care matching"
      >
        <View style={styles.sheetGap}>
          <Text variant="callout" color={colors.textSecondary}>
            Describe needs, preferences, budget and availability—or use the
            guided example.
          </Text>
          <TextInput
            value={matchText}
            onChangeText={setMatchText}
            multiline
            placeholder="My father has diabetes, prefers vegetarian Indian meals, speaks Hindi, needs evening online sessions and has a ₹1,200 budget."
            placeholderTextColor={colors.textTertiary}
            style={styles.matchInput}
          />
          <Button
            title="Find matches"
            onPress={() =>
              setMatchText(
                (value) =>
                  value ||
                  "My father has diabetes, prefers vegetarian Indian meals, speaks Hindi, needs evening online sessions and has a ₹1,200 budget.",
              )
            }
          />
          {results.map((pro, index) => (
            <Card
              key={pro.id}
              onPress={() => {
                setMatching(false);
                router.push(`/provider/${pro.id}`);
              }}
            >
              <View style={styles.proTop}>
                <Avatar name={pro.name} accent={pro.accent} size={48} />
                <View style={styles.proTitle}>
                  <Text variant="caption" color={colors.blue}>#{index + 1} · {pro.matchScore}% MATCH</Text>
                  <Text variant="headline">{pro.name}</Text>
                  <Text variant="footnote" color={colors.textSecondary}>{pro.why}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </Sheet>
    </ScreenContainer>
  );
}

function ProfessionalCard({
  pro,
  saved,
}: {
  pro: CareProfessional;
  saved: boolean;
}) {
  return (
    <Card onPress={() => router.push(`/provider/${pro.id}`)}>
      <View style={styles.proTop}>
        <Avatar name={pro.name} accent={pro.accent} size={52} />
        <View style={styles.proTitle}>
          <Text variant="headline">{pro.name}</Text>
          <Text variant="subhead" color={colors.textSecondary}>
            {pro.title}
          </Text>
        </View>
        <Feather
          name={saved ? "bookmark" : "chevron-right"}
          size={20}
          color={saved ? colors.blue : colors.textTertiary}
        />
      </View>
      <Text variant="callout" color={colors.textSecondary} style={styles.blurb}>
        {pro.why}
      </Text>
      <View style={styles.proMeta}>
        <StatusPill label={`${pro.matchScore}% match`} accent={pro.accent} />
        <Text variant="footnote" color={colors.textSecondary}>
          ★ {pro.rating} ({pro.reviewCount}) · {pro.currency}
          {pro.price}
          {pro.priceSuffix}
        </Text>
      </View>
    </Card>
  );
}
function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.choiceRow}
    >
      {options.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          style={[styles.choice, value === item && styles.choiceActive]}
        >
          <Text
            variant="caption"
            color={value === item ? colors.white : colors.textSecondary}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  header: { marginTop: spacing.sm },
  matchButton: { marginTop: spacing.lg },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.textPrimary },
  categoriesWrap: { marginTop: spacing.lg, marginHorizontal: -spacing.xl },
  categories: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    minHeight: 44,
  },
  chipActive: { backgroundColor: colors.textPrimary },
  section: { marginTop: spacing.xxxl, gap: spacing.lg },
  list: { gap: spacing.lg },
  proTop: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  proTitle: { flex: 1, gap: 1 },
  blurb: { marginTop: spacing.lg },
  proMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  horizontal: { gap: spacing.md },
  booking: { width: 230, gap: spacing.sm },
  bookingPerson: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  sheetGap: { gap: spacing.md },
  choiceRow: { gap: spacing.sm },
  choice: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
  },
  choiceActive: { backgroundColor: colors.textPrimary },
  matchInput: {
    minHeight: 110,
    textAlignVertical: "top",
    padding: spacing.lg,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    fontSize: 16,
  },
});
