import {
    HTML_SCRIPT,
    JAVASCRIPT_SCRIPT,
    NEXTJS_SCRIPT,
    REACT_SCRIPT,
    type IntegrationId,
} from "./constants";

export const createScript = (
    integrationId: IntegrationId,
    widgetSlug: string
) => {
    switch (integrationId) {
        case "html":
            return HTML_SCRIPT.replace(/{{WIDGET_SLUG}}/g, widgetSlug);

        case "react":
            return REACT_SCRIPT.replace(/{{WIDGET_SLUG}}/g, widgetSlug);

        case "nextjs":
            return NEXTJS_SCRIPT.replace(/{{WIDGET_SLUG}}/g, widgetSlug);

        case "javascript":
            return JAVASCRIPT_SCRIPT.replace(/{{WIDGET_SLUG}}/g, widgetSlug);

        default:
            return "";
    }
};