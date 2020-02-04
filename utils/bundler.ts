import { rollup } from 'rollup'
// @ts-ignore
import virtual from '@rollup/plugin-virtual'
// @ts-ignore
import { transform } from '@babel/standalone'
// @ts-ignore
import babelPresetENV from '@babel/preset-env'
// @ts-ignore
import babelPresetReact from '@babel/preset-react'

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

export const minify = async (esmComponent: string) => {
  const minifiedCode = transform(esmComponent, {
    presets: [[babelPresetENV, { modules: false }], babelPresetReact],
  })
  return minifiedCode
}

const bundle = async (component: string) => {
  try {
    const MINIFIED_INDEX = minify(INDEX_ENTRY)
    const MINIFIED_PREVIEW = minify(component)
    const compiler = await rollup({
      input: 'src/entry.js',
      external: ['react', 'react-dom', 'prop-types'],
      plugins: [
        virtual({
          'src/entry.js': MINIFIED_INDEX,
          'src/preview.js': MINIFIED_PREVIEW,
        }),
      ],
    })

    const output = await compiler.generate({
      format: 'iife',
      globals: { react: 'React', 'react-dom': 'ReactDOM', 'prop-types': 'PropTypes' },
      name: 'bundled',
      sourcemap: true,
    })

    const bundledCode = output.output[0].code
    eval(bundledCode)
  } catch (e) {
    console.error('Bundling error')
    console.error(e)
  }
}

export default bundle
