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

export const HTML_SCRIPT =
    '<script src="http://localhost:3000/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>';

export const REACT_SCRIPT =
    '<script src="http://localhost:3000/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>';

export const NEXTJS_SCRIPT =
    '<script src="http://localhost:3000/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>';

export const JAVASCRIPT_SCRIPT =
    '<script src="https://vivia-widget.vercel.app/widget.js" data-widget-slug="{{WIDGET_SLUG}}"></script>';