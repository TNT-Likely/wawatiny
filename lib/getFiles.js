
const path = require('path')
const fs = require('fs')
const { checkType } = require('./util')

const getFiles = async (dir, res = []) => {
  if (!checkType(dir, 'String')) {
    return []
  }

  if (path.extname(dir)) {
    return [dir]
  }

  var files = fs.readdirSync(dir)

  files.forEach(async function(i) {
    var filePath = path.resolve(dir, i)
    var stat = fs.statSync(filePath);

    if (stat.isFile() && path.extname(filePath) === '.png') {
      res.push(filePath)
    } else if (stat.isDirectory()) {
      res = res.concat(await getFiles(filePath, res))
    }
  })

  return res
}

module.exports = getFiles