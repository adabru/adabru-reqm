React = require('react')

class List extends React.Component {
  render() {
    return e('div', null,
      e('p', null, 'version description'),
      e(TagConfig, this.props)
    )
  }
}

class TagConfig extends React.Component {
  constructor() {
    super()
    this.state = {hierarchy:JSON.parse(localStorage.getItem('tagconfig')||'[]')}
  }
  set(hierarchy) {
    hierarchy = hierarchy.filter(layer => layer.length > 0)
    localStorage.setItem('tagconfig', JSON.stringify(hierarchy))
    this.setState({hierarchy})
  }
  render() {
    var tags = Object.keys(this.props.index.tags)
    // filter unused tags
    var _hierarchy = this.state.hierarchy.map(layer => layer.filter(tag => tags.includes(tag)))
      .filter(layer => layer.length > 0)
    // one last empty layer
    _hierarchy.push([])
    var rest = tags.filter(tag => !_hierarchy.some(layer => layer.includes(tag)))
    var tagClass = tag => 'tag c' + (tag.length + tag.charCodeAt(0)) % 10
    var mobilize = tag => e('span', {className:tagClass(tag), draggable:true,
      onDragStart:e=>e.dataTransfer.setData("id",tag)}, tag)

    return e('div', {className:'tagconfig'},
      ..._hierarchy.map(layer =>
        e('div', {
          onDragOver: e => e.preventDefault() /*needed for onDrop to fire*/,
          onDrop: ({dataTransfer}) => {
            var tag = dataTransfer.getData('id')
            if(tag) {
              var hierarchy = this.state.hierarchy
              var src = hierarchy.find(_layer => _layer.includes(tag))
              var dst = hierarchy.find(_layer => _layer.includes(layer[0]))
              if(src) src.splice(src.indexOf(tag),1)
              if(!dst) hierarchy.push(dst = [])
              dst.push(tag)
              this.set(hierarchy)
            }
          }
        }, ...layer.map(mobilize))
      ), e('div', {
        onDragOver: e => e.preventDefault() /*needed for onDrop to fire*/,
        onDrop: ({dataTransfer}) => {
          var tag = dataTransfer.getData('id')
          if(tag) {
            var hierarchy = this.state.hierarchy
            var src = hierarchy.find(_layer => _layer.includes(tag))
            if(src) src.splice(src.indexOf(tag),1)
            this.set(hierarchy)
          }
        }
      }, ...rest.map(mobilize))
    )
  }
}

module.exports = { List }