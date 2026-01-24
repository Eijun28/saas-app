import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [
    // Plugin pour scrollbar custom
    function ({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#d1b3d9 #f3f4f6',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '8px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: '#f3f4f6',
          borderRadius: '10px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: '#d1b3d9',
          borderRadius: '10px',
          '&:hover': {
            background: '#c19dcc',
          },
        },
      })
    },
  ],
}

export default config
