import React from 'react'

interface GeneratorTargetsChooserProps {
  onChoose: (ev: { target: { value: string } }) => any
  value: string
  options: string[]
}

const JsonInputChooser: React.SFC<GeneratorTargetsChooserProps> = (props) => {
  return (
    <select onChange={props.onChoose} value={props.value}>
      {props.options.map((option) => (
        <option value={option}>{option}</option>
      ))}
    </select>
  )
}

export { JsonInputChooser }
