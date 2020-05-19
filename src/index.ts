import * as React from 'elm-ts/lib/React'
import { render } from 'react-dom'
import { init, update, view } from './App'

const program = React.program 

const main = program(init, update, view)

React.run(main, dom => render(dom, document.getElementsByClassName('todoapp')[0]))