const checkContrast = (foreground, background) => {
    const getLuminance = (color) => {
        const rgb = parseInt(color.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >>  8) & 0xff;
        const b = (rgb >>  0) & 0xff;
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const contrast = (lum1 + 0.05) / (lum2 + 0.05);
    return contrast > 4.5; // WCAG AA requires a contrast ratio of at least 4.5:1
};

(async () => {
    const results = [];

    // 1. Check for Alt Text
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
    }));
    const missingAlts = images.filter(img => !img.alt);
    results.push({
        title: 'Alt Text Check',
        details: `Found ${missingAlts.length} images without alt text.`,
    });

    // 2. Check for Semantic HTML
    const semanticTags = ['header', 'nav', 'main', 'footer', 'article', 'section'].map(tag => ({
        tag,
        count: document.querySelectorAll(tag).length,
    }));
    results.push({
        title: 'Semantic HTML Check',
        details: `Semantic tags found: ${semanticTags.map(t => `${t.tag}: ${t.count}`).join(', ')}`,
    });

    // 3. Check for Keyboard Accessibility
    const focusableElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]')).map(el => el.outerHTML);
    results.push({
        title: 'Keyboard Accessibility Check',
        details: `Found ${focusableElements.length} focusable elements.`,
    });

    // 4. Check for Color Contrast
    const contrastIssues = [];
    document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (style.color && style.backgroundColor && !checkContrast(style.color, style.backgroundColor)) {
            contrastIssues.push(el.outerHTML);
        }
    });
    results.push({
        title: 'Color Contrast Check',
        details: `Found ${contrastIssues.length} elements with insufficient color contrast.`,
    });

    // 5. Check for Navigational Clarity
    const navElements = document.querySelectorAll('nav').length;
    results.push({
        title: 'Navigational Clarity Check',
        details: `Found ${navElements} navigation elements.`,
    });

    // 6. Check for Forms and Interactive Elements
    const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        method: form.method,
        action: form.action,
        inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
            type: input.type,
            name: input.name,
            label: input.labels ? input.labels[0].innerText : '',
        })),
    }));
    results.push({
        title: 'Forms and Interactive Elements Check',
        details: `Found ${forms.length} forms.`,
    });

    // 7. Check for Adaptive and Responsive Design
    const viewportMeta = document.querySelector('meta[name="viewport"]') ? true : false;
    results.push({
        title: 'Adaptive and Responsive Design Check',
        details: `Viewport meta tag present: ${viewportMeta}`,
    });

    // 8. Check for Accessibility Testing and Compliance
    results.push({
        title: 'Accessibility Testing and Compliance',
        details: `Regular accessibility audits and testing are essential to identify and address accessibility barriers. Compliance with standards like WCAG ensures websites meet recognized accessibility criteria.`,
    });

    chrome.storage.local.set({accessibilityResults: results});
})();
