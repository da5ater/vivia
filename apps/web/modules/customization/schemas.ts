import z from "zod";

export const widgetSettingsSchema = z.object({
    greetMessage: z.string().min(1, "Greeting message is required").max(100, "Greeting message must be at most 100 characters long"),
    defaultSuggestions: z.object({
        suggestion1: z.string(),
        suggestion2: z.string(),
        suggestion3: z.string(),
    }),
    vapiSettings: z.object({
        assistantId: z.string().optional(),
        phoneNumber: z.string().optional(),
    }),
});