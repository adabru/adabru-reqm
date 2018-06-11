React = require('react')
ReactDOM = require('react-dom')
e = React.createElement

Y = require('yjs')
require('y-websockets-client')(Y)
require('y-memory')(Y)
require('y-indexeddb')(Y)
require('y-map')(Y)


class App extends React.Component {
  constructor() {
    super()
    Y({
      db: {name: 'indexeddb'},
      connector: {
        name: 'websockets-client',
        room: 'reqm',
        // url: 'localhost:8124'
        url: location.origin,
        options: {path: location.pathname + 'yjs-connector/'}
      },
      share: {data: 'Map'},
    }).then(function (y) {
      window.y = y
      window.data = y.share.data
    })

    this.state = {
      data: {
        bffp: [],
        claims: {},
        reqs: {},
        sets: {},
        chats: {},
        usecases: {}
      }
    }
    this.state = {
      data: {
        bffp: [{name:'empower people', detail:'give people possibilites so they can use more of their individual power and creativity', claims:['c000']}],
        claims: {'c000':{name:'provide information',detail:"store and serve data",reqs:['r0000']}},
        reqs: {'r0000':{name:'store information',detail:{"📱 📂":'hardware storage and data structures'},tags:"storage,data"}},
        sets: {},
        chats: {},
        usecases: {}
      }
    }
  }
  render() {
    return e('div', null,
      e('header', null,
        e('button', {onClick:() => {
          var link = document.createElement('a')
          link.download = 'config.json' ; link.href = `data:application/json,${encodeURI(JSON.stringify(this.state.data, null, 2))}`
          link.click()
        }}, '💊'),
        e('textarea', {onChange:({target}) => this.configimport = target.value}),
        e('button', {onClick:() => {
        }}, '🍴')
      ),
      e('p', null, 'version description'),
      e('div', null,
        ...this.state.data.bffp.map(bffp => e('div', null,
          e('h1', null, bffp.name),
          ...bffp.claims.map(claim => e('div', null,
            e('h2', null, this.state.data.claims[claim].name),
            ...this.state.data.claims[claim].reqs.map(req => e(Requirement, Object.assign({req}, this.state.data))),
            e('input', null)
          )),
          e('input', null)
        )),
        e('input', null)
      )
    )
  }
}

class Requirement extends React.Component {
  render() {
    var req = this.props.reqs[this.props.req]
    return e('div', null,
      e('h3', null, req.name),
      e('div', null,
        ...Object.keys(req.detail).map(device => e('button', null, device)),
        Object.values(req.detail)[0]
      )
    )
  }
}


ReactDOM.render(e(App), document.getElementById("app"))
