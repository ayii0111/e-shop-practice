const items = [
  {
    label: 'Home',
    path: '/',
    routeName: 'Home',
  },
  {
    label: 'Products',
    path: '/productCategory/ProductList/all',
    routeName: 'ProductList',
  },
]

const menubarDt = {
  root: {
    itemFocusBackground: 'intail',
  },
}

export const menubarProps = { model: items, dt: menubarDt }