import { describe, it, expect } from "vitest";
import enMessages from "./locales/en.json";
import itMessages from "./locales/it.json";

// Catalog parity: a key that exists in one language but not the other would
// ship an untranslated (or missing) string. This fails loudly if that happens.
describe("i18n catalogs", () => {
  it("English and Italian expose the same keys", () => {
    expect(Object.keys(enMessages).sort()).toEqual(Object.keys(itMessages).sort());
  });

  it("no empty values in either catalog", () => {
    for (const [key, value] of Object.entries<string>({ ...enMessages, ...itMessages })) {
      expect(value, `empty value for "${key}"`).toBeTruthy();
    }
  });
});
