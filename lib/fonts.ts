import { Montserrat, Source_Serif_4 } from "next/font/google";

// Self-hosted at build time by next/font: no request to Google from the reader's browser.
const display = Montserrat({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-display" });
const serif = Source_Serif_4({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });

/**
 * Classes for the root element of public pages: Montserrat for the site's chrome (header,
 * navigation, labels) and Source Serif for titles and reading text. The admin keeps system fonts.
 */
export const siteFonts = `${display.variable} ${serif.variable} font-display`;
