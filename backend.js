http = require('http')
fs = require('fs')
path = require('path')

host = process.argv[2]
port = process.argv[3]
urlroot = process.argv[4] || '/'

if(!host || !port)
  return console.log(
`
  usage: node backend.js host port [urlroot]
`);

var server = http.createServer( (req, res) => {
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
  } else {
    fs.createReadStream(`./${req.url.substr(urlroot.length)}`)
      .on('error', () => {
        res.writeHead(404)
        res.end('not found') })
      .on('open', () => {
        res.writeHead(200)})
      .pipe(res)
  }
})

server.listen(port, host, () => console.log(`Server running at http://${host}:${port}/`))
