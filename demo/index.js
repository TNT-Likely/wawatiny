var wawatiny = require('../lib/index.js');
var path = require('path');

wawatiny({ 
	input: path.resolve(__dirname, './img'),
	output: path.resolve(__dirname, './img')
});
// console.log(wawatiny);