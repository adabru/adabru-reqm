http = require('http')
fs = require('fs')
path = require('path')

host = process.argv[2]
port = process.argv[3]

if(!host || !port)
  return console.log(
`
  usage: node backend.js host port
`);

var server = http.createServer( (req, res) => {
  if(req.url != path.normalize(req.url)) {
    res.writeHead(400)
    res.end('invalid path')
  } else if(req.url == "/") {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end('<meta charset="utf-8"><h1>Requirements</h1><img src="daisy.jpg"/>')
  } else {
    fs.createReadStream(`.${req.url}`)
      .on('error', () => {
        res.writeHead(404)
        res.end('not found') })
      .on('open', () => {
        res.writeHead(200, {'Content-Type': 'application/javascript'})})
      .pipe(res)
  }
})

server.listen(port, host, () => console.log(`Server running at http://${host}:${port}/`))
