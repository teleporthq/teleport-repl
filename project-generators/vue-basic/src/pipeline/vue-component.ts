import ComponentAsemblyLine from '../../../../utils/experimental-generators/pipeline/asembly-line'

import { createPlugin as vueBaseComponent } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-base-component'
import { createPlugin as vueStyleComponent } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-style-chunk'
import { createPlugin as vueImportStatements } from '../../../../utils/experimental-generators/pipeline/plugins/vue/vue-import-statements'

import Builder from '../../../../utils/experimental-generators/pipeline/builder'

const vueProjectMappings = {
  NavLink: {
    name: 'router-link',
    attrs: {
      to: '$attrs.transitionTo',
    },
  },
}

interface GeneratorOptions {
  localDependenciesPrefix?: string
  customMappings?: any
}

const createVuePipeline = (customMappings?: any) => {
  const assemblyLine = new ComponentAsemblyLine(
    'vue',
    [
      vueBaseComponent({
        jsFileId: 'vuejs',
        htmlFileId: 'vuehtml',
      }),
      vueStyleComponent({
        styleFileId: 'vuecss',
      }),
      vueImportStatements(),
    ],
    vueProjectMappings
  )

  const chunksLinker = new Builder()

  const componentGenerator = async (
    componentUIDL: any,
    generatorOptions: GeneratorOptions = {}
  ) => {
    const result = await assemblyLine.run(componentUIDL, {
      customMappings,
      ...generatorOptions,
    })

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

  return componentGenerator
}

export default createVuePipeline
