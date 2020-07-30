import { rollup } from 'rollup'
// @ts-ignore
import virtual from '@rollup/plugin-virtual'
// @ts-ignore
import { transform } from '@babel/standalone'
// @ts-ignore
import babelPresetENV from '@babel/preset-env'
// @ts-ignore
import babelPresetReact from '@babel/preset-react'
// @ts-ignore
import replaceImport from 'rollup-plugin-esm-import-to-url'
import { GeneratedFile } from '@teleporthq/teleport-types'
import { expose } from 'comlink'
import { init, parse, ImportSpecifier } from 'es-module-lexer'

class CacheService {
  cache: Record<string, unknown> = {}

  setCache(key: string, value: unknown) {
    this.cache = {
      ...this.cache,
      [key]: value,
    }
  }

  isCachedModule(key: string) {
    return Boolean(this.cache[key]) ?? false
  }

  getCache() {
    return this.cache
  }
}

const cache = new CacheService()

const INDEX_ENTRY = `import React from "react";
import ReactDOM from "react-dom";
import Component from "./preview.js";

function PreviewWindow(){
  return (
    <>
      <Component />
    </>
  );
};

ReactDOM.render(<PreviewWindow />, document.getElementById('output'));
`

const minify = async (esmComponent: string) => {
  const minifiedCode = transform(esmComponent, {
    presets: [[babelPresetENV, { modules: false }], babelPresetReact],
  })
  return minifiedCode
}

const parseImports = async (component: string) => {
  await init
  const [imports] = parse(component)
  const usedImports: string[] = ['react-dom']
  if (Array.isArray(imports) && imports.length > 0) {
    imports.forEach((key: ImportSpecifier) => {
      const usedPackage = component.substring(key.s, key.e)
      if (usedPackage.startsWith('.') || usedPackage.startsWith('/')) {
        throw new Error(
          `Relative imports are not supported, use only external library imports`
        )
      }
      usedImports.push(usedPackage)
    })
  }
  return usedImports
}

const checkModulesForCache = async (usedImports: string[]) => {
  for (const imp of usedImports) {
    if (!cache.isCachedModule(imp)) {
      const module = await import(`https://jspm.dev/${imp}`)
      cache.setCache(imp, module.dfault)
    }
  }
}

const bundle = async (jsFile: GeneratedFile) => {
  if (!jsFile || !jsFile?.content) {
    throw new Error('Failed in generating component')
  }
  const { content: component } = jsFile
  const MINIFIED_INDEX = await minify(INDEX_ENTRY)
  const MINIFIED_PREVIEW = await minify(component)
  const usedImports = await parseImports(MINIFIED_PREVIEW.code)
  checkModulesForCache(usedImports)

  const compiler = await rollup({
    input: 'src/entry.js',
    plugins: [
      virtual({
        'src/entry.js': MINIFIED_INDEX,
        'src/preview.js': MINIFIED_PREVIEW,
      }),
      replaceImport({
        imports: usedImports.reduce((acc, imp) => {
          acc = {
            ...acc,
            [imp]: `./${imp}`,
          }
          return acc
        }, {}),
      }),
    ],
  })

  const output = await compiler.generate({
    format: 'esm',
    name: 'bundled',
    sourcemap: true,
  })

  return output.output[0]?.code
}

const exports = {
  bundle,
  minify,
  parseImports,
}

export type BundlerTypes = typeof exports

expose(exports)
