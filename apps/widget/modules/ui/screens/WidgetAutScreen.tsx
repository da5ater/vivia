"use client";

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
import { useAtomValue, useSetAtom } from "jotai";
import { useParams } from "next/navigation";

import {
  contactSessionIdAtom,
  conversationIdAtom,
  widgetScreenAtom,
  widgetSettingsAtom,
} from "@/modules/widget/atoms/widget-atoms";
import { formatViviaOrganizationName } from "@/modules/widget/lib/branding";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

export const WidgetAutScreen = () => {
  const createContactSession = useMutation(
    api.public.contact_sessions.createContactSession
  );

  // Get slug from the URL path, e.g. /vivia-ahmed -> slug = "vivia-ahmed".
  const params = useParams();
  const slug = params?.slug as string;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const setContactSessionId = useSetAtom(contactSessionIdAtom);
  const setConversationId = useSetAtom(conversationIdAtom);
  const setScreen = useSetAtom(widgetScreenAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const metadata = {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        source: window.location.href,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const contactSessionId = await createContactSession({
        name: values.name,
        email: values.email,
        slug,
        metadata,
      });

      console.log("Contact session created with ID:", contactSessionId);
      setContactSessionId(contactSessionId);
      setConversationId(null);
      setScreen("selection");
    } catch (error) {
      console.error("Error creating contact session:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-1 py-3 font-semibold">
          <p className="text-xl leading-tight">{formatViviaOrganizationName(widgetSettings?.organizationName)}</p>
          <p className="text-sm font-normal leading-5 opacity-90">
            Tell us a little about you so we can help better.
          </p>
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
                    placeholder="Your name"
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
                    placeholder="Your email"
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
            className="mt-auto w-full"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            Continue to support
          </Button>
        </form>
      </Form>
    </div>
  );
};
