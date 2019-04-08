// import React from 'react'
// // import { editor } from 'monaco-editor'
// // import colors from '../constants/colors'

// interface MonacoProps {
//   children?: React.ReactNode
//   language: string
//   readOnly: boolean
//   code: string
//   onValueChange?: (value: string) => void
//   editorCallback?: (editor: Editor, nodeId: string) => void
//   minimap?: boolean
//   debugInfo?: {}
// }
// interface Editor {
//   [key: string]: any
// }

// let instance = 0

// interface MonacoState {
//   language: string
//   readOnly: boolean
//   code: string
// }

// export default class MonacoEditor extends React.Component<MonacoProps, MonacoState> {
//   divEl: React.RefObject<HTMLDivElement> = React.createRef()
//   editorInstance: Editor | null = null
//   isRendered: boolean = false

//   constructor(props: MonacoProps) {
//     super(props)
//     const { code, language, readOnly } = props

//     this.state = {
//       code,
//       language,
//       readOnly,
//     }
//   }

//   initMonaco() {
//     // set unique instance id in DOM
//     if (this.divEl && this.divEl.current) {
//       this.divEl.current.setAttribute('id', `monaco${instance}`)
//     }

//     const { language, readOnly, code } = this.props

//     if (window && window.monaco) {
//       // @ts-ignore
//       window.monaco.editor.defineTheme('teleport', {
//         base: 'vs-dark', // can also be vs-dark or hc-black
//         inherit: true, // can also be false to completely replace the builtin rules
//         rules: [
//           { token: 'comment', foreground: 'ffa500', fontStyle: 'italic underline' },
//           { token: 'comment.js', foreground: '008800', fontStyle: 'bold' },
//           { token: 'comment.css', foreground: '0000ff' }, // will inherit fontStyle from `comment` above
//         ],
//       })

//       window.monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
//         enableSchemaRequest: true,
//         allowComments: false,
//         validate: true,
//       })

//       this.editorInstance = window.monaco.editor.create(
//         document.getElementById(`monaco${instance}`),
//         {
//           language,
//           readOnly,
//           value: code,
//           theme: 'teleport',
//           minimap: {
//             enabled: false,
//           },
//           fontFamily: 'Source Code Pro',
//           fontSize: '12px',
//           folding: false,
//           hideCursorInOverviewRuler: true,
//           highlightActiveIndentGuide: true,
//           fontWeight: 'lighter',
//           lineHeight: 20,
//           occurrencesHighlight: false,
//           overviewRulerBorder: false,
//           renderLineHighlight: 'all',
//           scrollBeyondLastLine: false,
//           scrollbar: {
//             // Subtle shadows to the left & top. Defaults to true.
//             useShadows: false,
//             // Render vertical arrows. Defaults to false.
//             verticalHasArrows: true,
//             // Render horizontal arrows. Defaults to false.
//             horizontalHasArrows: true,
//             // Render vertical scrollbar.
//             // Accepted values: 'auto', 'visible', 'hidden'.
//             // Defaults to 'auto'
//             vertical: 'hidden',
//             // Render horizontal scrollbar.
//             // Accepted values: 'auto', 'visible', 'hidden'.
//             // Defaults to 'auto'
//             horizontal: 'auto',
//             verticalScrollbarSize: 10,
//             horizontalScrollbarSize: 10,
//             arrowSize: 30,
//             handleMouseWheel: true,
//           },
//         },
//         [this.isRendered]
//       )

//       if (this.props.onValueChange) {
//         ;(this.editorInstance as Editor).onDidChangeModelContent(() => {
//           // @ts-ignore
//           this.props.onValueChange((this.editorInstance as Editor).getValue())
//         })
//       }

//       if (this.props.editorCallback) {
//         this.props.editorCallback(this.editorInstance as Editor, `monaco${instance}`)
//       }

//       instance = instance + 1
//     }
//   }

//   componentDidMount() {
//     const interval = setInterval(() => {
//       if (window.monaco) {
//         this.initMonaco()
//         clearInterval(interval)
//       }
//     }, 500)

//     this.isRendered = true
//   }

//   render() {
//     return (
//       <div ref={this.divEl} className="monaco">
//         <style jsx>{`
//           .monaco {
//             width: 100%;
//             height: 100%;
//           }
//         `}</style>
//       </div>
//     )
//   }
// }
