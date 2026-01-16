import React from "react";
import Splash from "@/components/Splash";
import { useUser } from "@/contexts/UserContext";

// App configuration
const APP_NAME = "Into the Void";

export const getServerSideProps = async () => {
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
      },
    },
  };
};

const PlayPage: React.FC = () => {
  const { user, isLoading } = useUser();

  // Show splash screen - handles auth and redirects to dashboard
  return <Splash user={user} isLoading={isLoading} appName={APP_NAME} />;
};

export default PlayPage;
