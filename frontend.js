React = require('react')
ReactDOM = require('react-dom')
e = React.createElement

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
    this.state = {data:null}
    database.init('v15', EMPTY_DATA, newState => this.setState({data:newState}))
    this.focusCreated = null
    this.applyBackup = database.applyBackup
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
      e('p', null, 'version description'),
      e('div', null,
        ..._data.get('bffp').map((_,i) => e(Bffp, {
          _data, id:i, path:`bffp.${i}`, refBind, focusNext, delete:_=>_data.get('bffp').delete(i)
        })),
        e('div', null,
          e('h1', {contentEditable:true, /*onChange*/onInput:({target}) => {
            _data.get('bffp').push({name:target./*value*/innerText, detail:'', claims:[]})
            focusNext(`bffp.${_data.get('bffp').length()-1}`)
          }})
        )
      )
    )
  }
}

class Bffp extends React.Component {
  render() {
    var bffp = this.props._data.get('bffp').get(this.props.id)

    return e('div', {className:'bffp'},
      e('div', null,
        e('button', {onClick:_=>this.props.delete()}, '🗑'),
        e('h1', {
          contentEditable:true,
          ref:this.props.refBind(bffp.get('name').yText(), this.props.path)
        })
      ), ...bffp.get('claims')
        .map((_,j) => e(Claim, Object.assign({}, this.props, {
          id: bffp.get('claims').get(j),
          path: `${this.props.path}.claims.${j}`,
          delete: _=>bffp.get('claims').delete(j)
        }))),
      e('h2', {contentEditable:true, onInput:({target}) => {
        var pos = this.props._data.get('claims').length()
        var key = 'c'+String(pos).padStart(3,0)
        this.props._data.get('claims').set(key, {name:target.innerText, detail:'', reqs:[]})
        bffp.get('claims').push(key)
        this.props.focusNext(`${this.props.path}.claims.${bffp.get('claims').length()-1}`)
      }})
    )
  }
}

class Claim extends React.Component {
  render() {
    var claim = this.props._data.get('claims').get(this.props.id)

    return e('div', {className:'claim'},
      e('div', null,
        e('button', {onClick:_=>this.props.delete()}, '🗑'),
        e('h2', {
          contentEditable:true,
          ref:this.props.refBind(claim.get('name').yText(), this.props.path)
        })
      ), ...claim.get('reqs')
        .map((_,k) => e(Requirement, Object.assign({}, this.props, {
          id: claim.get('reqs').get(k),
          path: `${this.props.path}.reqs.${k}`,
          delete: _=>claim.get('reqs').delete(k)
        }))),
      e('h3', {contentEditable:true, onInput:({target}) => {
        var pos = this.props._data.get('reqs').length()
        var key = 'r'+String(pos).padStart(4,0)
        this.props._data.get('reqs').set(key, {
          name:target.innerText, detail:{'📱':'','📂':'📱','💻':'📱','👓':'📱'}, tags:'', usecases:[], parents:[], children:[], related:[], rationale:''})
        claim.get('reqs').push(key)
        this.props.focusNext(`${this.props.path}.reqs.${claim.get('reqs').length()-1}`)
      }})
    )
  }
}

class Requirement extends React.Component {
  constructor() {
    super()
    this.state = { device:'📱' }
    this.pen = null
  }
  render() {
    var req = this.props._data.get('reqs').get(this.props.id)
    var _detail = device => req.get('detail').get(device).toJs()
    var linked = device => ['📱','📂','💻','👓'].includes(_detail(device)) ? _detail(device) : device

    return e('div', {className:'req'},
      e('div', null,
        e('button', {onClick:_=>this.props.delete()}, '🗑'),
        e('h3', {
          contentEditable:true,
          ref:this.props.refBind(req.get('name').yText(), this.props.path)
        })
      ), e('div', {className: linked(this.state.device)},
        ...req.get('detail').keys().map(device =>
          e('button', {
            draggable: true,
            onMouseDown: _=> this.setState({device}),
            onDrop: _=> {
              if(this.pen && device != this.pen) {
                req.get('detail').get(device).overwrite(this.pen)
                // match linked
                req.get('detail').keys().filter(_device => _detail(_device) == device)
                  .forEach(_device => req.get('detail').get(_device).overwrite(this.pen))
              }
              this.setState({})
            },
            onDragStart: _=> {
              this.pen = device
              // remove link
              if(device != linked(device)) {
                req.get('detail').get(device).overwrite(_detail(linked(device)))
                this.setState({})
              }
            },
            onDragEnd: _=> this.pen = null,
            onDragOver: e => e.preventDefault() /*needed for onDrop to fire*/,
            className: linked(device) + (linked(device) == device ? '' : ' overwrite')
          }, device)
        ),
        e('textarea', { ref: this.props.refBind(
          req.get('detail').get(linked(this.state.device)).yText()
        )}),
      )
    )
  }
}

class Chat extends React.Component {
  constructor(props) {
    super()
    if(!props._data.get('chats').get(props.id))
      props._data.get('chats').set(props.id, [])
  }
  render() {
    var chat = this.props._data.get('chats').get(this.props.id)
    return e('div', {className:'chat', ref:ref=>ref && (ref.scrollTop=ref.scrollHeight)},
      ...chat.map((msg,i) => e('div', null,
        e('span', null, msg.get('author').toJs()),
        e('p', {contentEditable: true, ref: this.props.refBind(msg.get('text').yText()),
          onKeyDown: ({key,target}) => (key == 'Backspace' && target.innerText.trim() == '') ? chat.delete(i):0
        })
      )),
      e('textarea', {
        placeholder: 'type your message and press ctrl+enter ...',
        onKeyDown: ({target, ctrlKey, key}) => {
          if(ctrlKey && key == 'Enter') {
            chat.push({author:'?', text:target.value})
            target.value = ''
          }
        }
      })
    )
  }
}

ReactDOM.render(e(App), document.getElementById("app"))
