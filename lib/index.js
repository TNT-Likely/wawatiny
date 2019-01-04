var fs = require('fs'),
  path = require('path'),
  https = require('https'),
  log = require('./log.js'),
  getFiles = require('./getFiles.js'),
  tiny = require('./tiny.js'),
  Listr = require('listr'),
  request = https.request,
  get = https.get,
  createReadStream = fs.createReadStream,
  createWriteStream = fs.createWriteStream,
  successArr = [],
  totalOldSize = 0,
	totalNewSize = 0,
  options = null,
  failedArr = [];


const entry = function(opts) {
	options = opts;
	getFileCont();
}

const getFileCont = function() {
	const task2 = new Listr([
		{
			title: 'Check the number of files',
			task: async (ctx, task) => {
				let files = await getFiles(options.input);
				if (files.length > 0) {
					ctx.files = files;
					task.title = `find ${files.length} files`;
				} else {
					throw new Error('not find file');
				}
			}
		}
	]);
	task2.run().then((res)=>{
		tinyPng(res.files);
	}).catch((error)=>{
		console.error(error);
	})
}

const	tinyPng = function(res) {
	const task3 = new Listr([
		{
			title: 'Compressing files',
			task: async (ctx, task) => {
				let arr = res.map((item)=>{
					return new Promise((resolve, reject)=>{
						tiny(item, options).then((res)=>{
							resolve(res);
						}).catch((error)=>{
							reject(error)
						})
					})
				});
				let eat = await Promise.all(arr.map((item)=>{
						return item.catch(function(err) {
	    			return err
					})
				}))
				ctx.eat = eat;
			}
		}
	]);

	task3.run().then((ctx)=>{
		showResult(ctx.eat);
	}).catch((error)=>{
		console.error(error);
	})
}

const showResult = function(res) {
	res.forEach((item)=>{
		if (item.code === 0) {
			successArr.push(item);
			totalOldSize += parseInt(item.data.oldSize);
			totalNewSize += parseInt(item.data.newSize);
		} else if (item.code === 4000) {
			failedArr.push(item.data.filePath);
		}
	})

	if (failedArr.length > 0) {
		setTimeout(()=>{
			tinyPng(failedArr);
		}, 10000)
		console.log(`Success Num : ${successArr.length}, Failed Num : ${failedArr.length}, Reuploading Compression.........`);
		failedArr = [];
	} else {
		console.log(successArr);
		console.log(`Total Num : ${successArr.length + failedArr.length}, Success Num : ${successArr.length}, Failed Num : ${failedArr.length}, Total Old Size : ${totalOldSize.toFixed(2)} KB, Total New Size : ${totalNewSize.toFixed(2)} KB, Total Save Size : ${(totalOldSize-totalNewSize).toFixed(2)} KB`);
	}
}


module.exports = entry;