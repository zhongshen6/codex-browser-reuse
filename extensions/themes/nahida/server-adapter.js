const fs = require("node:fs");
const path = require("node:path");

function transformAsset(relativeName, content) {
  if (relativeName !== "theme.css") return content;

  // Keep theme-specific binary/data-url preparation inside the theme package,
  // so the core server only knows how to ask an extension to transform assets.
  const ornaments = {
    VINE: ["nahida-vine.svg", "0.30"],
    EMBLEM: ["nahida-emblem.svg", "0.17"],
    EMBLEM_HEADER: ["nahida-emblem.svg", "0.32"],
    EMBLEM_PANEL: ["nahida-emblem.svg", "0.30"],
    FILIGREE_STRONG: ["nahida-filigree.svg", "0.38"],
    CORNER_TL: ["nahida-corner-tl.svg", "0.52"],
    CORNER_BR: ["nahida-corner-br.svg", "0.52"]
  };
  let css = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
  for (const [key, [filename, opacity]] of Object.entries(ornaments)) {
    const source = fs.readFileSync(path.join(__dirname, "ornaments", filename), "utf8")
      .replace("<svg ", `<svg opacity="${opacity}" `);
    css = css.replaceAll(
      `__NHD_${key}_DATA__`,
      `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`
    );
  }
  if (/__NHD_[A-Z_]+_DATA__/.test(css)) {
    throw new Error("Unresolved Nahida ornament");
  }
  return css;
}

module.exports = { transformAsset };
