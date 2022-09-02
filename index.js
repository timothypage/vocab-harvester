const axios = require('axios').default;
const fs = require('node:fs');

const baseUrl = 'https://www.sciencebase.gov/vocab/categories';
const baseId = '4f4e475ee4b07f02db47df09';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getNode = (parentId, nodeType) => {
  const params = {
    parentId,
    nodeType,
    max: 10,
    offset: 0,
    format: 'json'
  }

  return axios
    .get(`${baseUrl}/get`, { params })
    .then(response => response.data);
}

const populateVocabulary = async (list, vocabulary) => {
  for (const item of list) {
    await sleep(1000);
    console.log();
    console.log('populating:');
    console.log('id:', item.id)
    console.log('name:', item.name);

    let terms = [];
    let children = [];
    let vocabulary = [];
    vocabulary.push({
      ...item,
      terms,
      vocabulary
    });

    const termNode = await getNode(item.id, 'term');
    console.log('termNode length:', termNode.list.length)
    for (const termItem of termNode.list) {
      terms.push(termItem);
    }

    if (item.nodeType !== 'term') {
      const node = await getNode(item.id);
      console.log('children length', node.list.length);

      for (const item of node.list) {
        children.push(item);
      }

      await populateVocabulary(children, vocabulary);
    }

  }
};

async function main () {
  const rootNode = await getNode(baseId);
  // console.log('rootNode', rootNode.list);

  let vocabulary = [];
  await populateVocabulary(rootNode.list, vocabulary);

  fs.writeFileSync('./vocabulary.json', JSON.stringify(vocabulary, null, 2));
}

main()
  .then(() => process.exit())
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
