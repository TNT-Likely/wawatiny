const fs = require('fs')
const { createReadStream, createWriteStream } = fs
const path = require('path')
const https = require('https')
const { request, get } = https
const util = require("node:util")
const { pipeline } = require('stream').promises;
const fsExtra = require('fs-extra')


// promisified version of https.request that supports body
function requestPromise(options, body) {
  return new Promise((resolve, reject) => {
    // Initialize the request
    const req = https.request(options, async (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let errorData = [];
        for await (const chunk of res) {
          errorData.push(chunk);
        }
        return reject(new Error(`Request failed with status code ${res.statusCode}: ${Buffer.concat(errorData).toString()}`));
      }

      let chunks = [];
      for await (const chunk of res) {
        chunks.push(chunk);
      }
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);

    // Handle different types of bodies
    if (body instanceof require('fs').ReadStream || body instanceof require('stream').Readable) {
      // If the body is a stream (like a file stream), pipe it to the request and then end it
      pipeline(body, req)
        .then(() => req.end())
        .catch(reject);
    } else if (body) {
      // If the body is not a stream, write it directly to the request and then end it
      if (typeof body === 'object') {
        // If body is an object, assume it's JSON and stringify it
        req.write(JSON.stringify(body));
      } else {
        // Otherwise, write the body as-is
        req.write(body);
      }
      req.end(); // Ensure we end the request after writing the body
    } else {
      // If there's no body, just end the request immediately
      req.end();
    }
  });
}

const option = {
  hostname: 'tinypng.com',
  port: 443,
  path: '/backend/opt/store',
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  }
}

const tiny = async (filePath, opts = {}) => {
  const fileName = path.extname(filePath) ? path.basename(filePath) : path.relative(opts.input, filePath)
  const extName = path.extname(fileName)

  try {
    // 创建文件读取流
    const readStream = fs.createReadStream(filePath);

    // 发起 HTTPS 请求并发送文件流
    const getKeyResponse = await requestPromise(option, readStream);

    // 处理响应数据
    const getKeyInfo = JSON.parse(getKeyResponse.toString());

    const processResponse = await requestPromise({
      ...option,
      path: '/backend/opt/process',
      headers: {
        ...option.headers,
        'content-type': 'application/json'
      }
    }, {
      key: getKeyInfo.key,
      originalSize: getKeyInfo.size,
      originalType: `image/${extName.replace('.', '')}`
    })

    let processInfo = JSON.parse(processResponse.toString())

    if (opts.outputPath) {
      const outDir = path.dirname(opts.outputPath);
      fsExtra.ensureDir(outDir)
    }

    const outputPath = opts.outputPath || filePath

    // 发起 HTTPS 请求并创建写入流
    const fileWriteStream = fs.createWriteStream(outputPath);
    const response = await new Promise((resolve, reject) => {
      https.get(processInfo.url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download file: ${res.statusCode}`));
        }
        resolve(res);
      }).on('error', reject);
    });

    // 将响应数据管道到文件写入流
    await pipeline(response, fileWriteStream);

    const oldSize = (getKeyInfo.size / 1024).toFixed(2)
    const newSize = (processInfo.size / 1024).toFixed(2)

    return {
      code: 0,
      data: {
        oldSize,
        newSize,
        fileName,
        url: processInfo.url
      }
    }
  } catch (e) {
    return {
      code: 400,
      msg: e.toString(),
      file: filePath
    }
  }
}

module.exports = tiny