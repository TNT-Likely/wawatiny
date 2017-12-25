var fs = require('fs');
var path = require('path');
var https = require('https');
var request = https.request;
var get = https.get;
var createReadStream = fs.createReadStream;
var createWriteStream = fs.createWriteStream;
var res = [];

var getFiles = function(dir) {
  if (!dir) {
    return;
  }

  var files = fs.readdirSync(dir)

  files.forEach(function(i) {
    var filePath = path.resolve(dir, i)
    var stat = fs.statSync(filePath);

    if (stat.isFile() && path.extname(filePath) === '.png') {
      res.push(filePath)
    } else if (stat.isDirectory()) {
      getFiles(filePath);
    }
  })
}

var option = {
  hostname: 'tinypng.com',
  port: 443,
  path: '/web/shrink',
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  }
}

module.exports = function(opts) {
  getFiles(opts.input);

  res.forEach(function(filePath) {

    createReadStream(filePath).pipe(request(option, function(res) {
      res.on('data', function(resInfo) {
        resInfo = JSON.parse(resInfo.toString());

        if (resInfo.error) {
          return console.log('compress failed:' + filePath)
        }

        var oldSize = (resInfo.input.size / 1024).toFixed(2);
        var newSize = (resInfo.output.size / 1024).toFixed(2);

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
            console.log(`Compress the image ${filePath} from ${oldSize}kb to ${newSize}kb,save you ${Math.floor(((oldSize - newSize) / oldSize * 100))}% of the storage space`)
          })
        })
      })
    }))
  })
}