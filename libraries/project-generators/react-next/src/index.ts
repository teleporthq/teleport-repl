import path from 'path'
import { removeDir, copyDirRec, readJSON, writeFolder } from '../../utils/path-utils'

import projectJson from '../../../../inputs/project.json'

import createNextProject from './generator'
import { ProjectGeneratorFunction } from '../../types'
import { ProjectUIDL } from '../../../uidl-definitions/types'

const writeToDisk = async (
  projectUIDL: ProjectUIDL,
  generatorFunction: ProjectGeneratorFunction,
  templatePath: string = 'project-boilerplate',
  distPath: string = 'dist'
) => {
  await removeDir(distPath)
  await copyDirRec(templatePath, distPath)
  const packageJsonTemplate = path.join(templatePath, 'package.json')
  const packageJson = await readJSON(packageJsonTemplate)
  if (!packageJson) {
    throw new Error('could not find a package.json in the template folder')
  }

  const distFolder = await generatorFunction(projectUIDL, {
    sourcePackageJson: packageJson,
    distPath,
  })
  await writeFolder(distFolder)
}

// const runInMemory = async (
//   projectUIDL: ProjectUIDL,
//   generatorFunction: ProjectGeneratorFunction
// ) => {
//   const result = await generatorFunction(projectUIDL)
//   console.log(JSON.stringify(result, null, 2))
// }

writeToDisk(projectJson, createNextProject, 'project-boilerplate')
// runInMemory(projectJson, createNuxtProject)
