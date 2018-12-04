import path from 'path'

// tslint:disable:no-console
import componentWithStates from '../../inputs/component-states'

import ComponentAsemblyLine from '../../utils/experimental-generators/pipeline/asembly-line'

import Builder from '../../utils/experimental-generators/pipeline/builder'

import { createPlugin as importStatements } from '../../utils/experimental-generators/pipeline/plugins/common/import-statements'

import { createPlugin as appComponentPlugin } from './pipeline/react-router-app'
import { configureAsemlyLine, ReactComponentFlavors } from './pipeline/react-component'
import { copyDirRec, removeDir, writeTextFile, mkdir } from './utils'

const componentGenerator = configureAsemlyLine({
  variation: ReactComponentFlavors.JSS,
})

const configureRouterAsemblyLine = () => {
  const configureAppRouterComponent = appComponentPlugin({
    componentChunkName: 'app-router-component',
    domRenderChunkName: 'app-router-export',
    importChunkName: 'import',
  })

  const configureImportStatements = importStatements({
    importLibsChunkName: 'import',
  })

  const generateComponent = async (jsDoc: any) => {
    const asemblyLine = new ComponentAsemblyLine('react', [
      configureAppRouterComponent,
      configureImportStatements,
    ])

    const result = await asemblyLine.run(jsDoc)

    const chunksLinker = new Builder()

    return {
      code: chunksLinker.link(result.chunks),
      dependencies: result.dependencies,
    }
  }

  return generateComponent
}

const routingComponentGenerator = configureRouterAsemblyLine()

const processProjectUIDL = async (jsDoc: any) => {
  console.log('processing', jsDoc)

  // pick root name/id

  const { components, root } = jsDoc
  const keys = Object.keys(components)

  const srcDir: any = []

  const compoenntsDir: any = []
  let allDependencies = {}
  // tslint:disable-next-line:forin
  for (const i in keys) {
    const key = keys[i]
    if (components[key].name === root) {
      try {
        const compiledComponent = await routingComponentGenerator(components[key])
        console.log(compiledComponent.code)
        srcDir.push({
          type: 'file',
          name: `index.js`,
          content: {
            code: compiledComponent.code,
          },
        })

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }
      } catch (err) {
        console.error(key, err)
      }
    } else {
      try {
        const compiledComponent = await componentGenerator(components[key])
        compoenntsDir.push({
          type: 'file',
          name: `${components[key].name}.js`,
          content: compiledComponent,
        })

        console.log(compiledComponent)

        allDependencies = {
          ...allDependencies,
          ...compiledComponent.dependencies,
        }
      } catch (err) {
        console.error(key, err)
      }
    }
  }

  return { fileTree: { srcDir, compoenntsDir }, allDependencies }
}

interface GeneratorInputParams {
  inputPath: string
  distPath: string
  uidlInput: any
}
const run = async (params: GeneratorInputParams) => {
  const { inputPath, distPath, uidlInput } = params

  await removeDir(distPath)

  await copyDirRec(inputPath, distPath)

  const { fileTree, allDependencies } = await processProjectUIDL(uidlInput)

  console.log(allDependencies)

  const filesInSrc = fileTree.srcDir
  const srcFilesLength = filesInSrc.length

  let fileInfo

  for (let i = 0; i < srcFilesLength; i++) {
    fileInfo = filesInSrc[i]
    await writeTextFile(`${distPath}/src`, fileInfo.name, fileInfo.content.code)
  }

  const filesInComponents = fileTree.compoenntsDir
  const componentsFilesLength = filesInComponents.length

  await mkdir(`${distPath}/src/components`)

  for (let i = 0; i < componentsFilesLength; i++) {
    fileInfo = filesInComponents[i]
    await writeTextFile(
      `${distPath}/src/components`,
      fileInfo.name,
      fileInfo.content.code
    )
  }
}

const boilerpaltePath = path.resolve(__dirname, './project-boilerplate')
const distGeneratorPath = path.resolve(__dirname, './dist')

run({
  uidlInput: componentWithStates,
  inputPath: boilerpaltePath,
  distPath: distGeneratorPath,
}).catch((err) => console.error(err))
