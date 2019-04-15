import React from 'react'

interface TabsProps {
  onChoose: (selected: string) => any
  selected: string
  options: string[]
}

const Tabs: React.SFC<TabsProps> = (props) => {
  const { selected, options, onChoose } = props
  return (
    <>
      <ul className="header-list">
        {options.map((item) => (
          <li
            key={item}
            value={item}
            className={item === selected ? 'selected' : ''}
            onClick={() => {
              onChoose(item)
            }}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </li>
        ))}
      </ul>
      <style jsx>
        {`
          .header-list {
            align-items: center;
            display: flex;
            list-style-type: none;
            color: #ccc;
            padding: 0;
          }

          .header-list > li {
            padding: 5px 10px;
            margin-right: 3px;
          }

          .header-list > li.selected {
            background-color: var(--main-bg-white);
            color: var(--color-purple);
            cursor: default;
            border-radius: 3px;
          }

          .header-list {
            cursor: pointer;
          }
        `}
      </style>
    </>
  )
}

export { Tabs }
