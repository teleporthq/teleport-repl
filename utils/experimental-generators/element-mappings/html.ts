export default {
  View: {
    name: 'div',
  },
  Text: {
    name: 'span',
  },
  Image: {
    name: 'img',
    attrs: {
      src: '$attrs.url',
    },
  },
  TextInput: {
    name: 'input',
    attrs: {
      type: 'text',
    },
  },
  Link: {
    name: 'a',
  },
}
