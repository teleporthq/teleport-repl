import React from 'react'

interface GeneratorTargetsChooserProps {
  onChoose: (ev: {target: {value: string}}) => any;
  value: string;
}

const GeneratorTargetsChooser: React.SFC<GeneratorTargetsChooserProps> = props => {
  return (
    <select onChange={props.onChoose} value={props.value}>
      <option value='react'>React</option>
      <option value='vue'>Vue</option>
      <option value='angular'>Angular</option>
      <option value='html'>Html</option>
    </select>
  )
}

export { GeneratorTargetsChooser }