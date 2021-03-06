const fs = require('fs')
const { createReadStream, createWriteStream } =fs
const path = require('path')
const https = require('https')
const {request, get} = https
const { checkType } = require('./util')
const option = {
  hostname: 'tinypng.com',
  port: 443,
  path: '/web/shrink',
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  }
}

const tiny = (filePath, opts = {}) => {
  const fileName = path.extname(filePath) ? path.basename(filePath) : path.relative(opts.input, filePath)
  if (!checkType(filePath, 'String')) {
    return Promise.reject({
      code: 4001,
      data: {
        filePath,
        fileName
      },
      msg: '入参必须为string'
    })
  }

  if (!fs.existsSync(filePath)) {
    return Promise.reject({
      code: 4002,
      data: {
        filePath,
        fileName
      },
      msg: `文件${filePath}不存在`
    })
  }

  return new Promise((resolve, reject) => {
    
    createReadStream(filePath).pipe(request(option, function(resp) {
      resp.on('data', function(resInfo) {
        resInfo = resInfo.toString()
        try{
          resInfo = JSON.parse(resInfo)
        } catch (e) {
          reject({
            code: 4000,
            data: {
              filePath,
              fileName,
            },
            msg: '接口请求被拒绝'
          })
        }

        if (/^\s*</g.test(resInfo) || resInfo.error) {
          reject({
            code: 4000,
            data: {
              filePath,
              fileName
            },
            msg: '压缩失败'
          })
          return
        }

        const oldSize = (resInfo.input.size / 1024).toFixed(2)
        const newSize = (resInfo.output.size / 1024).toFixed(2)

        get(resInfo.output.url, function(imgRes) {
          var outPath = filePath,
          outDir;

          if (!!opts.output) {
            outPath = filePath.replace(opts.input, opts.output);
            outDir = path.dirname(outPath);
            if (!fs.existsSync(outDir)) {
              fs.mkdirSync(outDir);
            }
          }

          imgRes.pipe(createWriteStream(outPath))

          imgRes.on('end', function() {
            resolve({
              code: 0000,
              data: {
                oldSize,
                newSize,
                fileName,
                url: resInfo.output.url
              }
            })
          })
          
        })
      })
    }))
  })
}

module.exports = tiny