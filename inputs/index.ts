export const exmaplesList = [`test`, `test2`]

export const loadJSONAsync = async (name: string) => {
  const content = await import(`./${name}`)
  return content.default
}
