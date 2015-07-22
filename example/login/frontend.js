(function () {
  "use strict";
  /* Подключаем скрипт общий для бекенда и фронтенда */
  var pipe = require('./common.js')
  /* Получаем экземпляр промиспайпа, созданный в этом скрипте */
    , PromisePipe = pipe.PromisePipe
  /* Подключаем скрипт коннектора промиспайпов */
    , connectors = require('./node_modules/promise-pipe/example/connectors/HTTPDuplexStream');
  /* Указыаем какой транспорт используется */
  PromisePipe.stream('client','server').connector(connectors.HTTPClientServerStream());

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
})()
