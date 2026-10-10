# Roadmap

## Hero train visibility
- [x] Enlarge the train and add warm windows, bloom, fading trail, rail and headlight below the card.
- [x] Verify smooth once-per-cycle crossing and hidden-tab/off-screen pausing without changing the hero layout.

## Home viewport audit
- [x] Check 1920, 1440, 1280, 1024, 768 and 390px widths plus 1366×700.
- [x] Fix and verify any overflow, overlaps or exposed photo edges.

## Adaptive hero
- [x] Center a full-viewport minimum-height hero, fluid headline and equally bounded search card.
- [x] Stack fields and wrap controls below 900px; retain safe background overscan.
- [x] Verify 360–2560px widths, short laptop heights, and picker behavior.

## Animation performance
- [x] Limit compositor hints to active motion and delay hero decoration until content loads.
- [x] Pause off-screen animations and disable cursor, particles and parallax on phones.
- [x] Shorten mobile animation durations by 20% and verify behavior.

## Global polish
- [x] Add once-only below-fold reveals and desktop dot/trailing-ring cursor.
- [x] Add morphing theme icon and circular theme reveal, spring button release and drawing footer underlines.
- [x] Verify desktop, touch and reduced-motion behavior.

## Payment delight
- [x] Add ticket entrance, perforated tear, drawn success burst, QR wipe and staggered details.
- [x] Stop marigold sparks after 1.5 seconds and verify desktop, phone and reduced motion.

## Booking-flow motion
- [x] Connect search-to-summary morph and fade-in results.
- [x] Animate train entrances, fares, chips, expansion and loading placeholders.
- [x] Animate step progress and mobile fare changes; verify reduced motion.

## Marquee motion upgrade
- [x] Add eased continuous motion, scroll-speed boost and 2–3 degree skew.
- [x] Add city hover emphasis, ripple and destination-field flight.
- [x] Verify interactions and reduced-motion behavior.

- [x] Compress the background photo and show a blurred loading placeholder.
- [x] Match fallback font metrics and verify stable loading.

- [x] Add tomorrow as the default date and quick date choices in the calendar.
- [x] Add accessible station autocomplete with keyboard navigation.
- [x] Strengthen the swap control and simplify the search action.
- [x] Show field-level validation after an incomplete submission.
- [x] Verify the search form on desktop and mobile.

## City marquee (2026-10-07)
- [x] Each city is a clickable chip that fills the "To" field.
- [x] Animation pauses on hover.
- [x] Solid text at 70% opacity, no outline stroke.
- [x] Gap between popular routes and the marquee reduced.

## Footer overhaul (2026-10-07)
- [x] Footer text 13px+
- [x] "Take the scenic route" as a link: underline on hover + arrow icon
- [x] Links: About, Help, Cancellation and refund policy, Privacy, Contact
- [x] Transparency line: Rail Daddy is a booking assistant; tickets issued through authorized Indian Railways channels
- [x] Trust icon row: secure payment + refund policy
- [ ] Contact page needs real email / phone from the owner (placeholder copy only)
- [x] Post-search screens: results, seats, passengers, payment (light theme, 4-step progress, sticky mobile fare bar)
- [x] Mobile-first pass: 2-line headline, swipeable class pills, verified at 360px

## Shared motion system
- [x] Define and test shared easing, duration, spring, stagger and distance tokens.
- [x] Apply transform/opacity entrances and hover/press feedback across pages without layout or color changes.
- [x] Add Lenis scrolling with reduced-motion and picker support; verify desktop and 360px behavior.

## Home first-load choreography
- [x] Add once-per-session photo, header, masked words, underline, card, routes and marquee sequence.
- [x] Verify timing, repeat visits, reduced motion and pinned mobile controls.

## Hero depth
- [x] Add scroll parallax, quiet fireflies, passing train and scroll-away headline.
- [x] Verify scroll movement, mobile controls and reduced-motion behavior.

## Search micro-interactions
- [x] Add field, autocomplete, swap, calendar, class and passenger feedback.
- [x] Add magnetic search action, submit transition and validation shake.
- [x] Verify desktop, phone and reduced-motion interactions.

## Route-card motion
- [x] Add scroll entrances, lift, drawn border, traveling train dot and spotlight.
- [x] Fly city values into the fields, scroll to search and glow the fields.
- [x] Verify desktop, phone and reduced motion.

## Compact phone search card
- [x] Combine From and To into one block with two single-line rows, thin divider and swap on the right edge.
- [x] Put the date on one row with Today and Tomorrow chips; card padding 16px, row gap 8px, radius 20px.
- [x] Verify 393px, desktop 1280px, reduced motion and the pinned button layering.

## Phone class/passengers/quota summary row
- [x] One 48px summary row ("3A · 2 passengers · General") with chevron replaces the controls panel under 640px.
- [x] Bottom sheet with drag handle, 55% backdrop, class pills, passenger counter, quota dropdown and Done; selections update the row live.
- [x] Desktop layout unchanged; verified 393px and 1280px.

## Phone Find my train placement
- [x] Button lives inside the card as its last element: full width, 52px tall, 16px space above.
- [x] Sticky version with gradient fade appears only after the card scrolls out of view; footer stays fully visible.
- [x] Verified 393px: no cutoff or overlap at the card bottom.
