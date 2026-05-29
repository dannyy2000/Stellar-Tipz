import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "../notificationStore";

describe("notificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] });
  });

  it("addNotification adds with id and timestamp", () => {
    const id = useNotificationStore
      .getState()
      .addNotification({ type: "tip", title: "Test", message: "Hello", unread: true });
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    const n = useNotificationStore.getState().notifications[0];
    expect(n.id).toBe(id);
    expect(n.timestamp).toBeGreaterThan(0);
    expect(n.title).toBe("Test");
  });

  it("addNotification prepends to the list", () => {
    useNotificationStore.getState().addNotification({ type: "tip", title: "First", message: "", unread: true });
    useNotificationStore.getState().addNotification({ type: "system", title: "Second", message: "", unread: true });
    expect(useNotificationStore.getState().notifications).toHaveLength(2);
    expect(useNotificationStore.getState().notifications[0].title).toBe("Second");
  });

  it("markAsRead sets unread to false", () => {
    const id = useNotificationStore
      .getState()
      .addNotification({ type: "tip", title: "Test", message: "", unread: true });
    useNotificationStore.getState().markAsRead(id);
    expect(useNotificationStore.getState().notifications[0].unread).toBe(false);
  });

  it("markAllAsRead sets all unread to false", () => {
    useNotificationStore.getState().addNotification({ type: "tip", title: "A", message: "", unread: true });
    useNotificationStore.getState().addNotification({ type: "system", title: "B", message: "", unread: true });
    useNotificationStore.getState().markAllAsRead();
    useNotificationStore.getState().notifications.forEach((n) => {
      expect(n.unread).toBe(false);
    });
  });

  it("clearAll removes all notifications", () => {
    useNotificationStore.getState().addNotification({ type: "tip", title: "A", message: "", unread: true });
    useNotificationStore.getState().addNotification({ type: "system", title: "B", message: "", unread: true });
    useNotificationStore.getState().clearAll();
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
