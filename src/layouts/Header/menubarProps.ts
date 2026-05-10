const items = [
  {
    label: 'Home',
    path: '/',
    routeName: 'Home',
  },
  {
    label: 'Products',
    path: '/products-display-body/product-list/all',
    routeName: 'product-list',
  },
]

const menubarDt = {
  root: {
    itemFocusBackground: 'intail',
  },
}

export const menubarProps = { model: items, dt: menubarDt }