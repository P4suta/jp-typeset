# Usage

Build from source with the Docker Compose commands in the [README](../README.md).
Docker with Compose is required.
The build writes CSS, JavaScript, and TypeScript declarations to `dist/`.
Copy the generated files you need into your site's static assets.

## CSS

Load `dist/jp-typeset.min.css` and mark Japanese content with `lang="ja"` or `class="jp"`.
The stylesheet provides line breaking, paragraph indentation, justification, ruby, emphasis marks, and scoped code styling.
Rules use cascade layers and low specificity so application styles can override them.
Browser-dependent enhancements use feature detection.

```html
<link rel="stylesheet" href="/assets/jp-typeset.min.css" />
<article lang="ja">
  <h1>日本語の見出し</h1>
  <p>日本語の本文。</p>
</article>
```

Override the [custom properties](../src/tokens.css) on the content container to adjust typography.

```css
article:lang(ja) {
  --jp-indent: 1em;
  --jp-leading: 1.8;
  --jp-font-family: "Noto Sans CJK JP", sans-serif;
}
```

Use `.jp-measure` to limit line length, `.jp-vertical` for vertical writing, and `.jp-tcy` for horizontal characters within vertical text.
Give vertical containers an explicit height.
The stylesheet does not include fonts or paginate documents.

## Optional JavaScript

Load `dist/enhance.iife.js` after the stylesheet for automatic enhancement of Japanese content.
It includes BudouX and its Japanese model.
By default, it adds phrase boundaries to headings and short text where native phrase breaking is unavailable.

```html
<script src="/assets/enhance.iife.js" defer></script>
```

Bundlers can import `dist/enhance.js` and call `enhance()` explicitly after rendering content.
The ESM build requires the package's BudouX dependency.
The `dialogueIndent`, `hanging`, `spacingTrim`, and `observe` options are opt-in.
The hanging and spacing approximations depend on layout and fonts.
See the [enhancement demos](../demo/enhance-esm.html) for explicit options.

## Browser checks

Computed styles, DOM behavior, and the bundled enhancement are checked in Chromium, Firefox, and WebKit.
These checks cover concrete behavior rather than the visual quality of every page and font.
Inspect the demo pages in the browsers and fonts your site supports.
