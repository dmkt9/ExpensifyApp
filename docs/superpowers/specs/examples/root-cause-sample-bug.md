#TITLE: Tapping back after closing import success modal returns to import flow

**Version Number:** 9.3.40-4
**Reproducible in staging?:** Yes
**Reproducible in production?:** No
**If this was caught during regression testing, add the test name, ID and link from BrowserStack:** N/A
**Email or phone of affected tester (no customers):** qa@example.com
**Logs:** No relevant client logs captured yet
**Expensify/Expensify Issue URL:** https://github.com/Expensify/App/issues/00000
**Issue reported by:** QA
**Slack conversation** (hyperlinked to channel name): [#expensify-open-source](https://expensify.slack.com/archives/example)

## Action Performed:
1. Open workspace members.
2. Import members from spreadsheet.
3. Wait for the success `ConfirmModal`.
4. Tap "Got it".
5. Tap device back button.

## Expected Result:
After dismissing the success modal, the app should return to the members page and device back should not re-open the import flow.

## Actual Result:
After dismissing the success modal, tapping device back returns to the previous import page.

## Workaround:
Yes. The tester can avoid using the device back button and navigate away from members manually. The tester has been informed.

## Platforms:
- [x] Android: App
- [ ] Android: mWeb Chrome
- [ ] iOS: App
- [ ] iOS: mWeb Safari
- [ ] iOS: mWeb Chrome
- [ ] Windows: Chrome
- [ ] MacOS: Chrome / Safari
