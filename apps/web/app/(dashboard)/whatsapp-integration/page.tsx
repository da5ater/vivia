import { Protect } from "@clerk/nextjs";
import { WhatsAppIntegrationView } from "@/modules/whatsapp/ui/views/whatsapp-integration-view";
import { PremiumFeaturesOverlay } from "@/modules/billing/ui/components/premium-features-overlay";

const Page = () => {
  return (
    <Protect
      condition={(has) => has({ plan: "pro" })}
      fallback={
        <div className="relative h-full w-full">
          <div className="pointer-events-none select-none">
            <WhatsAppIntegrationView />
          </div>
          <PremiumFeaturesOverlay />
        </div>
      }
    >
      <WhatsAppIntegrationView />
    </Protect>
  );
};

export default Page;
