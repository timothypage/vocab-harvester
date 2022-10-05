const fs = require('node:fs')

const axios = require('axios').default
const uuid = require('uuid')

const baseUrl = 'https://www.sciencebase.gov/vocab/categories'
const baseId = '4f4e475ee4b07f02db47df09'
const UUID_V5_NAMESPACE = uuid.v5(baseUrl, uuid.v5.URL)

const sleep = ms => new Promise(r => setTimeout(r, ms))

const getNode = async (parentId, nodeType) => {
  let params = {
    parentId,
    nodeType,
    max: 10,
    offset: 0,
    format: 'json'
  }

  // TODO handle pagination
  const response = await axios
    .get(`${baseUrl}/get`, { params })
    .then(response => response.data)

  const fetched = response.list.length
  const total = response.total
  let list = response.list

  console.log('total', total)
  console.log('list.length', list.length)

  while (list.length < total) {
    await sleep(1000)

    params.offset += 10

    console.log('fetching next page')
    const nextResponse = await axios
      .get(`${baseUrl}/get`, { params })
      .then(response => response.data)

    list = list.concat(nextResponse.list)
    console.log('total', total)
    console.log('list.length', list.length)
  }

  return { list }
}

const populateVocabulary = async (list, vocabulary, parentUuid) => {
  for (const item of list) {
    await sleep(1000)
    console.log()
    console.log('populating:')
    console.log('id:', item.id)
    console.log('name:', item.name)
    console.log('nodeType:', item.nodeType)

    const itemUuid = uuid.v5(item.id, UUID_V5_NAMESPACE)

    if (item.nodeType === 'vocabulary') {
      let terms = []

      vocabulary.push({
        uuid: itemUuid,
        broader: parentUuid,
        label: item.name,
        definition: item.description || '',
        children: terms
      })

      const termNode = await getNode(item.id, 'term')
      console.log('termNode length:', termNode.list.length)

      for (const termItem of termNode.list) {
        terms.push({
          uuid: uuid.v5(termItem.id, UUID_V5_NAMESPACE),
          broader: itemUuid,
          label: termItem.name,
          definition: termItem.description
        })
      }
    } else {
      const node = await getNode(item.id)
      console.log('node.list.length', node.list.length)

      let children = []

      vocabulary.push({
        uuid: itemUuid,
        broader: parentUuid,
        label: item.name,
        definition: item.description || '',
        children
      })

      await populateVocabulary(node.list, children, itemUuid)
    }
  }
}

async function main () {
  const rootNode = await getNode(baseId)

  let vocabulary = []
  const rootUuid = uuid.v5(baseId, UUID_V5_NAMESPACE)
  await populateVocabulary(rootNode.list, vocabulary, rootUuid)

  fs.writeFileSync('./vocabulary.json', JSON.stringify(vocabulary, null, 2))
}

main()
  .then(() => process.exit())
  .catch(e => {
    console.log(e)
    process.exit(1)
  })
