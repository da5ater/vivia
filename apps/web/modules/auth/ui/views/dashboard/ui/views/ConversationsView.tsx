import Image from "next/image";

export const ConversationsView = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted">
      <Image src="/vivia-logo.png" alt="Logo" width={40} height={40} />
      <p className="text-lg font-semibold">Select a conversation</p>
    </div>
  );
};
