const tiny = require('../lib/tiny')
const path = require('path')
let filePath = path.resolve(__dirname, './img/timg.png')
const promise = tiny(filePath)

promise
.then(res => {
  console.log(res)
})
.catch(err => {
  console.error(err)
})