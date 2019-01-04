var checkType = function (o, type) {
  return Object.prototype.toString.call(o) === '[object ' + (type || 'Object') + ']'
}

var merge = function (target, source) {
  var newObj = Object.assign({}, target)
  for (let x in source) {
    if (checkType(source[x])) {
      newObj[x] = util.merge(newObj[x], source[x])
    } else {
      newObj[x] = source[x]
    }
  }
  return newObj
}

var dateFormat = function (date, fmt) {
  date = new Date(date)
  var o = {
    "M+": date.getMonth() + 1, //月份 
    "d+": date.getDate(), //日 
    "h+": date.getHours(), //小时 
    "m+": date.getMinutes(), //分 
    "s+": date.getSeconds(), //秒 
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
    "S": date.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

let requireNoCache = function (filePath) {
  delete require.cache[filePath]
  return require(filePath)
}

let random = function (arr) {
  let id = parseInt(Math.random() * arr.length)
  return arr[id]
}

let streamToBuffer = async function (stream) {
  let buf = []
  return new Promise((resolve, reject) => {
    stream.on('data', data => {
      buf.push(data)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(buf))
    })
  })
}

let sleep = time => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

module.exports = {
  checkType,
  merge,
  dateFormat,
  requireNoCache,
  random,
  streamToBuffer,
  sleep
}