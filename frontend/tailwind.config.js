import daisyui from "daisyui";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        "coreflow-dark": {
          "primary": "#FF007F", // Neon Pink
          "secondary": "#1F2937",
          "accent": "#FF007F", // Neon Pink
          "neutral": "#374151",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
          
          "--rounded-box": "0.2rem", // rounded-sm
          "--rounded-btn": "0.2rem", 
          "--rounded-badge": "0.2rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
        },
      },
      "dark",
    ],
  },
};
