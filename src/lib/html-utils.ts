/**
 * Utility functions for handling HTML content in the UI.
 */

/**
 * Strips HTML tags and decodes basic entities to get clean plain text.
 * Useful for sidebar previews or tooltips.
 */
export function stripHtml(html: string | undefined | null): string {
    if (!html) return "";

    // First remove all tags
    let text = html.replace(/<[^>]*>/g, '');

    // Replace common entities
    const entities: Record<string, string> = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
    };

    Object.entries(entities).forEach(([entity, char]) => {
        text = text.replace(new RegExp(entity, 'g'), char);
    });

    return text.trim();
}

/**
 * Helper to safely render HTML content in React components.
 * Returns props for dangerouslySetInnerHTML.
 */
export function renderHtml(html: string | undefined | null) {
    return {
        dangerouslySetInnerHTML: { __html: html || '' }
    };
}
