React = require('react')
ReactDOM = require('react-dom')
e = React.createElement

var {Mission, Chat} = require('./mission')
var {List} = require('./list')
database = require('./database')

/*
 * data model
 *
 *  bffp:[ name:" detail:" claims:[
 *  claims:{ c001:{ name:" detail:" reqs:[
 *  reqs:{ r0001:{ name:" detail:{ 📱:" 📂:"📱" } tags:[ usecases:[ parents:[ children:[ related:[ rationale:"
 *  sets:[ name:" detail:" reqs:[
 *  chats:{ global:[ author:" text:" ] c001 r0001
 *  usecases:{ u001:"
 *
 * index model
 *
 *  reqs:{ r0001:{ sets:[
 *  tags:{ sometag:[
 *  parking:[
 *
 */
EMPTY_DATA = {
   bffp: [],
   claims: {},
   reqs: {},
   sets: [],
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


class App extends React.Component {
  constructor() {
    super()
    window.onhashchange = _=>this.setState({view:location.hash.substr(1)||'mission'})
    this.state = {data:null,index:null,view:location.hash.substr(1)||'mission'}
    database.init('v17', EMPTY_DATA, newState => {
      var data = newState
      // update index
      var index = {}
      // debug
      Object.assign(window, {data, index})
      index.tags = {}
      index.reqs = {}
      for(let reqId of data.get('reqs').keys()) {
        data.get('reqs').get(reqId).get('tags').map(tag => {
          if(!index.tags[tag]) index.tags[tag] = []
          index.tags[tag].push(reqId)
        })
      }
      data.get('sets').map(set => set.get('reqs').map(reqId => {
        if(!index.reqs[reqId]) index.reqs[reqId] = {sets:[]}
        index.reqs[reqId].sets.push(set.get('name').toJs())
      }))
      this.setState({data,index})
    })
    this.focusCreated = null
    this.applyBackup = database.applyBackup
  }
  setView(view, i=null) {
    if(i!=null) view = (i+'_').padStart(3,0) + view
    this.setState({view})
    window.location.hash = view
  }
  render() {
    // TODO optimize large sets with timestamp
    var _data = this.state.data;
    if(_data == null)
      return e('h1', null, '⌛')

    var focusNext = path => this.focusCreated = path
    var refBind = (y, path=0) => ref => {
      if(ref != null) y.bindTextarea(ref)
      else y.unbindTextareaAll()
      if(path == this.focusCreated) {
        // reposition caret to end
        var range = document.createRange(); range.selectNodeContents(ref); range.collapse(false);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        this.focusCreated = null
      }
    }
    return e('div', null,
      e('header', null,
        e('div', null, e(Chat, {_data, id:'global', refBind})),
        e('div', null,
          e('button', {onClick:_=>this.setView('mission')}, 'mission'),
          ..._data.get('sets').map((reqset,i) => e('button', {
            contentEditable:true,
            ref:refBind(reqset.get('name').yText()),
            onClick:_=>this.setView(reqset.get('name').toJs(), i)
          })),
          e('button', {onClick:_=>{
            _data.get('sets').push({name:'↑', detail:`Description of this version.`, reqs:[]})
            this.setView('↑', _data.get('sets').length()-1)
          }}, 'New'),
          // e('button', {onClick:_=>this.setView('v∞')}, 'parking'),
          // e('button', {onClick:_=>this.setView('v∞')}, 'usecases'),
          e('button', {onClick:() => {
            var link = document.createElement('a')
            link.download = 'database.json' ; link.href = `data:application/json,${encodeURIComponent(_data.toJson())}`
            link.click()
          }}, '💊'),
          e('textarea', {onChange:({target}) => this.configimport = target.value}),
          e('button', {onClick:() => {
            try { var parsed = JSON.parse(this.configimport) } catch(e) { }
            if(parsed) this.applyBackup(parsed)
          }}, '🍴')
        )
      ),
      ( this.state.view == 'mission' ?
          e(Mission, {_data, refBind, focusNext, index:this.state.index})
        : e(List, {_data, refBind, focusNext, index:this.state.index,
          reqset: _data.get('sets').get(parseInt(this.state.view.slice(0,2)))
        }) )
    )
  }
}


ReactDOM.render(e(App), document.getElementById("app"))
