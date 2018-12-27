const path = require('path')
const getFiles = require('../lib/getFiles')

const init = async () => {
  let dirPath = path.resolve(__dirname, './img')
  let filePath = path.resolve(__dirname, './img/timg.png')
  console.log(await getFiles(dirPath))
  console.log(await getFiles(filePath))
}

init()