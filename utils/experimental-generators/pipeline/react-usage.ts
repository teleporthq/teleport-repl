import ComponentAsemblyLine from './index'

import {
  reactJSXPlugin,
  reactInlineStyleComponentPlugin,
  reactPureComponentPlugin,
  reactBasicLinker,
  prettierPostPlugin,
} from './plugins/react'

const asemblyLine = new ComponentAsemblyLine([
  reactJSXPlugin,
  reactInlineStyleComponentPlugin,
  reactPureComponentPlugin,
  reactBasicLinker,
  prettierPostPlugin,
])

asemblyLine.run({
  name: 'TestComponent',
  content: {
    type: 'View',
    source: 'teleport-elements-core',
    name: 'View',
    style: {
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      backgroundColor: 'magenta',
    },
    children: [
      {
        type: 'Text',
        source: 'teleport-elements-core',
        name: 'Text',
        style: {
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          backgroundColor: 'pink',
        },
      },
    ],
  },
})
