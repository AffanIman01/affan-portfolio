# Portfolio analytics — awaiting account activation

Status: integration prepared; collection is OFF until the owner supplies a Google Analytics 4 Measurement ID. No account or GA4 property has been created by this change.

## Private dashboard

Reports live at https://analytics.google.com/ and require access to the owner's Google Analytics property. There is no public dashboard or report API in the portfolio. A Measurement ID is a public collection identifier, not a password and not permission to read reports. Do not add credentials or API secrets to this repository.

## Activate

1. In your own Google Analytics account, create/select a GA4 property, then a Web data stream for https://mechaz.my. Use Malaysia time (Asia/Kuala_Lumpur).
2. Copy the `G-...` Measurement ID from Admin → Data streams → Web stream details.
3. Set `measurementId` in `docs/analytics-config.json` (GitHub) and `dist/analytics-config.json` (Sites source) to that ID. Keep the ID blank until the correct property is confirmed.
4. Disable Enhanced measurement in this stream: the portfolio explicitly sends its own page and interaction events. This avoids duplicate page views, duplicate download/outbound events, or additional automatically collected URL values.
5. Keep Google Signals, advertising features and user-provided data collection disabled. Keep property access limited to the owner/intended administrators; don't publish shared reports.
6. Deploy both copies. On the live site, allow analytics, open a project, click a resume/contact link and check Realtime. Ignore your test visit when reviewing traffic. Data starts after activation; it cannot recover previous visits.

## What is measured

- `page_view`: one page load after analytics is allowed; never autoplay slides.
- `project_open`: intentional clicks on IC gallery details, robotics highlight details or robotics lab cards. Parameters: `project_id`, `gallery`.
- `section_open`: intentional navigation to IC Design, Robotics, Software, About or Credentials. Parameter: `section`. This is navigation, not proof someone read a section.
- `resume_open`: resume link clicks. It does not prove a completed download or reading.
- `contact_click`: email or LinkedIn link clicks, not completed messages. Parameter: `channel`.

Register event-scoped custom dimensions for `project_id`, `gallery`, `section` and `channel` to break down reports. Mark `resume_open` and `contact_click` as key events if desired. Reports show aggregate traffic, not the identities of recruiters.

## Collection choices

Google's tag loads only after the visitor allows analytics. No Google Analytics requests are sent while unconfigured, on preview hosts, before consent, after rejection, or when browser GPC / Do Not Track is enabled. Visitors can change their choice using Analytics preferences in the footer. Preferences are stored locally; optional GA cookies expire after 30 days. Advertising consent is always denied. No session replay, form capture, user ID or email address is sent by the integration. Page query strings and hashes are stripped; only simple UTM source/medium/campaign labels are passed separately. Referrers are reduced to origin. Never put personal identifiers in UTM tags.

Ad blockers and visitors who decline tracking will reduce measured counts. Testing with no ID confirms only the inactive integration, not delivery to Google.

## Verification

`node --test analytics-tests/analytics.test.mjs` from the Sites source checkout checks production-host gating, config gating, URL minimization and click classification. Final delivery testing requires the owner's Measurement ID.
