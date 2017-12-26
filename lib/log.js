var Table = require('cli-table');

var table = new Table({
  head: ['filename', 'status', 'old size(kb)', 'new size(kb)', 'compress ratio(%)']
});

module.exports = table;