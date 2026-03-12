import { validateProspect, getDeadlineUrgency } from "../prospect-helpers";

describe("prospect creation validation", () => {
  test("rejects a blank company name", () => {
    const result = validateProspect({
      companyName: "",
      roleTitle: "Software Engineer",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Company name is required");
  });

  test("rejects a blank role title", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role title is required");
  });
});

describe("target salary validation", () => {
  test("accepts a valid whole number salary", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
      targetSalary: 120000,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rounds a decimal salary to a whole number (no validation error)", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
      targetSalary: 120000.75,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects a negative salary", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
      targetSalary: -5000,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Salary must be a positive number");
  });

  test("salary field is optional — omitting it is valid", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("salary of zero is treated as no salary (valid, not an error)", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
      targetSalary: 0,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("empty string salary is treated as no salary (valid)", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
      targetSalary: "",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("null salary is treated as no salary (valid)", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
      targetSalary: null,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("application deadline classification", () => {
  // Use a fixed reference date so tests are always deterministic.
  // Reference: March 12, 2026 (Wednesday)
  const TODAY = new Date(2026, 2, 12);

  test("deadline field is optional — job can be created without it", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("deadline within 3 days is classified as urgent", () => {
    // March 14 = 2 days away → urgent
    expect(getDeadlineUrgency("2026-03-14", TODAY)).toBe("urgent");
  });

  test("deadline on the same day is classified as urgent", () => {
    // March 12 = 0 days away → urgent
    expect(getDeadlineUrgency("2026-03-12", TODAY)).toBe("urgent");
  });

  test("deadline exactly 3 days away is classified as urgent", () => {
    expect(getDeadlineUrgency("2026-03-15", TODAY)).toBe("urgent");
  });

  test("deadline within 4–7 days is classified as soon", () => {
    // March 17 = 5 days away → soon
    expect(getDeadlineUrgency("2026-03-17", TODAY)).toBe("soon");
  });

  test("deadline exactly 7 days away is classified as soon", () => {
    expect(getDeadlineUrgency("2026-03-19", TODAY)).toBe("soon");
  });

  test("deadline beyond 7 days is classified as fine", () => {
    // March 25 = 13 days away → fine
    expect(getDeadlineUrgency("2026-03-25", TODAY)).toBe("fine");
  });

  test("past deadline is classified as overdue", () => {
    // March 11 = 1 day ago → overdue
    expect(getDeadlineUrgency("2026-03-11", TODAY)).toBe("overdue");
  });
});
