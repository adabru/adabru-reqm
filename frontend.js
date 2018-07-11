React = require('react')
ReactDOM = require('react-dom')
e = React.createElement

database = require('./database')

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

class App extends React.Component {
  constructor() {
    super()
    this.state = {data:null}
    database.init('v10', EMPTY_DATA, newState => this.setState({data:newState}))
    this.focusCreated = null
  }

  render() {
    // TODO optimize large sets with timestamp
    var _data = this.state.data;
    if(_data == null)
      return e('h1', null, '⌛')

    var refBind = (y, datapath) => ref => {
      if(ref != null) y.bindTextarea(ref)
      if(datapath == this.focusCreated) {
        // reposition caret to end
        var range = document.createRange(); range.selectNodeContents(ref); range.collapse(false);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        this.focusCreated = null
      }
    }
    // var _get = (...path) => path.reduce((a,x) => a.get(x), this.data)
    return e('div', null,
      e('header', null,
        e('button', {onClick:() => {
          var link = document.createElement('a')
          link.download = 'config.json' ; link.href = `data:application/json,${encodeURIComponent(_data.toJson())}`
          link.click()
        }}, '💊'),
        e('textarea', {onChange:({target}) => this.configimport = target.value}),
        e('button', {onClick:() => {
        }}, '🍴')
      ),
      e('p', null, 'version description'),
      e('div', null,
        ..._data.get('bffp').map((bffp,i) => e('div', null,
          e('h1', {
            contentEditable:true,
            ref:refBind(bffp.get('name').yText(), `bffp.${i}`)
          }),
          ...bffp.get('claims').map(claim => _data.get('claims').get(claim)).map((claim,j) => e('div', null,
            e('h2', {
              contentEditable:true,
              ref:refBind(claim.get('name').yText(), `bffp.${i}.claims.${j}`)
            }),
            ...claim.get('reqs').map(req => e(Requirement, {req, _data}))
          )),
          e('h2', {contentEditable:true, /*onChange*/onInput:({target}) => {
            var pos = _data.get('claims').length()
            var key = 'c'+String(pos).padStart(3,0)
            _data.get('claims').set(key, {name:target.innerText, detail:{}, reqs:[]})
            _data.get('bffp').get(i).get('claims').push(key)
            this.focusCreated = `bffp.${i}.claims.${_data.get('bffp').get(i).get('claims').length()-1}`
          }})        )),
        e('div', null,
          e('h1', {contentEditable:true, /*onChange*/onInput:({target}) => {
            _data.get('bffp').push({name:target./*value*/innerText, detail:'', claims:[]})
            this.focusCreated = `bffp.${_data.get('bffp').length()-1}`
          }})
        )
      )
    )
  }
}

class Requirement extends React.Component {
  render() {
    var req = this.props._data.get('reqs').get(this.props.req)
    return e('div', null,
      e('h3', null, req.get(name)),
      e('div', null,
        req.get('detail').entries().map(([device, detail]) => e('button', null, device)),
        req.get('detail').values()[0]
      )
    )
  }
}


ReactDOM.render(e(App), document.getElementById("app"))
