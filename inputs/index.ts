export const exmaplesList = [`test`, `test2`, `blog-auto-scale-image`, `centered-image`]

export const loadJSONAsync = async (name: string) => {
  const content = await import(`./${name}`)
  return content.default
}
