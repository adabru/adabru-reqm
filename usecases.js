
var React = require('react')
var e = React.createElement
var {Requirement} = require('./mission')

class Usecases extends React.Component {
  constructor() { super() ; this.state = {query:''} }
  score(q, input) {
    let esc = r => r.replace(/([.?$[\]()|^])/g, "\\$1")

    // create fuzzy regex for each keyword
    let searchers = q.trim().split(' ').map(keyword => {
      // fuzzy search
      if(keyword.length > 3) {
        let tolerances = []
        // edit distance 1: /cat/ becomes /(c?.?at)|(ca?.?t)|(cat?.?)/
        for(let i = 1 ; i <= keyword.length ; i++)
          tolerances.push('(' + esc(keyword.slice(0,i)) + '?.?' + esc(keyword.slice(i)) + ')')
        // letter swaps: /cat/ becomes /(.ct)|(c.a)/
        for(let i = 1 ; i < keyword.length ; i++)
          tolerances.push('(' + esc(keyword.slice(0,i-1)) + esc(keyword[i]) + esc(keyword[i-1]) + esc(keyword.slice(i+1)) + ')')
        // ignore case
        return new RegExp(tolerances.join('|'), 'i')
      } else return new RegExp(esc(keyword), 'i')
    })

    let score = searchers.filter(s => s.test(input)).length
    return score
  }
  query(q) {
    let filtered = this.props._data.get('usecases').keys()
      .map(usecaseid => [ usecaseid, this.score(q, this.props._data.get('usecases').get(usecaseid).toJs()) ])
      .filter(([_, score]) => score > 0)
      .sort((u,v) => v[1] - u[1])
      .map(([usecaseid, _]) => usecaseid)
    this.setState({query:q,filtered})
  }
  render() {
    return e('div', {className:'usecases'},
      e('input', {
        value: this.state.query,
        placeholder: 'search...',
        autoFocus: true,
        onChange: e => this.query(e.target.value)
      }),
      (this.state.query ? this.state.filtered : this.props._data.get('usecases').keys())
        .map(usecaseid => e(Usecase, Object.assign({usecaseid,key:usecaseid}, this.props))),
      e('p', {contentEditable:true, onInput:({target}) => {
        var pos = this.props._data.get('usecases').length()
        var key = 'u'+String(pos).padStart(3,0)
        this.props._data.get('usecases').set(key, target.innerText)
        this.props.focusNext(this.props._data.get('usecases').length()-1)
      }})
    )
  }
}

class Usecase extends React.Component {
  render() {
    let usecase = this.props._data.get('usecases').get(this.props.usecaseid)
    return e('div', {className:'usecase'},
      e(UsecasePreview, {usecase}),
      e('p', {
        className: 'edit',
        contentEditable: true,
        placeholder: 'usecase',
        ref: this.props.refBind( usecase.yText() )
      })
    )
  }
}
// workaround because sync is handled by yjs itself (somewhat inconvenient)
class UsecasePreview extends React.Component {
  constructor() { super() ; this.state = {markup:''} }
  componentDidMount() {
    this.updateMarkup = _=> this.setState({markup:this.props.usecase.toJs()})
    this.props.usecase.yText().observe( this.updateMarkup )
    this.updateMarkup()
  }
  componentWillUnmount() {
    this.props.usecase.yText().unbindAll()
    this.props.usecase.yText().unobserve( this.updateMarkup )
  }
  render() {
    // very simplistic parser
    let html = this.state.markup.split('*').map((s,i) =>  e(i % 2 ? 'strong' : 'span', null, s))
    return e('p', {className:'preview'}, ...html)
  }
}


module.exports = { Usecases }
