var fs = require('fs'),
  path = require('path'),
  https = require('https'),
  log = require('./log.js'),
  ora = require('ora'),
  request = https.request,
  get = https.get,
  createReadStream = fs.createReadStream,
  createWriteStream = fs.createWriteStream,
  res = [];

var getFiles = function(dir) {
  if (!dir) {
    return;
  }
  if(!!path.extname(dir)){
    res.push(dir)
    return 
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

  var completedNum = 0,
    totalImgNum = res.length,
    totalOldSize = 0,
    totalNewSize = 0,
    failedNum = 0,
    spinner = ora(`Total Num : ${totalImgNum} , Compressing ... `).start();

  res.forEach(function(filePath, index) {
    var fileName = path.extname(filePath) ? path.basename(filePath) : path.relative(opts.input, filePath);

    createReadStream(filePath).pipe(request(option, function(resp) {
      resp.on('data', function(resInfo) {
        resInfo = JSON.parse(resInfo.toString());

        if (resInfo.error) {
          failedNum += 1;
          completedNum += 1;
          log.push([fileName, 'failed']);
          return;
        }

        var oldSize = (resInfo.input.size / 1024).toFixed(2);
        var newSize = (resInfo.output.size / 1024).toFixed(2);

        totalOldSize = parseFloat(totalOldSize) + parseFloat(oldSize);
        totalNewSize = parseFloat(totalNewSize) + parseFloat(newSize);

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
            completedNum += 1;

            log.push([fileName, 'success', oldSize, newSize, `${parseFloat((oldSize-newSize)/oldSize*100).toFixed(2)}%`]);

            if (completedNum == totalImgNum) {
              spinner.clear();
              console.log(log.toString());
              spinner.succeed(`Total Num : ${res.length}, Success Num : ${completedNum-failedNum}, Failed Num : ${failedNum} , Total Old Size : ${(totalOldSize).toFixed(2)} KB, Total New Size : ${(totalNewSize).toFixed(2)} KB, Total Save Size : ${((totalOldSize-totalNewSize)).toFixed(2)} KB`);
            }
          })
        })
      })
    }))
  })
}