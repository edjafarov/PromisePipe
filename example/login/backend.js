/* Мы используем фреймфорк express.js для реализации сервера */
var express = require('express')
    , app = express()
    , bodyParser = require('body-parser')
    , server = require('http').Server(app);


/* Ожидается что промиспайпы получат уже распаршенные данные */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* Добавляем скрипт, общий для бекенда и фронтенда */
var pipe = require('./common.js')
    /* Подключаем скрипт коннектора промиспайпов */
    , connectors = require('./node_modules/promise-pipe/example/connectors/HTTPDuplexStream')
    /* Получаем экземпляр промиспайпа, созданный в этом скрипте */
    , PromisePipe = pipe.PromisePipe
/* Указыаем какой транспорт используется */
PromisePipe.stream('server','client').connector(connectors.HTTPServerClientStream(app));

/* Раздача статики, что бы мы могли получить доступ к index.html */
app.use(express.static("./"));
/* Запускаем сервер */
server.listen(3000);
