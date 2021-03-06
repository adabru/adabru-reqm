var React = require('react')
var e = React.createElement

class Mission extends React.Component {
  render() {
    var {user, _data, index, refBind, focusNext} = this.props
    return e('div', null,
      ..._data.get('bffp').map((bffp,i) => [bffp.get('weight'), i]).sort((b1, b2) => b2[0] - b1[0]).map(([_,i]) => e(Bffp, {
        user, _data, index, id:i, path:`bffp.${i}`, refBind, focusNext, delete:_=>_data.get('bffp').delete(i)
      })),
      e('div', null,
        e('h1', {contentEditable:true, /*onChange*/onInput:({target}) => {
          var weight = Math.min(0, ..._data.get('bffp').map(bffp => bffp.get('weight'))) - 1
          _data.get('bffp').push({name:target./*value*/innerText, detail:'', claims:[], weight})
          focusNext(`bffp.${_data.get('bffp').length()-1}`)
        }})
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
        e('button', {onClick:_=> {
          var lower = this.props._data.get('bffp').map(_bffp => _bffp.get('weight'))
            .filter(w => w < bffp.get('weight')).sort((w1, w2) => w2 - w1)
          if(lower.length > 0)
            bffp.set('weight', lower.length > 1 ? .5 * (lower[0] + lower[1]) : lower[0] - 1)
        }}, '⌄'),
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
  constructor() { super() ; this.state = {dragged:null} }
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
          k, id: claim.get('reqs').get(k),
          path: `${this.props.path}.reqs.${k}`,
          delete: _=>claim.get('reqs').delete(k),
          dragged:this.state.dragged,
          startDrag: _=> this.setState({dragged:k}),
          endDrag: _=> this.setState({dragged:null}),
          onDrop: _=> {
            // move req
            if(this.state.dragged == k) return
            var reqid = claim.get('reqs').get(this.state.dragged)
            claim.get('reqs').delete(this.state.dragged)
            claim.get('reqs').insert(k, reqid)
          }
        }))),
      e('h3', {contentEditable:true, onInput:({target}) => {
        var pos = this.props._data.get('reqs').length()
        var key = 'r'+String(pos).padStart(4,0)
        this.props._data.get('reqs').set(key, {
          name:target.innerText, detail:{'📱':'','📂':'📱','💻':'📱','👓':'📱'}, tags:[], usecases:[], parents:[], children:[], related:[], rationale:''})
        claim.get('reqs').push(key)
        this.props.focusNext(`${this.props.path}.reqs.${claim.get('reqs').length()-1}`)
      }})
    )
  }
}


class Requirement extends React.Component {
  constructor() { super() ; this.dragCounter = 0 }
  render() {
    var req = this.props._data.get('reqs').get(this.props.id)

    return e('div', {
        className:'req', draggable:'true', ref:ref=>this.ref=ref,
        onDragStart:e=>{e.dataTransfer.setDragImage(this.ref.children[0],0,0) ; this.props.startDrag()},
        onDragEnd:_=>this.props.endDrag(),
        onDragOver: e => e.preventDefault() /*needed for onDrop to fire*/,
        onDrop: e => { this.dragCounter = 0 ; this.ref.classList.remove('drag-up', 'drag-down') ; this.props.onDrop(e) },
        onDragEnter: e => this.props.dragged != this.props.k && ++this.dragCounter
          && this.ref.classList.add(this.props.dragged > this.props.k ? 'drag-up' : 'drag-down'),
        onDragLeave: _=> this.props.dragged != this.props.k && !--this.dragCounter
          && this.ref.classList.remove(this.props.dragged > this.props.k ? 'drag-up' : 'drag-down'),
      },
      e('div', null,
        e('button', {onClick:_=>this.props.delete()}, '🗑'),
        e('h3', {
          contentEditable:true,
          ref:this.props.refBind(req.get('name').yText(), this.props.path)
        })
      ), e(RequirementDescription, Object.assign({req}, this.props)),
      e(RequirementDiscussion, this.props),
      e(RequirementTags, {req}),
      e(RequirementVersion, this.props)
    )
  }
}

class RequirementDescription extends React.Component {
  constructor() {
    super()
    this.state = { device:'📱' }
    this.pen = null
  }
  render() {
    var req = this.props.req
    var _detail = device => req.get('detail').get(device).toJs()
    var linked = device => ['📱','📂','💻','👓'].includes(_detail(device)) ? _detail(device) : device

    return e('div', {className: 'description '+linked(this.state.device)},
      ...req.get('detail').keys().map(device =>
        e('img', {
          src: `assets/${{'📱':'mobile','📂':'laptop','💻':'tower','👓':'hmd'}[device]}.svg`,
          alt: device,
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
          onDragStart: e => {
            e.dataTransfer.clearData()
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
        })
      ),
      e('textarea', { ref: this.props.refBind(
        req.get('detail').get(linked(this.state.device)).yText()
      )}),
    )
  }
}

class RequirementTags extends React.Component {
  render() {
    var req = this.props.req
    var tagClass = tag => 'tag c' + (tag.length + tag.charCodeAt(0)) % 10
    return e('div', {className:'tags'},
      ...req.get('tags').map((tag,i) => e('span', {
        className: tagClass(tag),
        onClick: _=> req.get('tags').delete(i)
      }, tag)),
      e('input', {
        placeholder: 'tag',
        onKeyDown: ({key, target}) => {
          if(key == 'Enter' && target.value != '' && !req.get('tags').toJs().includes(target.value))
            req.get('tags').push(target.value)
        }
      })
    )
  }
}

class RequirementVersion extends React.Component {
  render() {
    var available = this.props._data.get('sets').map(set => set.get('name').toJs())
    var assigned = this.props.index.reqs[this.props.id] ? this.props.index.reqs[this.props.id].sets : []

    var versionClass = version => 'version' + (assigned.includes(version) ? ' assigned' : '')
    return e('div', {className:'versions'},
      ...available.map(version => e('span', {
        className: versionClass(version),
        onClick: () => {
          let set = this.props._data.get('sets').find(set => set.get('name').toJs() == version)
          if(assigned.includes(version))
            set.get('reqs').delete(set.get('reqs').findIndex(id => id == this.props.id))
          else
            set.get('reqs').push(this.props.id)
        }
      }, version))
    )
  }
}

class RequirementDiscussion extends React.Component {
  render() {
    var req = this.props._data.get('reqs').get(this.props.id)
    return e('div', {className:'discussion'},
      e('span', null, '🗭'),
      e('div', null,
        e('p', {
          contentEditable: true,
          placeholder: 'rationale',
          ref: this.props.refBind( req.get('rationale').yText() )}),
        e(Chat, {user:this.props.user, _data:this.props._data, id:this.props.id, refBind:this.props.refBind})
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
    var authorColor = author => ['#806','#068','#860','#880','#086','#808','#608','#a04','#04a','#4a0']
      [(author.length + author.charCodeAt(0) * author.charCodeAt(1)) % 10]
    return e('div', {className:'chat', ref:ref=>ref && (ref.scrollTop=ref.scrollHeight)},
      ...chat.map((msg,i) => e('div', null,
        e('span', {style:{color:authorColor(msg.get('author').toJs())}}, msg.get('author').toJs()),
        e('p', {contentEditable: true, ref: this.props.refBind(msg.get('text').yText()),
          onKeyDown: ({key,target}) => (key == 'Backspace' && target.innerText.trim() == '') ? chat.delete(i):0
        })
      )),
      e('textarea', {
        placeholder: 'type your message and press ctrl+enter ...',
        onKeyDown: ({target, ctrlKey, key}) => {
          if(ctrlKey && key == 'Enter') {
            chat.push({author:this.props.user||'????', text:target.value})
            target.value = ''
          }
        }
      })
    )
  }
}

module.exports = {Mission, Chat, Requirement}