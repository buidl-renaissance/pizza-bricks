import "@/styles/globals.css";
import '@coinbase/onchainkit/styles.css';
import type { AppProps } from "next/app";
import { StyleSheetManager } from "styled-components";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { GlobalStyle } from "@/styles/globalStyles";
import { Analytics } from "@vercel/analytics/react";
import { OnchainProviders } from "@/providers/OnchainProviders";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <UserProvider>
        <OnchainProviders>
          <StyleSheetManager shouldForwardProp={(prop) => !prop.startsWith('$')}>
            <GlobalStyle />
            <Component {...pageProps} />
            <Analytics />
          </StyleSheetManager>
        </OnchainProviders>
      </UserProvider>
    </ThemeProvider>
  );
}
