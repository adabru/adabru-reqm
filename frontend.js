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
 *  reqs:{ r0001:{ name:" detail:{ 📱:" 📂:"📱" } tags:" usecases:[ parents:[ children:[ related:[ rationale:"
 *  sets:{ v∞:{ detail:" reqs:[ } parking
 *  chats:{ global:[ author:" text:" ] c001 r0001
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


class App extends React.Component {
  constructor() {
    super()
    window.onhashchange = _=>this.setState({view:location.hash.substr(1)||'mission'})
    this.state = {data:null,view:location.hash.substr(1)||'mission'}
    database.init('v15', EMPTY_DATA, newState => this.setState({data:newState}))
    this.focusCreated = null
    this.applyBackup = database.applyBackup
  }
  setView(view) { this.setState({view}) ; window.location.hash = view }

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
          e('button', {onClick:_=>this.setView('v∞')}, 'v∞'),
          e('button', {onClick:_=>this.setView('v∞')}, 'new'),
          e('button', {onClick:_=>this.setView('v∞')}, 'parking'),
          e('button', {onClick:_=>this.setView('v∞')}, 'usecases'),
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
      ( this.state.view == 'mission' ? e(Mission, {_data, refBind, focusNext}) : e(List, {_data, refBind, focusNext}) )
    )
  }
}


ReactDOM.render(e(App), document.getElementById("app"))
