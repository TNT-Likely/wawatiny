const Listr = require('listr')
const path = require('path')
const tiny = require('./tiny')
const getFiles = require('./getFiles')
const chalk = require('chalk')
const { checkType, sleep } = require('./util')
const log = require('./log')
let continueNum = 10
let taskList = null
let options = null
const wawatiny = (opts) => {
	options = opts
	const {input, output} = opts
	if (!checkType(input, 'String')) {
		console.log(chalk.red(`入参input:${input}错误`))
		return
	}

	 taskList = new Listr([
		{
			title: 'Get Files',
			task: async (ctx, task) => {
				ctx.success = []
				ctx.failed = []
				const files = await getFiles(input)
				ctx.files = files
				task.title = `Get ${files.length} Files`
				taskList.add(getTask(files))
				return ''
			}
		}
	])

	taskList
	.run()
	.catch(err => {
		console.log(chalk.red(err))
	})
}

const getTask = (files) => {
	return {
		title: 'Compress files',
		enabled: ctx => files.length > 0,
		task: async (ctx, task) => {
			const filesPromise = files.map(item => {
				return new Promise((resolve, reject) => {
					tiny(item, options)
					.then(res => {
						resolve(res)
					})
					.catch(err => {
						resolve(err)
					})
				})
			})
			let continueFiles = []

			await Promise
			.all(filesPromise)
			.then(res => {
				res.forEach(item => {
					if (item.code === 0) {
						ctx.success.push(item)
					} else if (item.code === 4000) {
						continueFiles.push(item.data.filePath)
					} else {
						ctx.failed.push(item)
					}
				})
			})

			let successNum = ctx.success.length
			let failedNum = ctx.files.length - successNum
			task.title = `Compress Success ${successNum}, Failed ${failedNum}`

			continueNum -= 1
			if (continueFiles.length === 0 || continueNum === 0) {
				showResult({ctx, continueFiles})
				return ''
			}

			await sleep(2000)

			taskList.add(getTask(continueFiles))
			
			return ''
		}
	}
}

const showResult = async ({ctx, continueFiles}) => {
	let totalOldSize = 0
	let totalNewSize = 0

	ctx.success.forEach(item => {
		let { oldSize, newSize, fileName } = item.data
		totalOldSize += parseFloat(oldSize)
		totalNewSize += parseFloat(newSize)
		log.push([fileName, 'success', oldSize, newSize, `${parseFloat((oldSize-newSize)/oldSize*100).toFixed(2)}%`]);
	})


	ctx.failed.forEach(item => {
		let { fileName } = item.data
		log.push([fileName, 'Failed'])
	})

	continueFiles.forEach(filePath => {
		let fileName = path.extname(filePath) ? path.basename(filePath) : path.relative(options.input, filePath)
		log.push([fileName, 'Failed'])
	})

	await sleep(1000)

	console.log(log.toString())
	console.log(`Total Num : ${ctx.files.length}, Success Num : ${ctx.success.length}, Failed Num : ${ctx.failed.length +  continueFiles.length} , Total Old Size : ${(totalOldSize).toFixed(2)} KB, Total New Size : ${(totalNewSize).toFixed(2)} KB, Total Save Size : ${((totalOldSize-totalNewSize)).toFixed(2)} KB`)
}

module.exports = wawatiny