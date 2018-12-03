import * as fs from 'fs'

export const listDir = (dirPath: string): Promise<string[]> => new Promise(
  (resolve, reject) => {

  fs.readdir((dirPath), async (err, files) => {
    if (err) {
      reject(err)
    }
    resolve(files.map(file=> `${dirPath}/${file}`))
  })
})

export const lstat = (path):Promise<any> => new Promise((resolve, reject) => {
  fs.lstat(path, (err, stats) => {
    if (err) {
      reject(err)
    }
    resolve(stats)
  })
})

export const copyDirRec = async (sourcePath: string, targetPath: string) => {

  const filesToCopy = await listDir(sourcePath)

  while (filesToCopy.length) {
    const fileOrDir = filesToCopy.pop() as string
    const stats = await lstat(fileOrDir)
    if ( stats.isDirectory() ) {
      const newFiles = await listDir(fileOrDir)
      filesToCopy.push(...newFiles)
      console.log('mkdir', fileOrDir)
    } else {
      console.log('copy', fileOrDir)
    }
  }

  
  listDir(sourcePath)
}