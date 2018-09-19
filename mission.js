React = require('react')

class Mission extends React.Component {
  render() {
    var {_data, index, refBind, focusNext} = this.props
    return e('div', null,
      ..._data.get('bffp').map((bffp,i) => [bffp.get('weight'), i]).sort((b1, b2) => b2[0] - b1[0]).map(([_,i]) => e(Bffp, {
        _data, index, id:i, path:`bffp.${i}`, refBind, focusNext, delete:_=>_data.get('bffp').delete(i)
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
          name:target.innerText, detail:{'📱':'','📂':'📱','💻':'📱','👓':'📱'}, tags:[], usecases:[], parents:[], children:[], related:[], rationale:''})
        claim.get('reqs').push(key)
        this.props.focusNext(`${this.props.path}.reqs.${claim.get('reqs').length()-1}`)
      }})
    )
  }
}


class Requirement extends React.Component {
render() {
    var req = this.props._data.get('reqs').get(this.props.id)

    return e('div', {className:'req'},
      e('div', null,
        e('button', {onClick:_=>this.props.delete()}, '🗑'),
        e('h3', {
          contentEditable:true,
          ref:this.props.refBind(req.get('name').yText(), this.props.path)
        })
      ), e(RequirementDescription, {req, refBind:this.props.refBind}),
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
          src: `/assets/${{'📱':'mobile','📂':'laptop','💻':'tower','👓':'hmd'}[device]}.svg`,
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
        onClick: ({ctrlKey}) => ctrlKey ? req.get('tags').delete(i):0
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
            chat.push({author:'????', text:target.value})
            target.value = ''
          }
        }
      })
    )
  }
}

module.exports = {Mission, Chat, Requirement}