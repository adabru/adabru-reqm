Knowledge used in this project is collected here

## TODO

- https
- localstorage
- javascript idioms used
- webpack
- git
- npm
- nodejs
- github
- CMMI
- product requirements


### Websockets

```js
// echo server
http.createServer().on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');
  socket.pipe(socket)
}).listen(8125, '::1') && true
```

```sh
(echo "
GET / HTTP/1.1
Connection: Upgrade
Upgrade: websocket
" && cat) | nc ::1 8125
```

```js
// echo test
http.request({host:'::1', port:8125, headers:{'Connection':'Upgrade', 'Upgrade':'websocket'}}).on(
'upgrade', (res, socket, head) => {
  socket.pipe(process.stdout);
  socket.write('hello world!');
}).end() && true
```

Reference ws-server: <https://github.com/websockets/ws#simple-server>
Reference ws-proxy: <https://github.com/nodejitsu/node-http-proxy>