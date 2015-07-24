"use strict";

/* Создаем переменую с промиспайпом и промисом */
var PromisePipe = require('promise-pipe')()
    /* Подключаем промисы es6 */
    , Promise = require('es6-promise').Promise;

/* Если в глобальном пространстве имен нет window, то будем считать, что все происходит на сервере. */
if(typeof(window) !== 'object'){
  PromisePipe.setEnv('server');
}

/* Часть промиспайпа, которая будет выполняться только на сервере */
function serverSide(fn){
	fn._env = 'server';
	return fn
}

/* Часть промиспайпа, которая будет выполняться только на клиенте.*/
/* Так как по умолчанию все происходит на клиенте, то эту функцию */
/* можно спокойно убрать, но мне кажется с ней — нагляднее. */
function clientSide(fn){
	fn._env = 'client';
	return fn
}

/* Логика */
/* Получив данные на сервере мы проверяем логин и пароль */
/* и выводим пользователю сообщение о результате. */
module.exports = PromisePipe()
                	.then(serverSide(validateData))
                	.then(clientSide(success))
                  .catch(clientSide(fail));

module.exports.PromisePipe = PromisePipe;


/* Проверка данных */
function validateData(data){
  /* Создаем промис */
  return new Promise(function(resolve, reject){
    if(
      (data.password == "iddqd")
      &&(data.login == "Carmak")
    ){
      /* Все верно, пользователь авторизирован */
      resolve(data);
    }else{
      /* Ошибка при вводе данных */
      reject(new Error('Ошибка при вводе логина или пароля'));
    }
  });
}

/* В случае успешной авторизации показываем сообщение */
function success(){
  document.querySelector('.message_success').style.display = "block";
  document.querySelector('.message_fail').style.display = "none";
}

/* В случае провала авторизации показываем сообщение */
function fail(){
  document.querySelector('.message_success').style.display = "none";
  document.querySelector('.message_fail').style.display = "block";
}
