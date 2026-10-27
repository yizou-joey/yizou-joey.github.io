export const injectStaticContent = ({ html, fileName, id, content }) => {
  const pattern = new RegExp(
    `(<([a-z0-9]+)\\b(?=[^>]*\\bid="${id}"(?:\\s|>|\\/))[^>]*)(>)([\\s\\S]*?)(<\\/\\2>)`,
    "i"
  );
  const match = html.match(pattern);
  if (!match) throw new Error(`${fileName} is missing target container #${id}.`);

  const openTag = match[1].includes("data-content-rendered=")
    ? match[1]
    : `${match[1]} data-content-rendered="static"`;

  return html.replace(pattern, `${openTag}>${content}${match[5]}`);
};
