# Jp-typeset

CSS presets for Japanese typography.

## Installation

```sh
git clone https://github.com/P4suta/jp-typeset.git
cd jp-typeset
docker compose build
docker compose run --rm dev pnpm install --frozen-lockfile
docker compose run --rm dev pnpm run build
```

## Usage

```html
<link rel="stylesheet" href="dist/jp-typeset.min.css" />
<article lang="ja">
  <p>日本語の本文。</p>
</article>
```

## Documentation

[Read the documentation](docs/README.md).

## License

Licensed under either of the [Apache License, Version 2.0](LICENSE-APACHE) or the [Massachusetts Institute of Technology (MIT) license](LICENSE-MIT), at your option.
You license each contribution you submit under the same two licenses, without other terms, unless you state otherwise.
