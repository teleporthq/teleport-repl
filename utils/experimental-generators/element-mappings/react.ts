export default {
  Group: {
    name: 'Fragment',
    dependency: {
      type: 'library',
      meta: {
        path: 'react',
        namedImport: true,
      },
    },
  },
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
