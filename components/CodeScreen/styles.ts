import css from 'styled-jsx/css'

export const customStyle: ReactModal.Styles = {
  overlay: {
    zIndex: 10,
  },
  content: {
    textAlign: 'center',
    color: '#000',
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    borderRadius: '4px',
    transform: 'translate(-50%, -50%)',
  },
}

export const styles = css`.main-content {
    display: flex;
    padding-top 20px;
    padding-bottom 20px;
    width: 100%;
    height: calc(100% - 65px);
    justify-content: space-around;
    box-sizing: border-box;
  }
  
  .editor {
    border-radius: 10px;
    width: 49%;
    background: var(--editor-bg-black);
    overflow: hidden;
    z-index: 3;
    padding: 5px;
    position: relative;
    margin-right: 5px;
    margin-left: 5px;
    min-height: 300px;
  }
  
  @media screen and (max-width: 762px){
    .main-content{
      padding: 20px 15px;
      display: grid;
      grid-template-rows: 1fr 1fr;
      grid-gap: 4%;
      justify-content: normal;
      overflow-y: scroll;
    }
    .editor{
      width: 95%;
      height: calc(100% - 30px);
    }
  }
  .editor-header {
    height: 30px;
    display: flex;
    flex-direction: row;
    border-bottom: solid 1px #cccccc20;
    padding: 10px 10px;
  }
  
  .code-wrapper {
    height: calc(100% - 30px);
    position: relative;
    overflow: auto;
    background: var(--editor-bg-black);
  }
  
  .preview-scroller-y {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background: var(--editor-bg-black);
  }
  
  .preview-scroller-x {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--editor-bg-black);
  }
  
  .preview-scroller-x::-webkit-scrollbar-corner,
  .preview-scroller-y::-webkit-scrollbar-corner {
    background: var(--editor-bg-black);
    height: 10px;
    width: 10px;
  }
  
  .preview-scroller-x::-webkit-scrollbar,
  .preview-scroller-y::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .preview-scroller-x::-webkit-scrollbar-thumb, .preview-scroller-y::-webkit-scrollbar-thumb {
    background: var(--editor-scrollbar-color);
    border-radius: 5px;
  }
  
  .code-wrapper .previewer {
    margin: 0;
    padding: 5px 0 0 10px;
  }
  
  .previewer-header {
    justify-content: space-between;
    align-items: center;
  }
  
  .previewer-header .code-wrapper {
    background-color: #2d2d2d;
  }
  
  .with-offset {
    padding-left: 50px;
  }
  
  .shareable-link {
    padding: 10px;
    background: rgba(200, 200, 200, 0.5);
    user-select: all;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: space-between;
    margin: 20px 0 0;
  }
  
  .modal-button {
    background: var(--color-purple);
    color: #fff;
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 4px;
    border: 0 none;
  }
  
  .close-button {
    background: rgb(55, 55, 62);
  }
  
  .share-button {
    color: var(--color-purple);
    padding: 6px;
    margin-left: 15px;
    background-color: #fff;
    font-size: 14px;
    border-radius: 4px;
    border: 0 none;
  }
  
  .copied-text {
    position: absolute;
    top: 0;
    width: 100%;
    left: 0;
    padding: 5px 0;
    background-color: var(--success-green);
    color: #fff;
    opacity: 0;
  }
  
  .fade-in {
    animation: fadeInOpacity 1 ease-in 0.35s forwards;
  }
  
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }`
