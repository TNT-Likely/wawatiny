# wawatiny

use tinypng.com to compress images

## Install

```
npm install -g wawatiny 
```

## How  to use ?

### Command Line

```
wawatiny start -i inputdirectory -o outputdirectory
```

### Nodejs File 

```
var wawatiny = require('wawatiny');
wawatiny({
 input: 'inputdirectory',  //[required]
 output: 'outputdirectory' //[optional]
})

```