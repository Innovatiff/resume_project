import { describe, expect, it } from "vitest";
import { checkoutCurrencyFor, countryFromLocale, detectCountry, formatCents, formatMoney, marketFor } from "../markets";

describe("detectCountry", () => {
  it("reads a Canadian province code after the city", () => {
    expect(detectCountry("Logistics Coordinator\nWindsor, ON · Full-time")).toBe("CA");
  });
  it("reads a US state and ZIP", () => {
    expect(detectCountry("Warehouse Lead\nDetroit, MI 48226\nMust be authorized to work in the United States")).toBe("US");
  });
  it("takes the earliest signal when a posting names both countries", () => {
    expect(detectCountry("Remote (Canada)\nCandidates in the United States are welcome to apply")).toBe("CA");
  });
  it("reads a UK postcode and a UK country word", () => {
    expect(detectCountry("Operations Analyst\nManchester M1 2AB")).toBe("GB");
    expect(detectCountry("Based in London, England")).toBe("GB");
  });
  it("reads Australian states", () => {
    expect(detectCountry("Sydney, NSW")).toBe("AU");
    expect(detectCountry("Melbourne, Victoria, Australia")).toBe("AU");
  });
  it("does not confuse Victoria, BC with Australia", () => {
    expect(detectCountry("Victoria, BC")).toBe("CA");
  });
  it("falls back to currency markers", () => {
    expect(detectCountry("Pay: £32,000 per year")).toBe("GB");
    expect(detectCountry("Salary USD 70,000")).toBe("US");
  });
  it("returns undefined when nothing identifies a country", () => {
    expect(detectCountry("Remote role. Salary competitive.")).toBeUndefined();
    expect(detectCountry("")).toBeUndefined();
  });
});

describe("countryFromLocale", () => {
  it("reads the region of the first Accept-Language tag", () => {
    expect(countryFromLocale("en-US,en;q=0.9")).toBe("US");
    expect(countryFromLocale("fr-CA")).toBe("CA");
    expect(countryFromLocale("en-GB")).toBe("GB");
  });
  it("maps an unsupported region to OTHER and no region to undefined", () => {
    expect(countryFromLocale("es-CO")).toBe("OTHER");
    expect(countryFromLocale("en")).toBeUndefined();
    expect(countryFromLocale(null)).toBeUndefined();
  });
});

describe("markets and money", () => {
  it("charges CAD in Canada and USD everywhere else", () => {
    expect(checkoutCurrencyFor("CA")).toBe("cad");
    expect(checkoutCurrencyFor("US")).toBe("usd");
    expect(checkoutCurrencyFor("GB")).toBe("usd");
    expect(checkoutCurrencyFor(undefined)).toBe("cad");
  });
  it("knows pay-data coverage and paper size per market", () => {
    expect(marketFor("US").adzuna).toBe("us");
    expect(marketFor("OTHER").adzuna).toBeUndefined();
    expect(marketFor("GB").paper).toBe("A4");
    expect(marketFor("nonsense").code).toBe("CA");
  });
  it("formats money with the right symbol", () => {
    expect(formatMoney(62000, "CAD")).toBe("$62,000");
    expect(formatMoney(62000, "USD")).toBe("$62,000");
    expect(formatMoney(40000, "GBP")).toBe("£40,000");
    expect(formatMoney(45000, "EUR")).toBe("€45,000");
    expect(formatCents(2900, "usd")).toBe("$29");
  });
});
