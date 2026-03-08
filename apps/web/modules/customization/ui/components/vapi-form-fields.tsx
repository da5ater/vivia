"use client";

import { UseFormReturn } from "react-hook-form";
import type { FormSchema } from "../../types";

import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@workspace/ui/components/form";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";

import { useVapiAssistants, useVapiPhoneNumbers } from "@/modules/Plugins/hooks/use-vapi-data";
import { Loader2Icon, BotIcon, PhoneIcon } from "lucide-react";

interface VapiFormFieldsProps {
    form: UseFormReturn<FormSchema>;
}

export const VapiFormFields = ({ form }: VapiFormFieldsProps) => {
    const { data: assistants, isLoading: assistantsLoading } = useVapiAssistants();
    const { data: phoneNumbers, isLoading: phoneNumbersLoading } = useVapiPhoneNumbers();

    const disabled = form.formState.isSubmitting;

    const assistantsEmpty = !assistantsLoading && (!assistants || assistants.length === 0);
    const phoneNumbersEmpty = !phoneNumbersLoading && (!phoneNumbers || phoneNumbers.length === 0);

    return (
        <div className="space-y-6">
            {/* Assistant */}
            <FormField
                control={form.control}
                name="vapiSettings.assistantId"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                            <BotIcon className="h-4 w-4 text-muted-foreground" />
                            Assistant
                        </FormLabel>

                        <FormControl>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={disabled || assistantsLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            assistantsLoading ? "Loading assistants…" : "Choose an assistant"
                                        }
                                    />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>

                                    {assistants?.map((assistant) => {
                                        const name = assistant.name?.trim() || "Unnamed assistant";
                                        const model = assistant.model?.model?.trim() || "Unknown model";
                                        return (
                                            <SelectItem key={assistant.id} value={assistant.id}>
                                                {name} • {model}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </FormControl>

                        <FormDescription>
                            This assistant will answer calls and handle voice conversations.
                        </FormDescription>

                        {assistantsLoading && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                Fetching assistants from Vapi…
                            </p>
                        )}

                        {assistantsEmpty && (
                            <p className="text-xs text-muted-foreground">
                                No assistants found. Create one in Vapi, then refresh this page.
                            </p>
                        )}

                        <FormMessage />
                    </FormItem>
                )}
            />

            <Separator />

            {/* Phone Number */}
            <FormField
                control={form.control}
                name="vapiSettings.phoneNumber"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                            Phone number
                        </FormLabel>

                        <FormControl>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={disabled || phoneNumbersLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            phoneNumbersLoading ? "Loading numbers…" : "Choose a phone number"
                                        }
                                    />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>

                                    {phoneNumbers?.map((phoneNumber) => {
                                        const number = phoneNumber.number?.trim();
                                        if (!number) return null; // Only allow valid numbers to be saved
                                        const label = phoneNumber.name?.trim() || "No label";
                                        return (
                                            <SelectItem key={phoneNumber.id} value={number}>
                                                {number} • {label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </FormControl>

                        <FormDescription>
                            This is the number customers will call to reach your assistant.
                        </FormDescription>

                        {phoneNumbersLoading && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                Fetching phone numbers from Vapi…
                            </p>
                        )}

                        {phoneNumbersEmpty && (
                            <p className="text-xs text-muted-foreground">
                                No phone numbers found. Add a number in Vapi, then refresh this page.
                            </p>
                        )}

                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};