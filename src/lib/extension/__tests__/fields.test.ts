import { describe, expect, it } from "vitest";
import { classify, payHint, pickOption, splitName, valueFor } from "../fields";

describe("classify", () => {
  it("fills the facts an application form asks for", () => {
    expect(classify({ label: "First name *", name: "job_application[first_name]" })).toMatchObject({ kind: "first_name", action: "fill" });
    expect(classify({ label: "Last Name", id: "last_name" })).toMatchObject({ kind: "last_name", action: "fill" });
    expect(classify({ placeholder: "Full name", name: "name" })).toMatchObject({ kind: "full_name", action: "fill" });
    expect(classify({ label: "Email", type: "email" })).toMatchObject({ kind: "email", action: "fill" });
    expect(classify({ label: "Confirm email address", type: "text" })).toMatchObject({ kind: "email", action: "fill" });
    expect(classify({ label: "Phone", type: "tel" })).toMatchObject({ kind: "phone", action: "fill" });
    expect(classify({ label: "LinkedIn Profile", type: "url" })).toMatchObject({ kind: "linkedin", action: "fill" });
    expect(classify({ label: "Website", type: "url" })).toMatchObject({ kind: "website", action: "fill" });
    expect(classify({ label: "Location (City)" })).toMatchObject({ kind: "city", action: "fill" });
    expect(classify({ label: "Current company" })).toMatchObject({ kind: "current_company", action: "fill" });
    expect(classify({ label: "Country", type: "select" })).toMatchObject({ kind: "country", action: "fill" });
    expect(classify({ label: "Resume/CV", type: "file" })).toMatchObject({ kind: "resume", action: "fill" });
    expect(classify({ label: "Attach", type: "file", name: "resume" })).toMatchObject({ kind: "resume", action: "fill" });
    expect(classify({ label: "Cover letter", type: "textarea" })).toMatchObject({ kind: "cover_letter", action: "fill" });
    expect(classify({ label: "Cover Letter", type: "file" })).toMatchObject({ kind: "cover_letter", action: "fill" });
  });

  it("uses autocomplete tokens when a site sets them", () => {
    expect(classify({ autocomplete: "given-name", name: "x1" })).toMatchObject({ kind: "first_name" });
    expect(classify({ autocomplete: "section-contact address-level1", name: "x2" })).toMatchObject({ kind: "province" });
    expect(classify({ autocomplete: "organization-title", name: "x3" })).toMatchObject({ kind: "current_title" });
  });

  it("never pre-fills legal attestations and says why", () => {
    expect(classify({ label: "Are you legally authorized to work in Canada?", type: "radio" })).toMatchObject({ kind: "attestation", action: "flag", reason: "Work authorization" });
    expect(classify({ label: "Will you now or in the future require sponsorship?", type: "select" })).toMatchObject({ action: "flag", reason: "Sponsorship or immigration status" });
    expect(classify({ label: "Have you ever been convicted of a criminal offence?", type: "radio" })).toMatchObject({ action: "flag", reason: "Criminal record or background check" });
    expect(classify({ label: "Do you hold a valid Class G driver's licence?", type: "select" })).toMatchObject({ action: "flag", reason: "Licence or certification" });
    expect(classify({ label: "Are you at least 18 years of age?", type: "checkbox" })).toMatchObject({ action: "flag", reason: "Age or date of birth" });
    expect(classify({ label: "Date of birth", type: "date" })).toMatchObject({ action: "flag" });
    expect(classify({ label: "I certify that the information above is accurate and complete", type: "checkbox" })).toMatchObject({ action: "flag", reason: "Attestation" });
    expect(classify({ label: "Country of citizenship", type: "select" })).toMatchObject({ action: "flag", reason: "Citizenship or residency" });
  });

  it("flags voluntary self-identification without touching it", () => {
    expect(classify({ label: "Gender", type: "select" })).toMatchObject({ kind: "self_id", action: "flag" });
    expect(classify({ label: "Veteran status", type: "select" })).toMatchObject({ kind: "self_id", action: "flag" });
    expect(classify({ label: "Do you have a disability?", type: "radio" })).toMatchObject({ kind: "self_id", action: "flag" });
  });

  it("leaves the candidate's own choices empty", () => {
    expect(classify({ label: "How did you hear about this job?", type: "select" })).toMatchObject({ kind: "referral", action: "skip" });
    expect(classify({ label: "Earliest start date" })).toMatchObject({ kind: "start_date", action: "skip" });
    expect(classify({ label: "Pronouns", type: "select" })).toMatchObject({ kind: "pronouns", action: "skip" });
    expect(classify({ label: "Why do you want to work here?", type: "textarea" })).toMatchObject({ kind: "custom", action: "skip" });
    expect(classify({ label: "Can you lift 50 lbs?", type: "radio" })).toMatchObject({ action: "skip" });
    expect(classify({ label: "Portfolio (PDF)", type: "file" })).toMatchObject({ action: "skip" });
  });

  it("shows the pay report beside a salary ask instead of filling it", () => {
    expect(classify({ label: "Salary expectations" })).toMatchObject({ kind: "salary", action: "hint" });
    expect(classify({ label: "Desired hourly rate" })).toMatchObject({ kind: "salary", action: "hint" });
  });

  it("does not mistake ordinary facts for attestations", () => {
    expect(classify({ label: "Legal name" })).toMatchObject({ kind: "full_name", action: "fill" });
    expect(classify({ label: "State", type: "select" })).toMatchObject({ kind: "province", action: "fill" });
    expect(classify({ label: "Personal statement", type: "textarea" })).toMatchObject({ action: "skip" });
    expect(classify({ label: "Work email", type: "email" })).toMatchObject({ kind: "email", action: "fill" });
  });
});

describe("values", () => {
  const c = { fullName: "Maria Rodriguez", firstName: "Maria", lastName: "Rodriguez", email: "maria@example.com", country: "CA", countryNames: ["Canada", "CA"], coverLetter: "Dear team" };
  it("returns the fact for each kind", () => {
    expect(valueFor("first_name", c)).toBe("Maria");
    expect(valueFor("last_name", c)).toBe("Rodriguez");
    expect(valueFor("email", c)).toBe("maria@example.com");
    expect(valueFor("country", c)).toBe("Canada");
    expect(valueFor("province", { ...c, province: "ON", provinceNames: ["Ontario", "ON"] })).toBe("Ontario");
    expect(valueFor("province", { ...c, province: "ON" })).toBe("ON");
    expect(valueFor("cover_letter", c)).toBe("Dear team");
    expect(valueFor("salary", c)).toBeUndefined();
  });
  it("splits names so double surnames survive", () => {
    expect(splitName("Maria Rodriguez")).toEqual({ first: "Maria", last: "Rodriguez" });
    expect(splitName("Maria Lopez Garcia")).toEqual({ first: "Maria", last: "Lopez Garcia" });
    expect(splitName("Cher")).toEqual({ first: "Cher", last: "" });
    expect(splitName("  ")).toEqual({ first: "", last: "" });
  });
  it("picks select options by text or value, exact before partial", () => {
    const options = [
      { text: "Select...", value: "" },
      { text: "Canada", value: "CA" },
      { text: "United States of America", value: "US" },
    ];
    expect(pickOption(options, ["Canada"])).toBe(1);
    expect(pickOption(options, ["United States", "US"])).toBe(2);
    expect(pickOption(options, ["France"])).toBe(-1);
  });
  it("words the pay hint from the report", () => {
    expect(payHint({ low: 52000, median: 61000, high: 68000, currency: "cad" })).toBe("Pay report for this role: CAD 52,000 to 68,000, median 61,000. Your number to type.");
    expect(payHint({ currency: "usd" })).toBeUndefined();
  });
});
