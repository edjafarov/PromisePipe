var main = require('./logic.js');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');


app.listen(3000)

var connector = require('http-connector')();

console.log("check localhost:3000");

var PromisePipe = main.PromisePipe;
app.use(bodyParser.json())
app.use(express.static("./"))

PromisePipe.stream('server','client').connector(connector.HTTPServerClientStream(app))
