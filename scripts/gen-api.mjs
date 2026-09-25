// Generates lib/api/schema.d.ts from the backend's OpenAPI spec.
// Source: OPENAPI_SOURCE (file path or URL), defaulting to the sibling backend repo.
// In ../backend, run `npm run openapi` first to write openapi.json.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const source = process.env.OPENAPI_SOURCE || '../backend/openapi.json';
if (!/^https?:\/\//.test(source) && !existsSync(source)) {
  console.error(
    `OpenAPI spec not found at ${source}. Run "npm run openapi" in the backend repo, or set OPENAPI_SOURCE.`,
  );
  process.exit(1);
}

execFileSync(process.execPath, ['node_modules/openapi-typescript/bin/cli.js', source, '-o', 'lib/api/schema.d.ts'], {
  stdio: 'inherit',
});
