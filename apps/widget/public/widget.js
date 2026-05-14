(function () {
  "use strict";

  const config = {
    WIDGET_URL: "https://vivia-widget.vercel.app",
    DEFAULT_POSITION: "bottom-right",
  };

  const chatBubbleIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>`;

  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;

  let iframe = null;
  let container = null;
  let button = null;
  let isOpen = false;
  let widgetSlug = null;
  let position = config.DEFAULT_POSITION;

  const currentScript = document.currentScript;
  if (currentScript) {
    widgetSlug = currentScript.getAttribute("data-widget-slug");
    position = currentScript.getAttribute("data-position") || config.DEFAULT_POSITION;
  } else {
    const scripts = document.querySelectorAll("script");
    const embedScript = Array.from(scripts).find((script) =>
      script.hasAttribute("data-widget-slug")
    );

    if (embedScript) {
      widgetSlug = embedScript.getAttribute("data-widget-slug");
      position = embedScript.getAttribute("data-position") || config.DEFAULT_POSITION;
    }
  }

  if (!widgetSlug) {
    console.error("Vivia Widget: data-widget-slug attribute is required");
    return;
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render);
    } else {
      render();
    }
  }

  function render() {
    button = document.createElement("button");
    button.id = "vivia-widget-button";
    button.innerHTML = chatBubbleIcon;
    button.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #09090b;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
    `;

    button.addEventListener("click", toggleWidget);
    button.addEventListener("mouseenter", () => {
      if (button) button.style.transform = "scale(1.08) translateY(-2px)";
    });
    button.addEventListener("mouseleave", () => {
      if (button) button.style.transform = "scale(1) translateY(0)";
    });

    document.body.appendChild(button);

    container = document.createElement("div");
    container.id = "vivia-widget-container";
    container.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 90px;
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 110px);
      z-index: 999998;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
      display: none;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transform-origin: ${position === "bottom-right" ? "bottom right" : "bottom left"};
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    iframe = document.createElement("iframe");
    iframe.src = buildWidgetUrl();
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
    iframe.allow = "microphone; clipboard-read; clipboard-write";

    container.appendChild(iframe);
    document.body.appendChild(container);
    window.addEventListener("message", handleMessage);
  }

  function buildWidgetUrl() {
    return `${config.WIDGET_URL}/${widgetSlug}`;
  }

  function handleMessage(event) {
    if (event.origin !== new URL(config.WIDGET_URL).origin) return;

    const { type, payload } = event.data;

    switch (type) {
      case "close":
        hide();
        break;
      case "resize":
        if (payload.height && container) {
          container.style.height = `${payload.height}px`;
        }
        break;
    }
  }

  function toggleWidget() {
    if (isOpen) {
      hide();
    } else {
      show();
    }
  }

  function show() {
    if (container && button) {
      isOpen = true;
      container.style.display = "block";
      setTimeout(() => {
        if (container) {
          container.style.opacity = "1";
          container.style.transform = "translateY(0) scale(1)";
        }
      }, 10);
      button.innerHTML = closeIcon;
    }
  }

  function hide() {
    if (container && button) {
      isOpen = false;
      container.style.opacity = "0";
      container.style.transform = "translateY(20px) scale(0.95)";
      setTimeout(() => {
        if (container) container.style.display = "none";
      }, 300);
      button.innerHTML = chatBubbleIcon;
      button.style.background = "#09090b";
    }
  }

  function destroy() {
    window.removeEventListener("message", handleMessage);
    if (container) {
      container.remove();
      container = null;
      iframe = null;
    }
    if (button) {
      button.remove();
      button = null;
    }
    isOpen = false;
  }

  function reinit(newConfig) {
    destroy();

    if (newConfig.widgetSlug) {
      widgetSlug = newConfig.widgetSlug;
    }
    if (newConfig.position) {
      position = newConfig.position;
    }

    init();
  }

  window.ViviaWidget = {
    init: reinit,
    show,
    hide,
    destroy,
  };

  init();
})();
