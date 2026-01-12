import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        // This tells Tailwind to look in the 'app' and 'components' folders at the root
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                editor: {
                    bg: "#1e1e1e",
                    sidebar: "#252526",
                    active: "#37373d",
                }
            },
        },
    },
    plugins: [],
};
export default config;