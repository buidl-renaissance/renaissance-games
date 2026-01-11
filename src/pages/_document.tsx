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
          
          {/* Farcaster Mini App Identification */}
          <meta name="application-name" content="Renaissance City" />
          <meta name="apple-mobile-web-app-title" content="Renaissance City" />
          <link rel="manifest" href={`${appUrl}/.well-known/farcaster.json`} />
          
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
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Early SDK detection - runs before React loads
                // Supports multiple SDK injection methods per Farcaster Mini App spec
                (function() {
                  console.log('🔍 Early SDK detection starting...');
                  
                  // Store SDK reference globally for React to access
                  window.__FARCASTER_SDK__ = null;
                  window.__FARCASTER_USER__ = null;
                  
                  // Helper to check if a user is valid (handles both Farcaster and Renaissance accounts)
                  function isValidUser(user) {
                    if (!user) return false;
                    var fid = typeof user.fid === 'string' ? parseInt(user.fid, 10) : user.fid;
                    // Valid if has any non-zero fid OR has renaissanceUserId OR has a username
                    return fid !== 0 || !!user.renaissanceUserId || !!user.username;
                  }
                  
                  async function checkForSDK() {
                    var win = window;
                    
                    // Method 1: Check window.farcaster (RPC method)
                    if (win.farcaster) {
                      console.log('✅ Found window.farcaster');
                      window.__FARCASTER_SDK__ = win.farcaster;
                      
                      if (win.farcaster.context) {
                        try {
                          var context = await win.farcaster.context;
                          if (context && context.user && isValidUser(context.user)) {
                            window.__FARCASTER_USER__ = context.user;
                            console.log('✅ User found via window.farcaster.context:', context.user);
                            window.dispatchEvent(new CustomEvent('farcaster:user', { detail: context.user }));
                          }
                        } catch (e) {
                          console.log('⚠️ Error accessing farcaster.context:', e);
                        }
                      }
                    }
                    
                    // Method 2: Check window.__renaissanceAuthContext (direct access)
                    if (win.__renaissanceAuthContext) {
                      console.log('✅ Found window.__renaissanceAuthContext');
                      var context = win.__renaissanceAuthContext;
                      if (context && context.user && isValidUser(context.user)) {
                        window.__FARCASTER_USER__ = context.user;
                        console.log('✅ User found via __renaissanceAuthContext:', context.user);
                        window.dispatchEvent(new CustomEvent('farcaster:user', { detail: context.user }));
                      }
                    }
                    
                    // Method 3: Check window.getRenaissanceAuth() function
                    if (typeof win.getRenaissanceAuth === 'function') {
                      console.log('✅ Found window.getRenaissanceAuth()');
                      try {
                        var context = win.getRenaissanceAuth();
                        if (context && context.user && isValidUser(context.user)) {
                          window.__FARCASTER_USER__ = context.user;
                          console.log('✅ User found via getRenaissanceAuth():', context.user);
                          window.dispatchEvent(new CustomEvent('farcaster:user', { detail: context.user }));
                        }
                      } catch (e) {
                        console.log('⚠️ Error calling getRenaissanceAuth():', e);
                      }
                    }
                    
                    // Fallback: Check other SDK locations
                    var sdk = win.FarcasterSDK || win.sdk;
                    if (sdk) {
                      console.log('✅ Found SDK in fallback location');
                      window.__FARCASTER_SDK__ = sdk;
                      
                      // Try to get user immediately
                      if (sdk.context && sdk.context.user && isValidUser(sdk.context.user)) {
                        window.__FARCASTER_USER__ = sdk.context.user;
                        console.log('✅ User found in fallback SDK:', sdk.context.user);
                        window.dispatchEvent(new CustomEvent('farcaster:user', { detail: sdk.context.user }));
                      }
                    }
                  }
                  
                  // Check immediately
                  checkForSDK();
                  
                  // Check after DOM loads
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      checkForSDK();
                    });
                  }
                  
                  // Check after window loads
                  window.addEventListener('load', function() {
                    checkForSDK();
                  });
                  
                  // Listen for farcaster:context:ready event
                  window.addEventListener('farcaster:context:ready', function(event) {
                    console.log('📨 Received farcaster:context:ready event:', event);
                    var detail = event.detail;
                    if (detail && detail.user && isValidUser(detail.user)) {
                      window.__FARCASTER_USER__ = detail.user;
                      console.log('✅ User found via farcaster:context:ready event:', detail.user);
                      window.dispatchEvent(new CustomEvent('farcaster:user', { detail: detail.user }));
                    }
                  });
                  
                  // Poll periodically - iOS app may inject SDK after page load
                  var pollCount = 0;
                  var pollInterval = setInterval(function() {
                    pollCount++;
                    checkForSDK(); // Always check, even if SDK was found (context might update)
                    
                    // Keep polling for up to 10 seconds (20 checks at 500ms intervals)
                    if (pollCount > 20) {
                      clearInterval(pollInterval);
                      console.log('⏱️ Early detection polling complete');
                    }
                  }, 500);
                  
                  // Also listen for postMessage from iOS app
                  window.addEventListener('message', function(event) {
                    console.log('📨 Received postMessage in early detection:', event.data);
                    try {
                      var messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                      
                      // Check for various message formats
                      if (messageData) {
                        // Format 1: { type: 'farcaster', user: {...} }
                        if (messageData.type === 'farcaster' && messageData.user && isValidUser(messageData.user)) {
                          window.__FARCASTER_USER__ = messageData.user;
                          console.log('✅ User received via postMessage (format 1):', messageData.user);
                          window.dispatchEvent(new CustomEvent('farcaster:user', { detail: messageData.user }));
                          return;
                        }
                        
                        // Format 2: { user: {...} } (direct user object)
                        if (messageData.user && isValidUser(messageData.user)) {
                          window.__FARCASTER_USER__ = messageData.user;
                          console.log('✅ User received via postMessage (format 2):', messageData.user);
                          window.dispatchEvent(new CustomEvent('farcaster:user', { detail: messageData.user }));
                          return;
                        }
                        
                        // Format 3: Direct user object with fid
                        if (messageData.fid !== undefined && !messageData.type && isValidUser(messageData)) {
                          window.__FARCASTER_USER__ = messageData;
                          console.log('✅ User received via postMessage (format 3):', messageData);
                          window.dispatchEvent(new CustomEvent('farcaster:user', { detail: messageData }));
                          return;
                        }
                      }
                    } catch (e) {
                      // Not JSON or not user data
                    }
                  });
                  
                  // Try to call ready() early if we're on the frames page or index page
                  async function tryCallReady() {
                    try {
                      var win = window;
                      
                      if (win.farcaster) {
                        try {
                          var result = await win.farcaster.actions?.ready?.();
                          console.log('✅ [Early] Called window.farcaster.actions.ready() via optional chaining');
                          window.__FARCASTER_READY_CALLED__ = true;
                          return;
                        } catch (e1) {
                          try {
                            var actions = win.farcaster.actions;
                            if (actions) {
                              await actions.ready();
                              console.log('✅ [Early] Called actions.ready() via property access');
                              window.__FARCASTER_READY_CALLED__ = true;
                              return;
                            }
                          } catch (e2) {
                            try {
                              if (typeof win.farcaster.then === 'function') {
                                var sdk = await win.farcaster;
                                await sdk.actions.ready();
                                console.log('✅ [Early] Called sdk.actions.ready() from promise');
                                window.__FARCASTER_READY_CALLED__ = true;
                                return;
                              }
                            } catch (e3) {
                              try {
                                await win.farcaster.actions.ready();
                                console.log('✅ [Early] Called ready() directly without checks');
                                window.__FARCASTER_READY_CALLED__ = true;
                                return;
                              } catch (e4) {
                                console.log('⚠️ [Early] All ready() methods failed');
                              }
                            }
                          }
                        }
                      }
                    } catch (e) {
                      console.log('⚠️ [Early] Error in tryCallReady():', e);
                    }
                  }
                  
                  // Try calling ready() after a delay
                  var pathname = window.location.pathname;
                  if (pathname === '/' || pathname === '/dashboard' || pathname.includes('/dashboard')) {
                    setTimeout(tryCallReady, 100);
                    setTimeout(tryCallReady, 500);
                    setTimeout(tryCallReady, 1000);
                  }
                })();
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
