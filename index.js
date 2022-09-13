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
    console.log('nodeType:', item.nodeType);

    if (item.nodeType === 'vocabulary') {
      const termNode = await getNode(item.id, 'term');

      let terms = [];

      vocabulary.push({
        ...item,
        terms
      });

      console.log('termNode length:', termNode.list.length)
      for (const termItem of termNode.list) {
        terms.push(termItem);
      }
    } else {
      const node = await getNode(item.id);
      console.log('node.list.length', node.list.length);

      let children = [];

      vocabulary.push({
        ...item,
        children
      });

      await populateVocabulary(node.list, children);
    }
  }
};

async function main () {
  const rootNode = await getNode(baseId);

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
