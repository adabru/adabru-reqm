React = require('react')
ReactDOM = require('react-dom')
e = React.createElement

class App extends React.Component {
  constructor() {
    super()
    this.state = {i:4}
  }
  render() {
    return e('h1', null, 'requirements')
  }
}

ReactDOM.render(e(App), document.getElementById("app"))
