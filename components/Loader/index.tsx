import React from 'react'

const Loader: React.SFC = () => {
  return (
    <>
      <div className="lds-dual-ring" />
      <style jsx>
        {`
          .lds-dual-ring {
            display: block;
            width: 40px;
            height: 40px;
          }
          .lds-dual-ring:after {
            content: ' ';
            display: block;
            width: 30px;
            height: 30px;
            margin: 1px;
            border-radius: 50%;
            border: 5px solid var(--color-purple);
            border-color: var(--color-purple) transparent var(--color-purple) transparent;
            animation: lds-dual-ring 1.2s linear infinite;
          }
          @keyframes lds-dual-ring {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  )
}

export default Loader
