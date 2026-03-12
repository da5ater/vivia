import { ContactPanel } from "@/modules/dashboard/ui/components/contact-panel";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@workspace/ui/components/resizable";

export const ConversationIdLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
            <ResizablePanel className="h-full" defaultSize={60}>
                <div className="flex h-full flex-col flex-1">{children}</div>
            </ResizablePanel>
            <ResizableHandle className="hidden lg:block" />
            <ResizablePanel className="hidden lg:block"
                maxSize={40}
                defaultSize={40}
                minSize={20}>
                <ContactPanel />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};