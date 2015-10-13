var PromisePipe = require('../../src/PromisePipe')();
var Promise = require('es6-promise').Promise;
PromisePipe.setMode('DEBUG');
var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';
 var fs = require('fs');
 var path = require('path')
}
var doOnServer = PromisePipe.in('server')

module.exports = {
  PromisePipe: PromisePipe,
  saveItem: PromisePipe()
    .then(getFormData)
    .then(doOnServer(saveFilesToFolder))
    .then(buildImagesList)
    .then(render)
}

function getFormData(){
  return {
    folderName: document.getElementById('folderName').value,
    files: document.getElementById('files').files
  }
}

function saveFilesToFolder(data){
  var filePromises = data.files.map(function(file){
    return new Promise(function(resolve, reject){
      var writer = fs.createWriteStream(file.name);
      file.stream.pipe(writer);
      writer.on('finish', resolve.bind(this, file.name));
      writer.on('error', reject);
    })
  })
  return Promise.all(filePromises);
}


  function buildImagesList(data){

    var result = "";
    data = data || [];
    result+="<ul>";
    result+=data.map(function(name, i){
      return "<li><img src='/"+name+"'/></li>";
    }).join('');
    result+="</ul>";
    return result;
  }
  function render(data){
    document.getElementById('app').innerHTML = data;
    return data;
  }
