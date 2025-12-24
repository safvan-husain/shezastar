/**
 * Utility functions for string manipulation
 */

/**
 * Strip HTML tags from a string
 * @param html The HTML string to strip
 * @returns Plain text representation
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace ampersands
        .replace(/&lt;/g, '<') // Replace less than
        .replace(/&gt;/g, '>') // Replace greater than
        .replace(/&quot;/g, '"') // Replace quotes
        .replace(/&#39;/g, "'"); // Replace apostrophes
}
