# Использование ПромисПайпов на примере авторизации пользователя

Простой пример использования ПромисПайпов для решения задачи авторизации пользователя.
Вы можете запустить пример набрав в консоли находясь в директорие с примером:

    npm install
    npm start

И открыв в браузере:

    http://localhost:3000/

Если же вы хотите разобрать все по косточкам, то именно это мы и сделаем далее.
Сама задача состоит из трех частей:

1. На стороне клиента получить логин и пароль при отправке формы.
2. На стороне сервера проверить логин и пароль.
3. На стороне клиента сообщить пользователю о результате проверки.

Сам проект будет состоять из трех файлов:

1. `index.html` — статическая html-страничка, которая содержит форму ввода логина и пароля и подключает скрипт `client.js`.
2. `backend.js` — сервер, который отдает статику и инициирует ПромисПайп на стороне сервера.
3. `frontend.js` — скрипт, который инициирует ПромисПайп на стороне клиента и передаст в него данные после отправки формы.
4. `common.js` — скрипт, общий для клиента и сервера и представляющий собой логику работы пайпа.

Пример имеет следующие зависимости:

* express — фреймворк с помощью которого реализован сервер
* body-parser — парсит тело запроса на предмет переменных
* promise-pipe — непосредственно ПромисПайпы
* es6-promise — Промисы es6
* browserify — он нужен что бы собрать для использования в браузере `client.js`

Что бы не устанавливать их все отдельно клонируйте в директории с примером запустите `npm install`.


## index.html

Это просто статическая страничка.
Она содержит в себе форму, которая позволяет отправить :

    <form action="/login/" method="post" class="login-form">
      <input type="text" name="login" placeholder="Логин : Carmack" required="required">
      <input type="password" name="password" placeholder="Пароль : iddqd" required="required">
      <button type="submit">Вход</button>
      <p class="message message_fail">Вы ошиблись при вводе логина или пароля.</p>
      <p class="message message_success">Добро пожаловать!</p>
    </form>

И, кроме того, подключает в конце `body` скрипт `frontend.js` (после сборки browserify).

  <script src="bundle.js"></script>


## backend.js

Для начала просто настроим сервер.

    /* Мы используем фреймфорк express.js для реализации сервера */
    var express = require('express')
        , app = express()
        , bodyParser = require('body-parser')
        , server = require('http').Server(app);

    /* Ожидается что промиспайпы получат уже распаршенные данные */
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    /* Раздача статики, что бы мы могли получить доступ к index.html */
    app.use(express.static("./"));
    /* Запускаем сервер */
    server.listen(3000);

Запускать его можно, как и любой скрипт, в консоли коммандой:

    node backend.js

После этого открыв ссылку [http://localhost:3000/][1] вы должны увидеть index.html
Теперь добавим до `server.listen(3000);` инициализацию ПромисПайпов.

    /* Добавляем скрипт, общий для бекенда и фронтенда */
    var pipe = require('./common.js')
        /* Подключаем скрипт коннектора промиспайпов */
        , connectors = require('./node_modules/promise-pipe/example/connectors/HTTPDuplexStream')
        /* Получаем экземпляр промиспайпа, созданный в этом скрипте */
        , PromisePipe = pipe.PromisePipe
    /* Указыаем какой транспорт используется */
    PromisePipe.stream('server','client').connector(connectors.HTTPServerClientStream(app));

Это позволит обрабатывать сервисную часть промиспайпов.
Коннектор может отличаться, например можно использовать сокеты.

## frontend.js

Сначала инициализируем работу ПромисПайпа:

    /* Подключаем скрипт общий для бекенда и фронтенда */
    var pipe = require('./common.js')
    /* Получаем экземпляр промиспайпа, созданный в этом скрипте */
      , PromisePipe = pipe.PromisePipe
    /* Подключаем скрипт коннектора промиспайпов */
      , connectors = require('./node_modules/promise-pipe/example/connectors/HTTPDuplexStream');
    /* Указыаем какой транспорт используется */
    PromisePipe.stream('client','server').connector(connectors.HTTPClientServerStream());

Так как тут тоже используется `require`, что бы использовать скрипт в браузере надо будет сначала
собрать его с помощью [browserify][2]. Для этого наберите в консоли:

    browserify frontend.js -o bundle.js

Затем получим из DOM форму и по событию отправки данных будем передавать данные в ПромисПайп:

    /* Получаем из DOM форум авторизации */
    var form = document.querySelector('.login-form');
    /* Перехватываем отправку формы */
    form.addEventListener('submit', function (event) {
      /* Блокируем отправку формы */
      event.preventDefault();
      /* Получаем данные из формы */
      var data = {
          login: document.querySelector('input[name="login"]').value.trim()
          , password: document.querySelector('input[name="password"]').value.trim()
        }
      /* Очищаем форму */
      form.reset();
      /* Передаем их в промиспайп */
      pipe(data);
    });


## common.js

Это скрипт, который содержит логику и используется и на клиенте и на сервере.
Для начала инициируем ПромисПайп и промисы:

    /* Создаем переменую с промиспайпом и промисом */
    var PromisePipe = require('promise-pipe')()
      /* Подключаем промисы es6 */
      , Promise = require('es6-promise').Promise;

Определим где именно сейчас исполняется скрипт:

    /* Если в глобальном пространстве имен нет window, то будем считать, что все происходит на сервере. */
    if(typeof(window) !== 'object'){
      PromisePipe.setEnv('server');
    }

Затем, создадим функции, который будут указывать где именно выполняется та или
иная часть цепочки:

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

И экспортируем экземпляр промиса и цепочку действий, что бы они были доступны в
`frontend.js` и `backend.js`.


    /* Логика */
    /* Получив данные на сервере мы проверяем логин и пароль */
    /* и выводим пользователю сообщение о результате. */
    module.exports = PromisePipe()
                    	.then(serverSide(validateData))
                    	.then(clientSide(success))
                      .catch(clientSide(fail));

    module.exports.PromisePipe = PromisePipe;

И теперь давайте посмотрим что происходит внутри каждого из звений цепочки:

### validateData()

Тут должна быть проверка логина и пароля. У нас для упрощения примера они просто
сравниваются со статическими значениями. Создается промис и в зависимости от результата
сравнения выполняются или отклоняется.

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

### success() и fail()

В зависимости от результата validateData() мы показываем то или иное сообщение пользователю.
Вот и все.

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

## Заключение



[1]: http://localhost:3000/
[2]: http://browserify.org/
