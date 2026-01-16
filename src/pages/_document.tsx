import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
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
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.builddetroit.xyz';
    
    return (
      <Html lang="en" style={{ colorScheme: 'dark' }}>
        <Head>
          {/* Into the Void - Dark Theme */}
          <meta name="theme-color" content="#0B0B0D" />
          <meta name="color-scheme" content="dark" />
          <meta name="msapplication-TileColor" content="#0B0B0D" />
          
          {/* Typography */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" href="/favicon.ico" />
          
          {/* App Identification */}
          <meta name="application-name" content="Renaissance City" />
          <meta name="apple-mobile-web-app-title" content="Renaissance City" />
          
          {/* Open Graph / Social Media Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Renaissance City" />
          <meta property="og:image" content={`${appUrl}/thumbnail.jpg`} />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Renaissance City" />
          <meta name="twitter:description" content="Detroit's Digital Renaissance" />
          <meta name="twitter:image" content={`${appUrl}/thumbnail.jpg`} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
