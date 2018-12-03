export default {
  View: {
    name: 'div',
  },
  Group: {
    name: 'div',
  },
  Text: {
    name: 'span',
  },
  PageHeading: {
    name: 'h1',
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
