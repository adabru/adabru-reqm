React = require('react')
var {Requirement} = require('./mission')

class List extends React.Component {
  constructor() {
    super()
    this.state = {hierarchy:JSON.parse(localStorage.getItem('tagconfig')||'[]')}
  }
  render() {
    var setConfig = hierarchy => {
      hierarchy = hierarchy.filter(layer => layer.length > 0)
      localStorage.setItem('tagconfig', JSON.stringify(hierarchy))
      this.setState({hierarchy})
    }
    return e('div', null,
      e('p', {contentEditable:true,ref:this.props.refBind(this.props.reqset.get('detail').yText())}),
      e(TagConfig, Object.assign({setConfig}, this.props, this.state)),
      e(TreeView,  Object.assign({}, this.props, this.state))
    )
  }
}

class TagConfig extends React.Component {
  render() {
    var tags = Object.keys(this.props.index.tags)
    // filter unused tags
    var _hierarchy = this.props.hierarchy.map(layer => layer.filter(tag => tags.includes(tag)))
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
              var hierarchy = this.props.hierarchy
              var src = hierarchy.find(_layer => _layer.includes(tag))
              var dst = hierarchy.find(_layer => _layer.includes(layer[0]))
              if(src) src.splice(src.indexOf(tag),1)
              if(!dst) hierarchy.push(dst = [])
              dst.push(tag)
              this.props.setConfig(hierarchy)
            }
          }
        }, ...layer.map(mobilize))
      ), e('div', {
        onDragOver: e => e.preventDefault() /*needed for onDrop to fire*/,
        onDrop: ({dataTransfer}) => {
          var tag = dataTransfer.getData('id')
          if(tag) {
            var hierarchy = this.props.hierarchy
            var src = hierarchy.find(_layer => _layer.includes(tag))
            if(src) src.splice(src.indexOf(tag),1)
            this.props.setConfig(hierarchy)
          }
        }
      }, ...rest.map(mobilize))
    )
  }
}

class TreeView extends React.Component {
  render() {
    // filter unused tags
    var _hierarchy = this.props.hierarchy
      .map(layer => layer.filter(tag => this.props.index.tags[tag]))
      .filter(layer => layer.length > 0)
    var tagClass = tag => 'tag c' + (tag.length + tag.charCodeAt(0)) % 10
    var buildList = (hierarchy, reqset, className='treeitem') => e('div', {className}, ...
        hierarchy.length == 0 ? reqset.map(id => e(Requirement, Object.assign({id}, this.props)))
        : hierarchy[0].map(tag => e('div', null,
            e('span', {className:tagClass(tag)}, tag),
            buildList(hierarchy.slice(1), reqset.filter(reqId =>
              this.props._data.get('reqs').get(reqId).get('tags').toJs().includes(tag)))
          ))
      )
    return buildList(_hierarchy, this.props.reqset.get('reqs').toJs(), 'treeroot')
  }
}

module.exports = { List }