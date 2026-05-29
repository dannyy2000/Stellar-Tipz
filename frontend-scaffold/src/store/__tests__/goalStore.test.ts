import { describe, it, expect, beforeEach } from "vitest";
import { useGoalStore } from "../goalStore";
import type { Goal } from "@/types/contract";

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    creator: "GABC123",
    title: "Test Goal",
    description: "A test goal",
    targetAmount: "10000000",
    raisedAmount: "0",
    supporters: 0,
    startDate: Date.now(),
    endDate: Date.now() + 86400000,
    active: true,
    completed: false,
    ...overrides,
  };
}

describe("goalStore", () => {
  beforeEach(() => {
    useGoalStore.setState({ goals: [] });
  });

  it("setGoal adds a new goal", () => {
    const goal = makeGoal();
    useGoalStore.getState().setGoal(goal);
    expect(useGoalStore.getState().goals).toHaveLength(1);
    expect(useGoalStore.getState().goals[0].title).toBe("Test Goal");
  });

  it("setGoal updates existing goal for same creator", () => {
    useGoalStore.getState().setGoal(makeGoal({ title: "Original" }));
    useGoalStore.getState().setGoal(makeGoal({ title: "Updated" }));
    expect(useGoalStore.getState().goals).toHaveLength(1);
    expect(useGoalStore.getState().goals[0].title).toBe("Updated");
  });

  it("setGoal retains separate goals for different creators", () => {
    useGoalStore.getState().setGoal(makeGoal({ creator: "GA", title: "A" }));
    useGoalStore.getState().setGoal(makeGoal({ creator: "GB", title: "B" }));
    expect(useGoalStore.getState().goals).toHaveLength(2);
  });

  it("updateGoalProgress updates raisedAmount and supporters", () => {
    useGoalStore.getState().setGoal(makeGoal());
    useGoalStore.getState().updateGoalProgress("GABC123", "5000000", 3);
    const g = useGoalStore.getState().goals[0];
    expect(g.raisedAmount).toBe("5000000");
    expect(g.supporters).toBe(3);
  });

  it("updateGoalProgress ignores inactive goals", () => {
    useGoalStore.getState().setGoal(makeGoal({ active: false }));
    useGoalStore.getState().updateGoalProgress("GABC123", "5000000", 3);
    expect(useGoalStore.getState().goals[0].raisedAmount).toBe("0");
  });

  it("getCreatorGoal returns active goal for address", () => {
    useGoalStore.getState().setGoal(makeGoal());
    const g = useGoalStore.getState().getCreatorGoal("GABC123");
    expect(g).toBeDefined();
    expect(g!.title).toBe("Test Goal");
  });

  it("getCreatorGoal returns undefined for unknown address", () => {
    const g = useGoalStore.getState().getCreatorGoal("UNKNOWN");
    expect(g).toBeUndefined();
  });

  it("removeGoal removes goal by creator address", () => {
    useGoalStore.getState().setGoal(makeGoal());
    useGoalStore.getState().removeGoal("GABC123");
    expect(useGoalStore.getState().goals).toHaveLength(0);
  });
});
