var React = require('react')
var e = React.createElement
var ReactDOM = require('react-dom')

var {Mission, Chat} = require('./mission')
var {List} = require('./list')
var {Usecases} = require('./usecases')
var database = require('./database')

/*
 * data model
 *
 *  bffp:[ name:" detail:" claims:[ weight:0
 *  claims:{ c001:{ name:" detail:" reqs:[
 *  reqs:{ r0001:{ name:" detail:{ 📱:" 📂:"📱" } tags:[ usecases:[ parents:[ children:[ related:[ rationale:"
 *  sets:[ name:" detail:" reqs:[
 *  chats:{ global:[ author:" text:" ] c001 r0001
 *  usecases:{ u001:"
 *  kanban:{ idea:[ assigned:[ finished[
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
   usecases: {},
   kanban: {}
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
    this.onLogin = (user, token) => {
      this.setState({token,user})
      database.init(token, 'v17', EMPTY_DATA, newState => {
        var data = newState

        // validate (poor replacement for transactional initialization)
        for(let reqId of data.get('reqs').keys())
          if(!data.get('reqs').get(reqId).get('tags'))
            return /* skip incomplete update */
        if(data.get('sets').find(set => !set.get('reqs')))
          return /* skip incomplete update */

        // update index
        var index = {}
        Object.assign(window, {data, index}) /* debug */
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
  }
  setView(view, i=null) {
    if(i!=null) view = (i+'_').padStart(3,0) + view
    this.setState({view})
    window.location.hash = view
  }
  render() {
    // TODO optimize large sets with timestamp
    var user = this.state.user;
    if(!user) return e('header', null, e(Login, {onLogin:this.onLogin}))
    var _data = this.state.data;
    if(!_data) return e('header', null, e('h1', {style:{fontSize:'5em'}}, '⌛'))

    var focusNext = path => this.focusCreated = path
    var refBind = (y, path=0) => ref => {
      if(ref != null) y.bindTextarea(ref)
      else y.unbindTextareaAll()
      if(JSON.stringify(path) == JSON.stringify(this.focusCreated)) {
        // reposition caret to end
        var range = document.createRange(); range.selectNodeContents(ref); range.collapse(false);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        this.focusCreated = null
      }
    }
    return e('div', null,
      e('div', {id:'leftpage'}, e(Chat, {user:this.state.user, _data, id:'global', refBind})),
      e('div', {id:'rightpage'},
        e('header', null,
          e('div', null,
            e('button', {onClick:_=>this.setView('mission')}, 'mission'),
            e('button', {onClick:_=>this.setView('usecases')}, 'usecases'),
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
            e('button', {onClick:() => {
              var link = document.createElement('a')
              link.download = 'database.json' ; link.href = `data:application/json,${encodeURIComponent(_data.toJson())}`
              link.click()
            }}, '💊'),
            e('textarea', {onChange:({target}) => this.configimport = target.value}),
            e('button', {onClick:() => {
              try { var parsed = JSON.parse(this.configimport) } catch(e) { }
              if(parsed) this.applyBackup(parsed)
            }}, '🍴'),
            e(Kanban, {_data, refBind, index:this.state.index})
          )
        ),
        ( this.state.view == 'mission' ?
            e(Mission, {_data, refBind, focusNext, index:this.state.index, user:this.state.user })
          : this.state.view == 'usecases' ?
            e(Usecases, {_data, refBind, focusNext, index:this.state.index, user:this.state.user})
          : e(List, {_data, refBind, focusNext, index:this.state.index, user:this.state.user,
              reqset: _data.get('sets').get(parseInt(this.state.view.slice(0,2)))
          }) )
      )
    )
  }
}


class Login extends React.Component {
  constructor(props) {
    super()
    this.state = {token:''}
  }
  componentDidMount() {
    if(localStorage.getItem('reqm-token')) this.putToken(localStorage.getItem('reqm-token'))
  }
  putToken(token) {
    this.setState({approved: 'pending', token})
    fetch(`login?token=${token}`).catch(console.log).then(res => {
      if(res.status != 200) this.setState({approved:'no'})
      else return res.text()
    }).then(user => {
      if(user) {
        localStorage.setItem('reqm-token', token)
        this.props.onLogin(user, token)
      }
    })
  }
  render() {
    return e('input', {
      className: 'login',
      value: this.state.token,
      placeholder: 'token',
      autoFocus: true,
      onChange: e => this.putToken(e.target.value),
      style: {color: {'no':'#aa0000', 'pending':'#aaaa00'}[this.state.approved] }
    })
  }
}


class Kanban extends React.Component {
  constructor(props) {
    super()
    for(let bucket of ['idea','assigned','finished']) {
      if(!props._data.get('kanban').get(bucket)) {
        props._data.get('kanban').set(bucket, [])
        for(let i of [0,1,2]) props._data.get('kanban').get(bucket).push('', false)
      }
    }
  }
  render() {
    var kanban = this.props._data.get('kanban')

    return e('div', {className:'kanban'},
      e('div', {className:'idea'}, ...kanban.get('idea').map(x => e('h3', {contentEditable:true, ref:this.props.refBind(x.yText())}))),
      e('div', {className:'assigned'}, ...kanban.get('assigned').map(x => e('h3', {contentEditable:true, ref:this.props.refBind(x.yText())}))),
      e('div', {className:'finished'}, ...kanban.get('finished').map(x => e('h3', {contentEditable:true, ref:this.props.refBind(x.yText())}))),
    )
  }
}

ReactDOM.render(e(App), document.getElementById("app"))

// disable formatted copy+cut
var ta = document.createElement('textarea')
unformatSelection = ({target}) => {
  if(target == ta) return
  let selection = window.getSelection().toString()
  // time for cut event to delete content
  setTimeout( _=>{
    document.body.appendChild(ta)
    ta.value = selection
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    target.focus()
  })
}
document.body.addEventListener('copy', unformatSelection)
document.body.addEventListener('cut', unformatSelection)
