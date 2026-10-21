/**
 * Zero-dependency TypeScript runner.
 *
 * Registers a require hook that transpiles .ts files on the fly with the
 * already-installed `typescript` package, so we can execute the project's
 * real source modules straight from Node without a build step.
 *
 *   node scripts/run-ts.js scripts/demo.ts
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020,
  esModuleInterop: true,
  resolveJsonModule: true,
  skipLibCheck: true,
};

require.extensions['.ts'] = function (module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions,
    fileName: filename,
    reportDiagnostics: true,
  });
  if (diagnostics && diagnostics.length) {
    const msg = diagnostics
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      .join('\n');
    console.error(`[run-ts] transpile warning in ${filename}:\n${msg}`);
  }
  module._compile(outputText, filename);
};

const entry = path.resolve(process.argv[2]);
if (!fs.existsSync(entry)) {
  console.error(`[run-ts] entry not found: ${entry}`);
  process.exit(1);
}
require(entry);
