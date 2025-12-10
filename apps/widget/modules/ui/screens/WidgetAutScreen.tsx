import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";

import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { useSetAtom } from "jotai";

import {
  contactSessionIdAtom,
  widgetScreenAtom,
} from "@/modules/widget/atoms/widget-atoms";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

export const WidgetAutScreen = () => {
  const createContactSession = useMutation(
    api.public.contact_sessions.createContactSession
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });
  const setContactSessionId = useSetAtom(contactSessionIdAtom);
  const setScreen = useSetAtom(widgetScreenAtom);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const metadata = {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        source: window.location.href,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
      };

      const contactSessionId = await createContactSession({
        name: values.name,
        email: values.email,
        metadata,
      });
      console.log("Contact session created with ID:", contactSessionId);
      // You can add further actions here, like showing a success message
      setContactSessionId(contactSessionId);
      setScreen("selection");
    } catch (error) {
      console.error("Error creating contact session:", error);
      // Handle error, e.g., show an error message to the user
    }
  };

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">we are here to help you</p>
          <p className="text-lg">lets get started</p>
        </div>
      </WidgetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-y-4 p-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Your Name"
                    type="text"
                    className="h-10 bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Your Email"
                    type="email"
                    className="h-10 bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-auto w-50 self-center"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            Start Chat
          </Button>
        </form>
      </Form>
    </div>
  );
};
