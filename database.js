
Y = require('yjs')
require('y-websockets-client')(Y)
require('y-memory')(Y)
require('y-array')(Y)
require('y-text')(Y)
require('y-map')(Y)

var database = {}

var arrayToMap = arr => arr.reduce((map,[k,v]) => {map[k]=v; return map}, {})
var objectMap = (o,fn) => arrayToMap( Object.entries(o).map(fn) )

/*
 * the following three classes Map, Array, Text mirror a yjs-database
 *
 * - strings are treated as YText, except when they occur as direct children of an array
 * - changes are propagated relayed by the y-object-observer (thus bundles local+remote changes)
 * - Text changes are not propagated, instead there is a direct binding between the Y.Text object and the dom element
 */

// ducktyping instead of yo.constructor.name ∊ {YMap, YArray, YText} because uglifyjs mangles names
var ywrap = yo => typeof yo == 'string' || typeof yo == 'number' ? yo : new
  (yo.keys ? _Map : yo.bindTextarea ? _Text : yo.toArray ? _Array : console.warn('invalid y-object'))(yo)
var ytype = jso => typeof jso == 'string' ? Y.Text : Array.isArray(jso) ? Y.Array : Y.Map


class _Map {
  // Y.Map:  get(key)  set(key, value)  delete(key)  keys()  observe({type:add|update|delete,name,value})
  constructor(ymap) {
    this.ymap = ymap
    this.shadow = arrayToMap( ymap.keys().map(k => [k, ywrap(ymap.get(k))]) )
    this.onChange = _ => { /*this.mtime = Date.now() ;*/ if(this.onDeepChange) this.onDeepChange() }
    /*this.mtime = Date.now()*/
    for(var v of Object.values(this.shadow)) if(v.onChange) v.onDeepChange = this.onChange.bind(this)
    ymap.observe(({type,name,value}) => {
      if(type == 'delete') return console.warn(`Y.Map.delete event is not supported.`)
      this.shadow[name] = ywrap(value)
      if(this.shadow[name].onChange) this.shadow[name].onDeepChange = this.onChange.bind(this)
      this.onChange()
    })
  }
  init(jso) { for(let k in jso) this.set(k, jso[k]) }
  toJs() { return objectMap(this.shadow, ([k,v]) => [k,v.toJs()]) }
  toJson() { return JSON.stringify(this.toJs(), null, 2) }
  get(key) { return this.shadow[key] }
  set(key, jso) {
    this.ymap.set(key, typeof jso == 'number' ? jso : ytype(jso))
    var val = ywrap(this.ymap.get(key))
    if(val.init) val.init(jso)
  }
  keys() { return Object.keys(this.shadow) }
  values() { return Object.values(this.toJs()) }
  length() { return Object.keys(this.shadow).length }
}
class _Array {
  // Y.Array:  insert(0,Y.Map)  push([content])  delete(position,length)  toArray().map(…)  get(position)
  //           observe({type:insert|delete,index,values})
  constructor(yarr) {
    this.yarr = yarr
    this.shadow = yarr.toArray().map((_,i) => ywrap(yarr.get(i)))
    this.onChange = _ => { /*this.mtime = Date.now() ;*/ if(this.onDeepChange) this.onDeepChange() }
    /*this.mtime = Date.now()*/
    for(var v of this.shadow) if(v.onChange) v.onDeepChange = this.onChange.bind(this)
    yarr.observe(({type,index,values}) => {
      if(type == 'insert') {
        this.shadow[index] = ywrap(values[0])
        if(this.shadow[index].onChange) this.shadow[index].onDeepChange = this.onChange.bind(this)
      } else /*delete*/ {
        this.shadow.splice(index, 1)
      }
      this.onChange()
    })
  }
  init(jso) { for(let x of jso) this.push(x) }
  toJs() { return this.shadow.map(x => typeof x == 'string' ? x : x.toJs()) }
  map(fn) { return this.shadow.map(fn) }
  find(fn) { return this.shadow.find(fn) }
  findIndex(fn) { return this.shadow.findIndex(fn) }
  get(i) { return this.shadow[i] }
  length() { return this.shadow.length }
  push(jso) {
    this.yarr.push([typeof jso == 'string' ? jso : ytype(jso)])
    var val = ywrap(this.yarr.get(this.yarr.toArray().length - 1))
    if(val.init) val.init(jso)
  }
  delete(i) { this.yarr.delete(i) }
}
/*
 * Text class is special in that it uses native YText bindings
 */
class _Text {
  // Y.Text:  insert(position,string)  delete(position,length)  get(i)  toString()  bindTextarea(htmlElement)  observe({insert|delete})
  constructor(ytext) {
    this.ytext = ytext
  }
  init(jso) { this.ytext.insert(0, jso) }
  overwrite(s) {
    this.ytext.delete(0, this.ytext.toString().length)
    this.ytext.insert(0, s)
  }
  toJs() { return this.ytext.toString() }
  yText() { return this.ytext }
}


database.ydata = {}
database.mirror = {}
database.init = (version, initial, listener) => {
  Y({
    db: {name: 'memory'},
    connector: {
      name: 'websockets-client',
      room: 'reqm',
      url: location.origin,
      options: {path: location.pathname + 'yjs-connector/'}
      // debug direct connect (or other proxy)
      // url: 'http://localhost:8124'
    },
    share: {[`data_${version}`]: 'Map'}
  }).then(y => {
    var ydata = database.ydata = y.share[`data_${version}`]
    // debug
    window.ydata = ydata
    window.y = y

    // add missing keys
    var is = ydata.keys()
    for(let [k,v] of Object.entries(initial))
      if(!is.includes(k))
        ydata.set(k, Array.isArray(v) ? Y.Array : Y.Map)
    // remove unneeded keys
    for(let k of is) if(initial[k] === undefined) ydata.delete(k)

    // mirror y-state to plain JS-object
    var mirror = database.mirror = ywrap(ydata)
    mirror.onDeepChange = _ => listener(mirror)
    listener(mirror)
  })
}
database.applyBackup = jso => {
  for(let k of database.ydata.keys()) database.ydata.delete(k)
  database.mirror.init(jso)
}




module.exports = database

