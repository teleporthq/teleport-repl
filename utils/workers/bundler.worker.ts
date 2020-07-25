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
import replace from '@rollup/plugin-replace'
import { GeneratedFile } from '@teleporthq/teleport-types'
import { expose } from 'comlink'

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

const elm = document.getElementById("output");
ReactDOM.render(<PreviewWindow />, document.getElementById("output"));
`

const minify = async (esmComponent: string) => {
  const minifiedCode = transform(esmComponent, {
    presets: [[babelPresetENV, { modules: false }], babelPresetReact],
  })
  return minifiedCode
}

const bundle = async (jsFile: GeneratedFile) => {
  if (!jsFile) {
    throw new Error('Failed in generating component')
  }
  try {
    const { content: component } = jsFile
    const MINIFIED_INDEX = minify(INDEX_ENTRY)
    const MINIFIED_PREVIEW = minify(component)
    const compiler = await rollup({
      input: 'src/entry.js',
      external: ['react', 'react-dom', 'prop-types', 'styled-components'],
      plugins: [
        virtual({
          'src/entry.js': MINIFIED_INDEX,
          'src/preview.js': MINIFIED_PREVIEW,
        }),
        replace({
          react: 'https://cdn.skypack.dev/react',
          'react-dom': 'https://cdn.skypack.dev/react-dom',
          'prop-types': 'https://cdn.skypack.dev/prop-types',
          'styled-components': 'https://cdn.skypack.dev/styled-components',
        }),
      ],
    })

    const output = await compiler.generate({
      format: 'esm',
      name: 'bundled',
      sourcemap: true,
    })

    return output.output[0]?.code
  } catch (e) {
    // @ts-ignore
    console.error(e)
  }
}

const exports = {
  bundle,
  minify,
}

export type BundlerTypes = typeof exports

expose(exports)
