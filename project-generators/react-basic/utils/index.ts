import * as fs from 'fs'
import rimraf from 'rimraf'

interface FileInfo {
  filename: string
  dirPath: string
}
export const listDir = (dirPath: string): Promise<FileInfo[]> =>
  new Promise((resolve, reject) => {
    fs.readdir(dirPath, async (err, files) => {
      if (err) {
        reject(err)
      }
      resolve(
        files.map((file) => ({
          dirPath,
          filename: file,
        }))
      )
    })
  })

export const lstat = (path): Promise<any> =>
  new Promise((resolve, reject) => {
    fs.lstat(path, (err, stats) => {
      if (err) {
        reject(err)
      }
      resolve(stats)
    })
  })

export const copyFile = async (inputPath, outputPath) => {
  const rd = fs.createReadStream(inputPath)
  const wr = fs.createWriteStream(outputPath)
  try {
    return await new Promise((resolve, reject) => {
      rd.on('error', reject)
      wr.on('error', reject)
      wr.on('finish', resolve)
      rd.pipe(wr)
    })
  } catch (error) {
    rd.destroy()
    wr.end()
    throw error
  }
}

export const copyDirRec = async (sourcePath: string, targetPath: string) => {
  const filesToCopy = await listDir(sourcePath)
  await mkdir(targetPath)
  while (filesToCopy.length) {
    const fileOrDir = filesToCopy.pop() as FileInfo
    const stats = await lstat(`${fileOrDir.dirPath}/${fileOrDir.filename}`)
    if (stats.isDirectory()) {
      const newFiles = await listDir(`${fileOrDir.dirPath}/${fileOrDir.filename}`)
      filesToCopy.push(...newFiles)

      await mkdir(
        `${targetPath}${fileOrDir.dirPath.replace(sourcePath, '')}/${fileOrDir.filename}`
      )
    } else {
      fs.copyFileSync(
        `${fileOrDir.dirPath}/${fileOrDir.filename}`,
        `${targetPath}/${fileOrDir.dirPath.replace(sourcePath, '')}/${fileOrDir.filename}`
      )
    }
  }

  listDir(sourcePath)
}

export const removeDir = (pathToRemove) =>
  new Promise((resolve, reject) => {
    rimraf(pathToRemove, (err) => {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })

export const writeTextFile = (
  pathToFile: string,
  fileName: string,
  fileContent: string
) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${pathToFile}/${fileName}`, fileContent, 'utf8', (err) => {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })
}

export const mkdir = (pathToDir) =>
  new Promise((resolve, reject) => {
    fs.mkdir(pathToDir, (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })

export const readFile = (pathToFile, encoding = 'utf8'): Promise<string> =>
  new Promise((resolve, reject) => {
    fs.readFile(pathToFile, encoding, (err, file) => {
      if (err) {
        reject(err)
      }
      resolve(file)
    })
  })

export const readJSON = async (pathToFile) => {
  const file = await readFile(pathToFile)
  try {
    const jsonFile = JSON.parse(file)
    return jsonFile
  } catch (err) {
    return null
  }
}

export const tsEnumToArray = (enumeration: any) =>
  Object.keys(enumeration).filter((v) => isNaN(Number(v)))
