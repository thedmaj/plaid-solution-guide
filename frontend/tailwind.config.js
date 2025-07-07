/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'plaid-blue': {
          50: '#e6f2f8',
          100: '#cce6f1',
          200: '#99cce3',
          300: '#66b3d5',
          400: '#3399c7',
          500: '#07578d',
          600: '#064f7f',
          700: '#054670',
          800: '#043e62',
          900: '#033554',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            h1: {
              fontWeight: '700',
            },
            h2: {
              fontWeight: '600',
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: '#1F2937',
              backgroundColor: '#F3F4F6',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            a: {
              color: '#07578d',
              textDecoration: 'none',
              '&:hover': {
                color: '#054670',
                textDecoration: 'underline',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
