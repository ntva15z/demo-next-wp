import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Feature: wordpress-ecommerce-cms, Property 7: Order status workflow validity**
 * **Validates: Requirements 7.3**
 *
 * For any order status transition, the new status SHALL be a valid transition
 * from the current status according to WooCommerce workflow
 * (e.g., cannot go from COMPLETED to PENDING).
 */
describe("Property: Order status workflow validity", () => {
  // ============================================
  // Types for order status workflow
  // ============================================

  type OrderStatus =
    | "pending"
    | "processing"
    | "shipped"
    | "on-hold"
    | "completed"
    | "cancelled"
    | "refunded"
    | "failed";

  interface StatusTransition {
    from: OrderStatus;
    to: OrderStatus;
  }

  interface TransitionValidationResult {
    valid: boolean;
    reason: string;
  }

  // ============================================
  // Order status workflow logic
  // ============================================

  /**
   * Define valid order status transitions.
   * This mirrors the logic in order-management.php headless_get_extended_valid_transitions()
   */
  const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ["processing", "on-hold", "cancelled", "failed"],
    processing: ["shipped", "completed", "on-hold", "cancelled", "refunded"],
    shipped: ["completed", "refunded"],
    "on-hold": ["processing", "pending", "cancelled", "failed"],
    completed: ["refunded"],
    cancelled: ["pending", "processing"],
    refunded: [],
    failed: ["pending", "processing", "cancelled"],
  };

  /**
   * All possible order statuses
   */
  const ALL_STATUSES: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "on-hold",
    "completed",
    "cancelled",
    "refunded",
    "failed",
  ];

  /**
   * Check if a status transition is valid.
   * This mirrors the logic in order-management.php headless_is_valid_status_transition()
   */
  function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTargets = VALID_TRANSITIONS[from];
    return validTargets.includes(to);
  }

  /**
   * Validate a status transition with detailed result
   */
  function validateStatusTransition(
    transition: StatusTransition
  ): TransitionValidationResult {
    const { from, to } = transition;

    // Same status is not a transition
    if (from === to) {
      return {
        valid: false,
        reason: "Status unchanged - not a valid transition",
      };
    }

    const isValid = isValidStatusTransition(from, to);

    if (isValid) {
      return {
        valid: true,
        reason: `Transition from ${from} to ${to} is allowed`,
      };
    }

    return {
      valid: false,
      reason: `Cannot transition from ${from} to ${to}`,
    };
  }

  /**
   * Get all valid transitions from a given status
   */
  function getValidTransitionsFrom(status: OrderStatus): OrderStatus[] {
    return VALID_TRANSITIONS[status];
  }

  /**
   * Get all statuses that can transition to a given status
   */
  function getValidTransitionsTo(targetStatus: OrderStatus): OrderStatus[] {
    return ALL_STATUSES.filter((status) =>
      VALID_TRANSITIONS[status].includes(targetStatus)
    );
  }

  /**
   * Check if a status is a terminal status (no outgoing transitions)
   */
  function isTerminalStatus(status: OrderStatus): boolean {
    return VALID_TRANSITIONS[status].length === 0;
  }

  /**
   * Simulate order workflow - apply a sequence of transitions
   */
  function applyTransitions(
    initialStatus: OrderStatus,
    transitions: OrderStatus[]
  ): { finalStatus: OrderStatus; invalidTransitions: StatusTransition[] } {
    let currentStatus = initialStatus;
    const invalidTransitions: StatusTransition[] = [];

    for (const nextStatus of transitions) {
      if (!isValidStatusTransition(currentStatus, nextStatus)) {
        invalidTransitions.push({ from: currentStatus, to: nextStatus });
      } else {
        currentStatus = nextStatus;
      }
    }

    return { finalStatus: currentStatus, invalidTransitions };
  }

  // ============================================
  // Arbitraries
  // ============================================

  // Order status arbitrary
  const orderStatusArb: fc.Arbitrary<OrderStatus> = fc.constantFrom(...ALL_STATUSES);

  // Status transition arbitrary
  const statusTransitionArb: fc.Arbitrary<StatusTransition> = fc.record({
    from: orderStatusArb,
    to: orderStatusArb,
  });

  // Valid transition arbitrary - generates only valid transitions
  const validTransitionArb: fc.Arbitrary<StatusTransition> = orderStatusArb
    .filter((status) => VALID_TRANSITIONS[status].length > 0)
    .chain((from) =>
      fc.constantFrom(...VALID_TRANSITIONS[from]).map((to) => ({ from, to }))
    );

  // Invalid transition arbitrary - generates only invalid transitions
  const invalidTransitionArb: fc.Arbitrary<StatusTransition> = orderStatusArb.chain(
    (from) => {
      const invalidTargets = ALL_STATUSES.filter(
        (status) => status !== from && !VALID_TRANSITIONS[from].includes(status)
      );
      if (invalidTargets.length === 0) {
        // If all transitions are valid, return same status (which is invalid)
        return fc.constant({ from, to: from });
      }
      return fc.constantFrom(...invalidTargets).map((to) => ({ from, to }));
    }
  );

  // Sequence of valid transitions starting from pending
  const validWorkflowArb: fc.Arbitrary<OrderStatus[]> = fc
    .integer({ min: 1, max: 5 })
    .chain((length) => {
      const buildWorkflow = (
        current: OrderStatus,
        remaining: number
      ): fc.Arbitrary<OrderStatus[]> => {
        if (remaining === 0 || VALID_TRANSITIONS[current].length === 0) {
          return fc.constant([]);
        }
        return fc.constantFrom(...VALID_TRANSITIONS[current]).chain((next) =>
          buildWorkflow(next, remaining - 1).map((rest) => [next, ...rest])
        );
      };
      return buildWorkflow("pending", length);
    });

  // ============================================
  // Property Tests
  // ============================================

  it("should accept all defined valid transitions", () => {
    fc.assert(
      fc.property(validTransitionArb, (transition) => {
        const result = validateStatusTransition(transition);

        expect(result.valid).toBe(true);
        return result.valid === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject all invalid transitions", () => {
    fc.assert(
      fc.property(invalidTransitionArb, (transition) => {
        const result = validateStatusTransition(transition);

        expect(result.valid).toBe(false);
        return result.valid === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should not allow transition to same status", () => {
    fc.assert(
      fc.property(orderStatusArb, (status) => {
        const transition: StatusTransition = { from: status, to: status };
        const result = validateStatusTransition(transition);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain("unchanged");
        return result.valid === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should not allow transition from completed to pending", () => {
    const transition: StatusTransition = { from: "completed", to: "pending" };
    const result = validateStatusTransition(transition);

    expect(result.valid).toBe(false);
    expect(isValidStatusTransition("completed", "pending")).toBe(false);
  });

  it("should not allow transition from completed to processing", () => {
    const transition: StatusTransition = { from: "completed", to: "processing" };
    const result = validateStatusTransition(transition);

    expect(result.valid).toBe(false);
    expect(isValidStatusTransition("completed", "processing")).toBe(false);
  });

  it("should only allow refund from completed status", () => {
    const result = validateStatusTransition({ from: "completed", to: "refunded" });
    expect(result.valid).toBe(true);

    // Verify completed can only go to refunded
    const validFromCompleted = getValidTransitionsFrom("completed");
    expect(validFromCompleted).toEqual(["refunded"]);
  });

  it("should treat refunded as terminal status", () => {
    expect(isTerminalStatus("refunded")).toBe(true);

    // Verify no transitions from refunded
    const validFromRefunded = getValidTransitionsFrom("refunded");
    expect(validFromRefunded).toHaveLength(0);

    // Any transition from refunded should be invalid
    fc.assert(
      fc.property(orderStatusArb, (targetStatus) => {
        if (targetStatus === "refunded") return true; // Skip same status

        const result = validateStatusTransition({
          from: "refunded",
          to: targetStatus,
        });
        expect(result.valid).toBe(false);
        return result.valid === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should allow standard workflow: pending -> processing -> shipped -> completed", () => {
    const workflow: StatusTransition[] = [
      { from: "pending", to: "processing" },
      { from: "processing", to: "shipped" },
      { from: "shipped", to: "completed" },
    ];

    for (const transition of workflow) {
      const result = validateStatusTransition(transition);
      expect(result.valid).toBe(true);
    }
  });

  it("should allow cancellation from pending, processing, or on-hold", () => {
    const cancellableStatuses: OrderStatus[] = ["pending", "processing", "on-hold"];

    for (const status of cancellableStatuses) {
      const result = validateStatusTransition({ from: status, to: "cancelled" });
      expect(result.valid).toBe(true);
    }
  });

  it("should not allow cancellation from completed or refunded", () => {
    const nonCancellableStatuses: OrderStatus[] = ["completed", "refunded"];

    for (const status of nonCancellableStatuses) {
      const result = validateStatusTransition({ from: status, to: "cancelled" });
      expect(result.valid).toBe(false);
    }
  });

  it("should allow reactivation of cancelled orders", () => {
    // Cancelled orders can go back to pending or processing
    expect(isValidStatusTransition("cancelled", "pending")).toBe(true);
    expect(isValidStatusTransition("cancelled", "processing")).toBe(true);
  });

  it("should allow failed orders to be retried", () => {
    // Failed orders can go back to pending, processing, or be cancelled
    expect(isValidStatusTransition("failed", "pending")).toBe(true);
    expect(isValidStatusTransition("failed", "processing")).toBe(true);
    expect(isValidStatusTransition("failed", "cancelled")).toBe(true);
  });

  it("should validate complete workflow sequences", () => {
    fc.assert(
      fc.property(validWorkflowArb, (workflow) => {
        const result = applyTransitions("pending", workflow);

        // All transitions in a valid workflow should succeed
        expect(result.invalidTransitions).toHaveLength(0);
        return result.invalidTransitions.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should detect invalid transitions in mixed workflow", () => {
    fc.assert(
      fc.property(
        orderStatusArb,
        fc.array(orderStatusArb, { minLength: 1, maxLength: 5 }),
        (initialStatus, transitions) => {
          const result = applyTransitions(initialStatus, transitions);

          // Verify each invalid transition is actually invalid
          for (const invalid of result.invalidTransitions) {
            expect(isValidStatusTransition(invalid.from, invalid.to)).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should ensure every non-terminal status has at least one valid transition", () => {
    fc.assert(
      fc.property(orderStatusArb, (status) => {
        const validTransitions = getValidTransitionsFrom(status);

        // Either it's a terminal status or has valid transitions
        const isTerminal = isTerminalStatus(status);
        const hasTransitions = validTransitions.length > 0;

        expect(isTerminal || hasTransitions).toBe(true);
        return isTerminal || hasTransitions;
      }),
      { numRuns: 100 }
    );
  });

  it("should ensure processing can transition to shipped (custom status)", () => {
    const result = validateStatusTransition({
      from: "processing",
      to: "shipped",
    });

    expect(result.valid).toBe(true);
    expect(isValidStatusTransition("processing", "shipped")).toBe(true);
  });

  it("should ensure shipped can only go to completed or refunded", () => {
    const validFromShipped = getValidTransitionsFrom("shipped");

    expect(validFromShipped).toContain("completed");
    expect(validFromShipped).toContain("refunded");
    expect(validFromShipped).toHaveLength(2);
  });

  it("should validate transition symmetry for reversible statuses", () => {
    // on-hold <-> processing should be bidirectional
    expect(isValidStatusTransition("on-hold", "processing")).toBe(true);
    expect(isValidStatusTransition("processing", "on-hold")).toBe(true);

    // cancelled <-> pending should be bidirectional
    expect(isValidStatusTransition("cancelled", "pending")).toBe(true);
    expect(isValidStatusTransition("pending", "cancelled")).toBe(true);
  });
});
