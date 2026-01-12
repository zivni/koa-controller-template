
const STATIC_PATH = "/static/";
const STATIC_APP_PATH = STATIC_PATH + "dist/";

interface htmlPageTemplateProps {
    jsFiles: string[]
    cssFiles: string[]
    title: string
}
export function getPageTemplate({ jsFiles, cssFiles, title }: htmlPageTemplateProps) {
    const scriptFilesTags = jsFiles.map(file => `<script src="${STATIC_APP_PATH}${file}" type="module"></script>`).join("\n");
    const cssFilesTags = cssFiles.map(file => `<link href="${STATIC_APP_PATH}${file}" rel="stylesheet">`).join("\n");
    const lines: string[] = [];
    lines.push('<!doctype html>')
    lines.push(`<html>`);

    lines.push(`<head>`);
    lines.push(`    <link rel="shortcut icon" href="${STATIC_PATH}favicon.ico">`);
    lines.push(`    <title>${title}</title>`);
    lines.push(cssFilesTags);
    lines.push(`</head>`);

    lines.push(`<body>`);
    lines.push(`<div id="root"></div>`);
    lines.push(scriptFilesTags);
    lines.push(`</body>`);

    lines.push(`</html>`);

    return lines.join("\n")
}