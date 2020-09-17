module.exports = {
  purge: [],
  theme: {
    extend: {
      fontFamily: {
        quantico: ['Quantico', 'sans-serif']
      },
      width: {
        7: '1.75rem'
      },
      height: {
        7: '1.75rem'
      }
    },
    screens: {
      sm: '640px',
      // => @media (min-width: 640px) { ... }

      md: '768px',
      // => @media (min-width: 768px) { ... }

      lg: '1110px',
      // => @media (min-width: 1024px) { ... }

      xl: '1280px',
      // => @media (min-width: 1280px) { ... }
    }
  },
  variants: {},
  plugins: [],
};
