module.exports = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				'background': '#171a21',
				'foreground': '#c7d5e0',
				'background-lighter': "#1b2838",
				'secondary': "#2a475e",
				"primary": "#66c0f4"
			}
		},
		fontFamily: {
			"sans": ["Inter",'ui-sans-serif', 'system-ui', "sans-serif"]
		}
	},
	variants: {
		extend: {},
	},
	plugins: [require('@tailwindcss/forms')],
};
