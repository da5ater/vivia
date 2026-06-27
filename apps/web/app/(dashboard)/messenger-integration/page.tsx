import { Metadata } from "next";
import { Protect } from "@clerk/nextjs";
import { MessengerIntegrationView } from "@/modules/messenger/ui/views/messenger-integration-view";
import { PremiumFeaturesOverlay } from "@/modules/billing/ui/components/premium-features-overlay";

export const metadata: Metadata = {
  title: "Messenger Integration | Vivia",
  description: "Configure your Facebook Messenger integration.",
};

const Page = () => {
  return (
    <Protect
      condition={(has) => has({ plan: "pro" })}
      fallback={
        <div className="relative h-full w-full">
          <div className="pointer-events-none select-none">
            <MessengerIntegrationView />
          </div>
          <PremiumFeaturesOverlay />
        </div>
      }
    >
      <MessengerIntegrationView />
    </Protect>
  );
};

export default Page;
