import { EMBED_CONFIG } from './config';
import { chatBubbleIcon, closeIcon } from './icons';

(function () {
    let iframe: HTMLIFrameElement | null = null;
    let container: HTMLDivElement | null = null;
    let button: HTMLButtonElement | null = null;
    let isOpen = false;

    // Get configuration from script tag
    let widgetSlug: string | null = null;
    let position: 'bottom-right' | 'bottom-left' = EMBED_CONFIG.DEFAULT_POSITION;

    // Try to get the current script
    const currentScript = document.currentScript as HTMLScriptElement;
    if (currentScript) {
        widgetSlug = currentScript.getAttribute('data-widget-slug');
        position = (currentScript.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || EMBED_CONFIG.DEFAULT_POSITION;
    } else {
        // Fallback: find script tag with data-widget-slug attribute
        const scripts = document.querySelectorAll('script');
        const embedScript = Array.from(scripts).find(script =>
            script.hasAttribute('data-widget-slug')
        ) as HTMLScriptElement;

        if (embedScript) {
            widgetSlug = embedScript.getAttribute('data-widget-slug');
            position = (embedScript.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || EMBED_CONFIG.DEFAULT_POSITION;
        }
    }

    // Exit if no widgetSlug
    if (!widgetSlug) {
        console.error('Vivia Widget: data-widget-slug attribute is required');
        return;
    }


    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', render);
        } else {
            render();
        }
    }

    function render() {
        // Create floating action button
        button = document.createElement('button');
        button.id = 'vivia-widget-button';
        button.innerHTML = chatBubbleIcon;
        button.style.cssText = `
      position: fixed;
      ${position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
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

        button.addEventListener('click', toggleWidget);
        button.addEventListener('mouseenter', () => {
            if (button) button.style.transform = 'scale(1.08) translateY(-2px)';
        });
        button.addEventListener('mouseleave', () => {
            if (button) button.style.transform = 'scale(1) translateY(0)';
        });

        document.body.appendChild(button);

        // Create container (hidden by default)
        container = document.createElement('div');
        container.id = 'vivia-widget-container';
        container.style.cssText = `
      position: fixed;
      ${position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
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
      transform-origin: ${position === 'bottom-right' ? 'bottom right' : 'bottom left'};
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

        // Create iframe
        iframe = document.createElement('iframe');
        iframe.src = buildWidgetUrl();
        iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
        // Add permissions for microphone and clipboard
        iframe.allow = 'microphone; clipboard-read; clipboard-write';

        container.appendChild(iframe);
        document.body.appendChild(container);

        // Handle messages from widget
        window.addEventListener('message', handleMessage);
    }

    function buildWidgetUrl(): string {
        // Builds: https://your-widget-url.com/vivia-organizationname
        return `${EMBED_CONFIG.WIDGET_URL}/${widgetSlug}`;
    }

    function handleMessage(event: MessageEvent) {
        if (event.origin !== new URL(EMBED_CONFIG.WIDGET_URL).origin) return;

        const { type, payload } = event.data;

        switch (type) {
            case 'close':
                hide();
                break;
            case 'resize':
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
            container.style.display = 'block';
            // Trigger animation
            setTimeout(() => {
                if (container) {
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0) scale(1)';
                }
            }, 10);
            // Change button icon to close
            button.innerHTML = closeIcon;
        }
    }

    function hide() {
        if (container && button) {
            isOpen = false;
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px) scale(0.95)';
            // Hide after animation
            setTimeout(() => {
                if (container) container.style.display = 'none';
            }, 300);
            // Change button icon back to chat
            button.innerHTML = chatBubbleIcon;
            button.style.background = '#09090b';
        }
    }

    function destroy() {
        window.removeEventListener('message', handleMessage);
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

    // Function to reinitialize with new config
    function reinit(newConfig: { widgetSlug?: string; position?: 'bottom-right' | 'bottom-left' }) {
        destroy();

        if (newConfig.widgetSlug) {
            widgetSlug = newConfig.widgetSlug;
        }
        if (newConfig.position) {
            position = newConfig.position;
        }

        init();
    }

    // Expose API to global scope
    (window as any).ViviaWidget = {
        init: reinit,
        show,
        hide,
        destroy
    };

    // Auto-initialize
    init();
})();