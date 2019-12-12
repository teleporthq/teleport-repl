import { BASE_URL, BASE_REGISTRY } from './constants'

export const fetchJSONDataAndLoad = async (uidlLink: string) => {
  const result = await fetch(`${BASE_URL}fetch-uidl/${uidlLink}`)
  if (result.status !== 200) throw new Error(result.statusText)
  const jsonData = await result.json()
  return jsonData.uidl
}

export const uploadUIDLJSON = async (uidl: any) => {
  const response = await fetch(`${BASE_URL}upload-uidl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uidl,
    }),
  })
  return response.json()
}

export const generatePackage = async (uidl: any) => {
  const response = await fetch(`${BASE_REGISTRY}publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uidl,
    }),
  })
  return response.json()
}
