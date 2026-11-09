import { describe, it, expect } from "vitest";
import { auditMenuItem, bucketByRisk } from "@/lib/ai/menu-auditor";

/**
 * Regression: the keyword auditor used to mark any dish with no matching keyword as "green",
 * overriding the model. Biryani, naan, rasmalai and mango lassi all came back "safe".
 */
describe("Menu auditor: Bangladeshi dishes and model-verdict safety", () => {
  it.each([
    "Kacchi Biryani",
    "Butter Naan",
    "Rasmalai",
    "Mishti Doi",
    "Mango Lassi",
    "Grilled Chicken with Fried Rice",
    "Beef Tehari",
    "Chicken Polao",
    "Porota with Egg",
    "Aloo Bhorta",
    "Jilapi",
    "Coca-Cola",
  ])("%s is red even when the model says green", (dish) => {
    const audited = auditMenuItem(dish, { dish_name: dish, risk_category: "green" });
    expect(audited.risk_category).toBe("red");
    expect(audited.flagged_traps.length).toBeGreaterThan(0);
  });

  it("never lowers the model's verdict when no keyword matches", () => {
    const audited = auditMenuItem("Chef's Special Platter", {
      dish_name: "Chef's Special Platter",
      risk_category: "red",
      clinical_rationale: "Large mixed platter with fried items.",
    });
    expect(audited.risk_category).toBe("red");
    expect(audited.clinical_rationale).toContain("platter");
  });

  it("treats an unknown dish with no model verdict as caution, not safe", () => {
    expect(auditMenuItem("Chef's Special Platter").risk_category).toBe("yellow");
  });

  it("still marks known-safe dishes green", () => {
    expect(auditMenuItem("Tandoori Grilled Fish with Steamed Broccoli").risk_category).toBe("green");
    expect(auditMenuItem("Mixed Vegetable Salad with Dal").risk_category).toBe("green");
  });

  it("matches whole words only (no 'rice' in 'price', no 'gur' in 'burger')", () => {
    const priced = auditMenuItem("Fixed price grilled fish", { risk_category: "green" });
    expect(priced.flagged_traps.some((t) => t.toLowerCase().includes("rice"))).toBe(false);
    expect(priced.risk_category).toBe("green");

    const burger = auditMenuItem("Chicken Burger");
    expect(burger.flagged_traps.some((t) => t.toLowerCase().includes("jaggery"))).toBe(false);
  });

  it("gives a starch-specific waiter script for rice dishes", () => {
    const audited = auditMenuItem("Kacchi Biryani");
    expect(audited.waiter_script.toLowerCase()).toContain("small portion of rice");
  });

  it("sorts dishes into lists by their audited risk", () => {
    const items = [
      auditMenuItem("Kacchi Biryani", { risk_category: "green" }),
      auditMenuItem("Tandoori Grilled Fish"),
      auditMenuItem("Chef's Special Platter"),
    ];
    const buckets = bucketByRisk(items);
    expect(buckets.risky_traps.map((i) => i.dish_name)).toEqual(["Kacchi Biryani"]);
    expect(buckets.safe_selections.map((i) => i.dish_name)).toEqual(["Tandoori Grilled Fish"]);
    expect(buckets.caution_items.map((i) => i.dish_name)).toEqual(["Chef's Special Platter"]);
  });
});
