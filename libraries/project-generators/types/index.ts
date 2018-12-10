export interface Folder {
  name: string
  files: File[]
  subFolders: Folder[]
}

export interface File {
  content: string
  name: string
  extension: string
}

export interface ProjectGeneratorOptions {
  sourcePackageJson?: Record<string, any>
  distPath?: string
}

export type ProjectUIDL = Record<string, any>

export type ProjectGeneratorFunction = (
  uidl: ProjectUIDL,
  options?: ProjectGeneratorOptions
) => Promise<Folder>
