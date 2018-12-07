import ComponentAsemblyLine from '../pipeline/asembly-line'

import { createPlugin as vueBaseComponent } from '../pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../pipeline/plugins/vue/vue-style-chunk'
import { createPlugin as vueImportStatements } from '../pipeline/plugins/vue/vue-import-statements'

import Builder from '../pipeline/builder'

const customMapping = {
  Datepicker: {
    name: 'Datepicker',
    attrs: {
      'data-attr': 'test',
    },
    dependency: {
      type: 'package',
      meta: {
        path: 'vuejs-datepicker',
        version: '1.5.4',
        namedImport: false,
      },
    },
  },
}

const asemblyLine = new ComponentAsemblyLine('vue', [
  vueBaseComponent({
    jsFileId: 'vuejs',
    htmlFileId: 'vuehtml',
  }),
  vueStyleComponent({
    styleFileId: 'vuecss',
  }),
  vueImportStatements(),
])

const generateComponent = async (jsDoc: any) => {
  const chunksLinker = new Builder()
  const result = await asemblyLine.run(jsDoc, { customMappings: customMapping })

  const jsChunks = result.chunks.filter((chunk) => chunk.meta.fileId === 'vuejs')
  const cssChunks = result.chunks.filter((chunk) => chunk.meta.fileId === 'vuecss')
  const htmlChunks = result.chunks.filter((chunk) => chunk.meta.fileId === 'vuehtml')

  const jsCode = chunksLinker.link(jsChunks)
  const cssCode = chunksLinker.link(cssChunks)
  const htmlCode = chunksLinker.link(htmlChunks)

  return {
    code: `
<template>

${htmlCode}
</template>

<script>

${jsCode}
</script>

<style>

${cssCode}

</style>
`,

    dependencies: result.dependencies,
  }
}

export { generateComponent }
