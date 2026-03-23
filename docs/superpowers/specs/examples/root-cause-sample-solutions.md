## Proposal

### Please re-state the problem that we are trying to solve in this issue.

After importing members, tapping device back after closing the success modal returns to the import page instead of staying on the members page.

### What is the root cause of that problem?

1. The success `ConfirmModal` adds navigation-back handling when it opens.
2. The modal-related history state is only cleaned up after the modal fully hides.
3. The current close handler calls `Navigation.goBack` before that cleanup finishes, so the route stack still retains the import page.

### What changes do you think we should make in order to solve the problem?

- Delay `Navigation.goBack` until the confirm modal has completely hidden.
- Use local component state to hide the modal first, then navigate in `onModalHide`.
- Keep the modal's back-handling behavior intact while it is visible so device back still behaves correctly during the modal state.

### What alternative solutions did you explore? (Optional)

1. Remove the modal-related history state directly in the confirm handler before calling `Navigation.goBack`.
2. Teach `Navigation.goBack` to detect and discard modal-only history state before route navigation.
