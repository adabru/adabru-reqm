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


### Security

How to choose token length? Preferably short for convenience. A convenient alphabet is `[a-zA-Z0-9]` = 25+25+10 = 60. The resulting code includes 60^token_length valid tokens. If we suppose 1 year of brute force attack, 10 valid tokens and 1ms server response time (overestimation), the attack's successrate is given by: #tries = 365*24*60*60*1000[ms] / 1[ms], #code = 60^tokenlength, #tokens = 10, p_success = 1 - ((#code - #tokens) over #tries) / (#code over #tries).

```python
# evaluated on <https://sagecell.sagemath.org/>
def successrate(tries, code, tokens):
    k = k1 = k2 = tries
    n1 = code - tokens
    # all failing tries = binomial(k, n1)
    n2 = code
    # all possible tries = binomial(k, n2)
    # p_success = 1 - #all_fail / #all

    # transform for computability (memory+time issue)
    # binomial(n,k) = n! / (n-k)!k!
    # p_success = 1 - n1! / n2! * (n2-k)! / (n1-k)!, n1 ≈ n2, k << n1
    #                 ↑↑ _x ↑↑↑   ↑↑↑↑↑↑ _y ↑↑↑↑↑↑↑
    _x = 1
    for i in range(n2, n1, -1):
        _x /= i
    _y = 1
    for i in range(n2-k, n1-k, -1):
        _y *= i
    return 1 - _x * _y

for tokenlength in range(5,10):
    print "tokenlength:%i successrate:%f"%(tokenlength, successrate(365*24*60*60*1000, 60^tokenlength, 10))
```

|tokenlength|successrate|
|5|100%|
|6|99.9987%|
|7|10.7%|
|8|1.88%|
|9|0.0031%|

Personally I am using token-length 8 over `[a-zA-Z0-9]`.
