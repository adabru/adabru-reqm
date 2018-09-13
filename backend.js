let http = require('http')
let fs = require('fs')
let path = require('path')
let cp = require('child_process')
let url = require('url')

let host = process.argv[2]
let htmlport = process.argv[3]
let yjsport = process.argv[4]
let urlroot = process.argv[5] || '/'

if(!process.version.startsWith('v8'))
  return console.log(`only node v8 supported because of native modules in y-websockets-server; current version is ${process.version}`)

if(!host || !htmlport || !yjsport)
  return console.log(
`
  usage: node backend.js host htmlport yjsport [urlroot]
`)

{
  let yserver = cp.spawn('node', [require.resolve('y-websockets-server/src/server.js'), '--port', yjsport, '--db', 'leveldb'], {stdio:'inherit'})
  process.on('exit', _=>yserver.kill())
  process.on('SIGTERM', process.exit)
}

http.createServer( (req, res) => {
  let _url = url.parse(req.url)
  if(req.url != path.normalize(req.url) || !req.url.startsWith(urlroot)) {
    res.writeHead(400)
    res.end('invalid path')
  } else if(req.url == urlroot) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(`
      <meta charset="utf-8">
      <title>REQM</title>
      <link href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAwUExURfj4+UxpcfP19u7w8u7v7+zu6+ns7+/x8uzu8uLFEejs7+3v89fXiuTnzfz8/OzQGwNk7egAAAAOdFJOU/wA8ugQ2ii2Vvt+k+acc+sIJwAAAI9JREFUGNMtT1kWxDAIIq5Z+uz9bzvYDMmHIipiEGbhGeMDOvcjEM2cl4iEoPixo4m5USV85ThGwuFVCinycMNIakvdpYXHENrBs9ajAqjBQfh639UVTEzp1iZcRSRhnIfbwooG7LRSkkN782gF10CvEQ4dYzKra2PPz/rmHhKCjHvc9E0PcvR/XCMyw6yjH7h3BQ/oy6uWAAAAAElFTkSuQmCC" rel="icon"/>
      <link href="app.css" rel="stylesheet">
      <div id="app"></div>
      <script src="app.js"></script>
    `)
  } else if(_url.pathname == urlroot+'yjs-connector/') {
    // proxy
    let options = {host, port:yjsport, path: '/socket.io/'+_url.search, headers:req.headers, method:req.method}
    let p_req = http.request(options, p_res => {
      res.writeHead(p_res.statusCode, p_res.headers)
      p_res.pipe(res)
    })
    p_req.on('error', e => {
      console.error(`problem with yjs connector on port ${yjsport}: ${e.message}`)
      res.writeHead(500)
      res.end()
    })
    req.pipe(p_req)
  } else {
    fs.createReadStream(`./${req.url.substr(urlroot.length)}`)
      .on('error', () => {
        res.writeHead(404)
        res.end('not found') })
      .on('open', () => {
        let ct = {'.js':'application/javascript', '.css':'text/css'}[path.extname(req.url)]
        res.writeHead(200, {'content-type': ct})})
      .pipe(res)
  }
}).on('upgrade', (req, socket, head) => {
  // rfc https://tools.ietf.org/html/rfc6455
  // code derived from https://github.com/nodejitsu/node-http-proxy
  let _url = url.parse(req.url)
  let options = {method:req.method, host, port:yjsport, path: '/socket.io/'+_url.search, headers:req.headers}
  let p_req = http.request(options)
  p_req.on('error', e => {console.log(`p_req ${e}`); socket.end()})
  p_req.on('response', p_res => { if (!p_res.upgrade) {
      socket.write( `HTTP/${p_res.httpVersion} ${p_res.statusCode} ${p_res.statusMessage}\r\n`
                  + `${Object.entries(p_res.headers).map(([k,v]) => k+': '+v).join('\n')}\r\n\r\n` )
      p_res.pipe(socket)
    } });
  p_req.on('upgrade', (p_res, p_socket, p_head) => {
    p_socket.on('error', e => {console.log(`p_socket ${e}`); socket.end()})
    socket.on('error', e => {console.log(`socket ${e}`); p_socket.end()})
    for(let s of [socket, p_socket]) {
      s.setNoDelay(true)
      s.setKeepAlive(true, 0)
    }
    socket.write( `HTTP/1.1 101 Switching Protocols\r\n`
                + `${Object.entries(p_res.headers).map(([k,v]) => k+': '+v).join('\n')}\r\n\r\n` )
    socket.unshift(head)
    socket.pipe(p_socket)
    p_socket.unshift(p_head)
    p_socket.pipe(socket)
  })
  p_req.end()
}).listen(htmlport, host, () => console.log(`Server running at http://${host}:${htmlport}/`))
