import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Intercept console.error assignment so our filter wraps whatever Next.js installs */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              function isAnalyticsNoise(args) {
                if (typeof args[0] === 'string' && args[0].indexOf('Analytics SDK') !== -1) return true;
                for (var i = 0; i < args.length; i++) {
                  if (args[i] && args[i].context === 'AnalyticsSDKApiError') return true;
                }
                return false;
              }
              var _current = console.error;
              Object.defineProperty(console, 'error', {
                configurable: true,
                get: function() { return _current; },
                set: function(fn) {
                  _current = function() {
                    if (!isAnalyticsNoise(arguments)) fn.apply(console, arguments);
                  };
                }
              });
            })();
          ` }} />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Fredoka:wght@400;500;600;700&family=Permanent+Marker&family=Caveat:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <meta name="base:app_id" content="69979231a243966eadb385f8" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
