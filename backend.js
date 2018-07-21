http = require('http')
fs = require('fs')
path = require('path')
cp = require('child_process')
url = require('url')

host = process.argv[2]
htmlport = process.argv[3]
yjsport = process.argv[4]
urlroot = process.argv[5] || '/'

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
  _url = url.parse(req.url)
  if(req.url != path.normalize(req.url) || !req.url.startsWith(urlroot)) {
    res.writeHead(400)
    res.end('invalid path')
  } else if(req.url == urlroot) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(`
      <meta charset="utf-8">
      <title>REQM</title>
      <link href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAwUExURfj4+UxpcfP19u7w8u7v7+zu6+ns7+/x8uzu8uLFEejs7+3v89fXiuTnzfz8/OzQGwNk7egAAAAOdFJOU/wA8ugQ2ii2Vvt+k+acc+sIJwAAAI9JREFUGNMtT1kWxDAIIq5Z+uz9bzvYDMmHIipiEGbhGeMDOvcjEM2cl4iEoPixo4m5USV85ThGwuFVCinycMNIakvdpYXHENrBs9ajAqjBQfh639UVTEzp1iZcRSRhnIfbwooG7LRSkkN782gF10CvEQ4dYzKra2PPz/rmHhKCjHvc9E0PcvR/XCMyw6yjH7h3BQ/oy6uWAAAAAElFTkSuQmCC" rel="icon"/>
      <div id="app">
      <script src="app.js"></script>
    `)
  } else if(_url.pathname == urlroot+'yjs-connector/') {
    // proxy
    // req.headers.host = `localhost:${yjsport}`
    var options = {host, port:yjsport, path: '/socket.io/'+_url.search, headers:req.headers, method:req.method}
    var p_req = http.request(options, p_res => {
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
        res.writeHead(200)})
      .pipe(res)
  }
}).listen(htmlport, host, () => console.log(`Server running at http://${host}:${htmlport}/`))
