React = require('react')
ReactDOM = require('react-dom')
e = React.createElement

Y = require('yjs')
require('y-websockets-client')(Y)
require('y-memory')(Y)
require('y-indexeddb')(Y)
require('y-array')(Y)
require('y-text')(Y)
require('y-map')(Y)

/*
 * data model
 *
 *  bffp:[ name:" detail:" claims:[
 *  claims:{ c001:{ name:" detail:{ "📱 📂":" } reqs:[
 *  reqs:{ r0001:{ name:" detail:" tags:" usecases:[ parents:[ children:[ related:[ rationale:"
 *  sets:{ v∞:{ detail:" reqs:[ } parking
 *  chats:{ global:{ author:" text:" } c001 r0001
 *  usecases:{ u001:"
 */
EMPTY_DATA = {
   bffp: [],
   claims: {},
   reqs: {},
   sets: {},
   chats: {},
   usecases: {}
 }

/*
 *
 * realtime collaboration
 *  𝓞(bffp) = 10
 *  𝓞(claims) = 200
 *  𝓞(reqs) = 3000
 *  𝓞(sets) = 20, 𝓞(sets[v]) = 200
 *  𝓞(chats) = 3000
 *  𝓞(usecases) = 1000
 * => optimization for {claims reqs sets[v] chats usecases}
 *
 */
OPTIMIZE = ['claims', 'reqs', 'sets:*', 'chats', 'usecases']

// Y.Text
// .insert(position, string)
// .delete(position, length)
// .get(i)
// .toString()
// .bindTextarea(htmlElement)
// .observe({insert|delete})
//
// Y.Array
// .insert(0, Y.Map)
// .push([content])
// .delete(position, length)
// .toArray().map(…)
// .get(position)
// .observe({insert|delete})
//
// Y.Map
// .get(key)
// .set(key, value)
// .delete(key)
// .keys()
// .observe({add|update|delete})


class App extends React.Component {
  constructor() {
    super()
    Y({
      db: {name: 'indexeddb'},
      connector: {
        name: 'websockets-client',
        room: 'reqm',
        url: location.origin,
        options: {path: location.pathname + 'yjs-connector/'}
      },
      share: {data_v10: 'Map'},
    }).then(y => {
      this.data = y.share.data_v10
      window.data = this.data
      // init data
      var shall = ['bffp', 'claims', 'reqs', 'sets', 'chats', 'usecases']
      var is = this.data.keys()
      shall.forEach(k => !is.includes(k) && this.data.set(k, k=='bffp' ? Y.Array : Y.Map))
      is.forEach(k => !shall.includes(k) && this.data.delete(k))
      // init state
      var toJsObject = (yObject, keepText=false) => {
        if(yObject.constructor.name == 'YMap') {
          return yObject.keys().map(k => [k,toJsObject(yObject.get(k), keepText)]).reduce((a,[k,v]) => {a[k]=v; return a}, {})
        } else if(yObject.constructor.name == 'YArray') {
          return yObject.toArray().map(x => toJsObject(x, keepText))
        } else /*YText*/ {
          return keepText ? yObject : yObject.toString()
        }
      }
      this.setState({data: toJsObject(this.data, true)})
      // observers
      this.data.observeDeep(e => {
        var [last] = e.path.splice(-1)
        e.path.reduce((a,x)=>a[x], this.state.data)[last] = toJsObject(e.object, true)
        // TODO optimize large sets with this.state.timestamp
        // update
        this.setState(this.state)
      })
    })

    this.state = {data: EMPTY_DATA}
    this.elementCreated = null
  }

  render() {
    var yAssign = (yO, jsO) => {
      var yType = o => typeof o == 'string' ? 'YText' : Array.isArray(o) ? 'YArray' : 'YMap'
      if(typeof jsO == 'string') {
        yO.insert(0, jsO)
      } else if(Array.isArray(jsO)) {
        yO.push(jsO.map(yType))
        jsO.forEach((x,i) => yAssign(y0.get(i), x))
      } else {
        Object.entries(jsO).map(([k,v]) => {
          yO.set(k, Y[yType(v).substr(1)])
          yAssign(yO.get(k), v)
        })
      }
    }
    var refBind = (y, isNew) => ref => {
      if(ref != null) y.bindTextarea(ref)
      if(isNew()) {
        // reposition caret to end
        var range = document.createRange(); range.selectNodeContents(ref); range.collapse(false);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        this.elementCreated = null
      }
    }
    // var _get = (...path) => path.reduce((a,x) => a.get(x), this.data)
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
        ...this.state.data.bffp.map((bffp,i) => e('div', null,
          e('h1', {
            contentEditable:true, 
            ref:refBind(bffp.name, _ => this.elementCreated == 'bffp' && i == this.state.data.bffp.length-1)
          }),
          ...bffp.claims.map((claim,j) => e('div', null,
            e('h2', {
              contentEditable:true, 
              ref:refBind(claim.name, _ => false)
            }),
            ...this.state.data.claims[claim].reqs.map(req => e(Requirement, Object.assign({req}, this.state.data)))
          )),
          e('h2', {contentEditable:true, /*onChange*/onInput:({target}) => {
            var pos = Object.keys(this.state.data.claims).length
            var key = 'c'+String(pos).padStart(3,0)
            this.data.get('claims').set(key, Y.Map)
            this.data.get('bffp').get(i).get('claims').push([key])
            yAssign(this.data.get('claims').get(key), {name:target.innerText, detail:{}, reqs:[]})
            this.elementCreated = 'claim'
          }})        )),
        e('div', null,
          e('h1', {contentEditable:true, /*onChange*/onInput:({target}) => {
            var pos = this.state.data.bffp.length
            this.data.get('bffp').insert(pos, [Y.Map])
            yAssign(this.data.get('bffp').get(pos), {name:target./*value*/innerText, detail:'', claims:[]})
            this.elementCreated = 'bffp'
          }})
        )
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
