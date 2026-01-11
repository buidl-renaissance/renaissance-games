import React, { useEffect } from "react";
import Splash from "@/components/Splash";
import { useUser } from "@/contexts/UserContext";

// App configuration
const APP_NAME = "Into the Void";

export const getServerSideProps = async () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.builddetroit.xyz';
  
  return {
    props: {
      metadata: {
        title: `Play | ${APP_NAME}`,
        description: `Enter ${APP_NAME} - In-person tournaments. Real stakes.`,
        openGraph: {
          title: `Play | ${APP_NAME}`,
          description: `Enter ${APP_NAME} - In-person tournaments. Real stakes.`,
          images: [
            {
              url: "/thumbnail.jpg",
              width: 1200,
              height: 630,
              alt: APP_NAME,
            },
          ],
        },
        additionalMetaTags: [
          {
            name: 'fc:meta',
            content: JSON.stringify({
              slug: 'renaissance-city',
              title: APP_NAME,
              icon: `${appUrl}/thumbnail.jpg`,
            }),
          },
          {
            name: 'fc:miniapp',
            content: JSON.stringify({
              version: '1',
              imageUrl: `${appUrl}/thumbnail.jpg`,
              button: {
                title: `Enter ${APP_NAME}`,
                action: {
                  type: 'launch_frame',
                  name: APP_NAME,
                  url: appUrl,
                  splashImageUrl: `${appUrl}/splash.png`,
                  splashBackgroundColor: '#0B0B0D',
                },
              },
            }),
          },
          {
            rel: 'alternate',
            type: 'application/json',
            href: `${appUrl}/.well-known/farcaster.json`,
          },
        ],
      },
    },
  };
};

const PlayPage: React.FC = () => {
  const { user, isLoading } = useUser();

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    const callReady = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        
        if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
          console.log('✅ [Play] Calling sdk.actions.ready()');
          await sdk.actions.ready();
          console.log('✅ [Play] Successfully called ready()');
        }
      } catch (error) {
        console.error('❌ [Play] Error calling sdk.actions.ready():', error);
      }
    };

    callReady();
  }, []);

  // Show splash screen - handles auth and redirects to dashboard
  return <Splash user={user} isLoading={isLoading} appName={APP_NAME} />;
};

export default PlayPage;
