import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
      for (const extension of ['.ts','.tsx','.mjs']) {
        const url = new URL(specifier+extension, context.parentURL);
        if (existsSync(url)) return next(url.href,context);
      }
    }
    return next(specifier,context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && /\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'), { compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX} }).outputText;
      return { format:'module',source,shortCircuit:true };
    }
    return next(url,context);
  },
});
