import React from 'react'

interface DropDownProps {
  list: string[]
  onChoose: (ev: { target: { value: string } }) => any
  value: string
}

const DropDown: React.SFC<DropDownProps> = (props) => {
  const { list } = props
  return (
    <div className="custom-dropdown">
      <select className="file-chooser" onChange={props.onChoose} value={props.value}>
        {list.map((option: any) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <style jsx>{`
        .custom-dropdown {
          position: relative;
          display: flex;
        }

        select {
          background-color: var(--main-bg-white);
          color: var(--color-purple);
          font-size: inherit;
          padding: 0.5em;
          padding-right: 2.5em;
          border: 0;
          margin: 0;
          border-radius: 3px;
          text-indent: 0.01px;
          text-overflow: '';
          -moz-appearance: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .custom-dropdown::before,
        .custom-dropdown::after {
          content: '';
          position: absolute;
          pointer-events: none;
        }
        .custom-dropdown::after {
          content: '▼';
          height: 1em;
          font-size: 0.625em;
          right: 1.2em;
          top: 50%;
          margin-top: -0.5em;
          color: rgba(0, 0, 0, 0.6);
        }

        custom-dropdown::before {
          width: 2em;
          right: 0;
          top: 0;
          bottom: 0;
          border-radius: 0 3px 3px 0;
          background-color: rgba(0, 0, 0, 0.2);
        }

        .custom-dropdown select[disabled] {
          color: rgba(0, 0, 0, 0.25);
        }

        .custom-dropdown select {
          outline: none;
        }

        .custom-dropdown select::-ms-expand {
          display: none;
        }
      `}</style>
    </div>
  )
}

export { DropDown }
