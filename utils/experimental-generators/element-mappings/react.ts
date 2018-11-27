export default {
  Link: {
    name: 'Link',
    attrs: {
      href: '$attrs.url',
      target: '_blank',
      rel: 'nofollow noreferrer',
    },
    dependency: {
      type: 'library',
      meta: {
        path: 'react-router',
        namedImport: true,
      },
    },
  },
}
