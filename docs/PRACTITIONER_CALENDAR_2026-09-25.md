# Practitioner calendar redesign — 25 September 2026

The Schedule tab now opens a calendar, with the existing weekly-hours form moved into an Availability sheet. The warm off-white app background remains, with a white time grid, red selected dates/Today control, and restrained appointment colours.

## Navigation and behaviour

- Day, Week and List views share the selected civil date and current practice state.
- The month picker, previous/next week controls and Today shortcut navigate without changing any appointment. List covers the next 14 days from the selected date.
- Confirmed and requested appointments have separate colours and text status in the agenda; cancelled and declined requests stay in the request history. Appointment blocks open the existing request detail screen.
- Block height follows duration. Concurrent pending requests occupy separate columns; adjacent appointments reuse a column.
- Shaded hours and days off reflect saved practice availability. The editor retains validation and confirmed-appointment guards, with Save and Cancel for weekly hours.
- All times remain IST. Today and the red time indicator use the existing fixed demo clock: 25 September 2026, 09:00 IST. This is not Apple/iCloud Calendar integration.

## Design references

[Apple Calendar views](https://support.apple.com/en-ie/guide/iphone/iphfd1054569/ios) informed the day/week/list navigation and date selection. [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/) was read before implementation. No additional dependency was added.

## Verification

TypeScript, lint, all 62 regression checks, and web/iOS/Android bundle exports pass. The existing 49 checks plus 13 calendar checks cover calendar boundaries, overlap layout, navigation callbacks, appointment links, and availability updates. Browser inspection covered the rendered day and week views. Native device interaction is not established by bundle export or the source-level interaction harness.
