import { describe, expect, it } from "vitest";
import { MESSIER_CATALOG, MessierObjectSchema } from "@/data/messier";
import { getSiteById, OBSERVATORY_SITES, SiteSchema } from "@/data/sites";

describe("Observatory sites catalog", () => {
  it("contains 10 valid Chilean observatory and base sites with unique IDs", () => {
    expect(OBSERVATORY_SITES).toHaveLength(10);

    const ids = new Set<string>();
    for (const site of OBSERVATORY_SITES) {
      expect(() => SiteSchema.parse(site)).not.toThrow();
      expect(site.latitude).toBeLessThan(0);
      expect(site.longitude).toBeLessThan(0);
      ids.add(site.id);
    }
    expect(ids.size).toBe(OBSERVATORY_SITES.length);
  });

  it("includes Vera C. Rubin, ELT, ALMA, La Silla, Tololo, Las Campanas, Paranal and La Serena", () => {
    const requiredIds = [
      "vera-rubin",
      "cerro-pachon",
      "cerro-tololo",
      "la-silla",
      "las-campanas",
      "paranal",
      "cerro-armazones",
      "alma",
      "ctao-south",
      "la-serena",
    ];
    for (const id of requiredIds) {
      expect(getSiteById(id)).toBeDefined();
    }
    expect(getSiteById("unknown-site")).toBeUndefined();
  });
});

describe("Messier catalog", () => {
  it("contains 20 valid Messier objects with unique IDs", () => {
    expect(MESSIER_CATALOG).toHaveLength(20);

    const ids = new Set<string>();
    for (const obj of MESSIER_CATALOG) {
      expect(() => MessierObjectSchema.parse(obj)).not.toThrow();
      ids.add(obj.id);
    }
    expect(ids.size).toBe(MESSIER_CATALOG.length);
  });
});
