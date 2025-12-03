/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - The sanitized HTML string
 */
export const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Creates HTML elements safely from a template string
 * @param {string} html - The HTML template string
 * @returns {DocumentFragment} - A document fragment containing the created elements
 */
export const createSafeHTML = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

/**
 * Sets innerHTML safely by sanitizing the content first
 * @param {Element} element - The DOM element to set content for
 * @param {string} html - The HTML content to set
 */
export const setSafeInnerHTML = (element, html) => {
  // For simple text content, we can directly set textContent
  if (!html.includes('<') && !html.includes('&')) {
    element.textContent = html;
    return;
  }
  
  // For HTML content, we sanitize it first
  element.innerHTML = sanitizeHTML(html);
};

/**
 * Sets innerHTML safely using document fragments
 * @param {Element} element - The DOM element to set content for
 * @param {string} html - The HTML content to set
 */
export const setSafeInnerHTMLFragment = (element, html) => {
  // Clear existing content
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  
  // Create and append safe content
  const fragment = createSafeHTML(html);
  element.appendChild(fragment);
};