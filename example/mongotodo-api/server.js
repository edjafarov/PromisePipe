var express = require('express');
var app = express();
var server = require('http').Server(app);

app.use(express.static("./"))

server.listen(process.env.PORT || 3000)

console.log("check localhost:" + process.env.PORT || 3000);
