import { defineConfig } from "orval";

// Generates the API client and Zod schemas from the spec that the backend
// exports with `cargo loco task openapi_export` (openapi/openapi.yaml).
export default defineConfig({
  wardrowbe: {
    input: {
      target: "../openapi/openapi.yaml",
    },
    output: {
      mode: "tags-split",
      client: "fetch",
      target: "src/api/generated",
      schemas: { path: "src/api/generated/model", type: "zod" },
      clean: true,
      override: {
        // All requests go through the shared fetch wrapper (auth header, 401 handling).
        mutator: {
          path: "src/api/mutator.ts",
          name: "customFetch",
        },
        fetch: { runtimeValidation: true },
        includeZodSchemaInArguments: true,
      },
    },
  },
});
