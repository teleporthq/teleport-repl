// tslint:disable:no-console

import path from 'path'

import projectJson from '../../inputs/project.json'

import { configureRouterAsemblyLine } from './pipeline/react-router-app'
import { configureAsemblyLine, ReactComponentFlavors } from './pipeline/react-component'

import { copyDirRec, removeDir, writeTextFile, mkdir, readJSON } from '../utils'

const componentGenerator = configureAsemblyLine({
  variation: ReactComponentFlavors.JSS,
})

const routingComponentGenerator = configureRouterAsemblyLine()

const processProjectUIDL = async (jsDoc: any) => {
  // pick root name/id

  const { components, root } = jsDoc
  const keys = Object.keys(components)

  const srcDir: any = []

  const componentsDir: any = []
  let allDependencies: Record<string, any> = {}

  // Handle the router first
  const routingComponent = await routingComponentGenerator(root)

  srcDir.push({
    type: 'file',
    name: `index.js`,
    content: {
      code: routingComponent.code,
    },
  })

  allDependencies = {
    ...allDependencies,
    ...routingComponent.dependencies,
  }

  // tslint:disable-next-line:forin
  for (const i in keys) {
    const key = keys[i]
    try {
      const compiledComponent = await componentGenerator(components[key])
      componentsDir.push({
        type: 'file',
        name: `${components[key].name}.js`,
        content: compiledComponent,
      })

      allDependencies = {
        ...allDependencies,
        ...compiledComponent.dependencies,
      }
    } catch (err) {
      console.error(key, err)
    }
  }

  return { fileTree: { srcDir, componentsDir }, allDependencies }
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

  const filesInSrc = fileTree.srcDir
  const srcFilesLength = filesInSrc.length

  let fileInfo

  for (let i = 0; i < srcFilesLength; i++) {
    fileInfo = filesInSrc[i]
    await writeTextFile(`${distPath}/src`, fileInfo.name, fileInfo.content.code)
  }

  const filesInComponents = fileTree.componentsDir
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

  const extraDeps = Object.keys(allDependencies)
    .filter((key) => {
      return allDependencies[key].type !== 'local'
    })
    .reduce((acc: any, key) => {
      const depInfo = allDependencies[key]
      acc[depInfo.meta.path] = depInfo.meta.version

      return acc
    }, {})

  const packageJSON = await readJSON(`${inputPath}/package.json`)
  if (!packageJSON) {
    throw new Error('could not reach package json')
  }

  packageJSON.dependencies = {
    ...packageJSON.dependencies,
    ...extraDeps,
  }

  writeTextFile(distPath, 'package.json', JSON.stringify(packageJSON, null, 2))
}

const boilerpaltePath = path.resolve(__dirname, './project-boilerplate')
const distGeneratorPath = path.resolve(__dirname, './dist')

run({
  uidlInput: projectJson,
  inputPath: boilerpaltePath,
  distPath: distGeneratorPath,
}).catch((err) => console.error(err))
