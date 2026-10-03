import { describe, expect, it } from "vitest";

import { databaseNameFromUri } from "@/lib/env";

describe("databaseNameFromUri", () => {
  it("reads the database name from SRV and standard connection strings", () => {
    expect(
      databaseNameFromUri(
        "mongodb+srv://user:pass@cluster0.example.mongodb.net/harmoniser?retryWrites=true&w=majority",
      ),
    ).toBe("harmoniser");
    expect(databaseNameFromUri("mongodb://user:pass@localhost:27017/harmoniser")).toBe("harmoniser");
  });

  it("flags a path-less URI (MongoDB would silently use the default test database)", () => {
    expect(databaseNameFromUri("mongodb+srv://user:pass@cluster0.example.mongodb.net/?retryWrites=true")).toBe("");
    expect(databaseNameFromUri("mongodb://user:pass@localhost:27017")).toBe("");
  });

  it("returns null for values it cannot parse, so the driver reports the real problem", () => {
    expect(databaseNameFromUri("not a uri")).toBe(null);
  });
});
