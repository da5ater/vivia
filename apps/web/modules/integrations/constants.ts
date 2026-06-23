export const INTEGRATIONS = [
    {
        id: "html",
        title: "HTML",
        icon: "/languages/html5.svg",
    },
    {
        id: "react",
        title: "React",
        icon: "/languages/react.svg",
    },
    {
        id: "nextjs",
        title: "Next.js",
        icon: "/languages/nextjs.svg",
    },
    {
        id: "javascript",
        title: "JavaScript",
        icon: "/languages/javascript.svg",
    },
] as const;

export type IntegrationId = (typeof INTEGRATIONS)[number]["id"];

const WIDGET_URL = process.env.NEXT_PUBLIC_WIDGET_URL || "https://vivia-widget.vercel.app";

export const HTML_SCRIPT =
    `<script src="${WIDGET_URL}/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>`;

export const REACT_SCRIPT =
    `<script src="${WIDGET_URL}/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>`;

export const NEXTJS_SCRIPT =
    `<script src="${WIDGET_URL}/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>`;

export const JAVASCRIPT_SCRIPT =
    `<script src="${WIDGET_URL}/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>`;
