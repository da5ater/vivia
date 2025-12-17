import { ConversationsViewId } from "@/modules/dashboard/ui/views/ConversationsViewId";

interface PageProps {
  params: Promise<{
    conversationId: string; // Must match folder name casing
  }>;
}

const Page = async ({ params }: PageProps) => {
  // Await params to extract the ID
  const { conversationId } = await params;

  return <ConversationsViewId conversationId={conversationId as any} />;
};

export default Page;
