import "./configs/tw-css-plugin"

import path from "node:path"

import { getIconCollections, iconsPlugin } from "@egoist/tailwindcss-icons"
import { cleanupSVG, importDirectorySync, isEmptyColor, parseColors, runSVGO } from "@iconify/tools"
import { compareColors, stringToColor } from "@iconify/utils/lib/colors"
import plugin from "tailwindcss/plugin"
import resolveConfig from "tailwindcss/resolveConfig"

/** @type {import('tailwindcss').Config} */
export default resolveConfig({
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./apps/renderer/**/*.{ts,tsx}", "./apps/web/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      fontFamily: {
        theme: "var(--fo-font-family)",
        default: "SN pro, sans-serif, system-ui",
      },
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",

        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: "hsl(var(--fo-a) / <alpha-value>)",

        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        native: {
          DEFAULT: "hsl(var(--fo-native) / <alpha-value>)",
          active: "hsl(var(--fo-native-active) / <alpha-value>)",
        },

        theme: {
          // https://uicolors.app/create
          accent: {
            DEFAULT: "hsl(var(--fo-a) / <alpha-value>)",
            50: "#fff7ec",
            100: "#ffeed3",
            200: "#ffd9a5",
            300: "#ffbd6d",
            400: "#ff9532",
            500: "#ff760a",
            600: "#ff5c00",
            700: "#cc4102",
            800: "#a1330b",
            900: "#822c0c",
            950: "#461304",
          },

          vibrancyFg: "hsl(var(--fo-vibrancy-foreground) / <alpha-value>)",
          vibrancyBg: "var(--fo-vibrancy-background)",

          item: {
            active: "var(--fo-item-active)",
            hover: "var(--fo-item-hover)",
          },

          inactive: "hsl(var(--fo-inactive) / <alpha-value>)",
          disabled: "hsl(var(--fo-disabled) / <alpha-value>)",

          foreground: "hsl(var(--fo-text-primary) / <alpha-value>)",
          background: "var(--fo-background)",

          "foreground-hover": "hsl(var(--fo-text-primary-hover) / <alpha-value>)",

          modal: {
            background: "var(--fo-modal-background)",
            "background-opaque": "var(--fo-modal-background-opaque)",
          },
          button: {
            hover: "var(--fo-button-hover)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      typography: (theme) => ({
        zinc: {
          css: {
            "--tw-prose-body": theme("colors.zinc.500"),
            "--tw-prose-quotes": theme("colors.zinc.500"),
          },
        },
      }),
    },
  },

  plugins: [
    iconsPlugin({
      collections: {
        ...getIconCollections(["mingcute", "simple-icons", "logos"]),
        mgc: getCollections(path.resolve(__dirname, "./icons/mgc")),
      },
    }),
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/typography"),
    require("./apps/renderer/src/styles/tailwind-extend.css"),
    plugin(({ addVariant }) => {
      addVariant("f-motion-reduce", '[data-motion-reduce="true"] &')
      addVariant("group-motion-reduce", ':merge(.group)[data-motion-reduce="true"] &')
      addVariant("peer-motion-reduce", ':merge(.peer)[data-motion-reduce="true"] ~ &')
    }),
  ],
})

function getCollections(dir: string) {
  // Import icons
  const iconSet = importDirectorySync(dir, {
    includeSubDirs: false,
  })

  // Validate, clean up, fix palette and optimism
  iconSet.forEachSync((name, type) => {
    if (type !== "icon") {
      return
    }

    const svg = iconSet.toSVG(name)
    if (!svg) {
      // Invalid icon
      iconSet.remove(name)
      return
    }

    // Clean up and optimize icons
    try {
      // Clean up icon code
      cleanupSVG(svg)

      // Change color to `currentColor`
      // Skip this step if icon has hardcoded palette
      const blackColor = stringToColor("black")!
      const whiteColor = stringToColor("white")!
      parseColors(svg, {
        defaultColor: "currentColor",
        callback: (attr, colorStr, color) => {
          if (!color) {
            // Color cannot be parsed!
            throw new Error(`Invalid color: "${colorStr}" in attribute ${attr}`)
          }

          if (isEmptyColor(color)) {
            // Color is empty: 'none' or 'transparent'. Return as is
            return color
          }

          // Change black to 'currentColor'
          if (compareColors(color, blackColor)) {
            return "currentColor"
          }

          // Remove shapes with white color
          if (compareColors(color, whiteColor)) {
            return "remove"
          }

          // NOTE: MGC icons has default color of #10161F
          if (compareColors(color, stringToColor("#10161F")!)) {
            return "currentColor"
          }

          // Icon is not monotone
          return color
        },
      })

      runSVGO(svg)
    } catch (err) {
      // Invalid icon
      console.error(`Error parsing ${name}:`, err)
      iconSet.remove(name)
      return
    }

    // Update icon
    iconSet.fromSVG(name, svg)
  })

  // Export
  return iconSet.export()
}
