FROM jdxcode/mise:2026.11.10@sha256:80aa2afb17ba760cabe74ac90771ca2d1470773d514cc2bb79c69c8d3f92f150 AS tools
FROM mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579

COPY --from=tools /usr/local/bin/mise /usr/local/bin/mise
ENV MISE_DATA_DIR=/opt/mise
COPY mise.toml /etc/mise/config.toml
COPY mise.lock /etc/mise/mise.lock
RUN mise install --locked --jobs=2 \
 && ln -sf "$(mise which node)" /usr/local/bin/node \
 && ln -sf "$(mise which pnpm)" /usr/local/bin/pnpm \
 && ln -sf "$(mise which just)" /usr/local/bin/just \
 && ln -sf "$(mise which typos)" /usr/local/bin/typos \
 && ln -sf "$(mise which lefthook)" /usr/local/bin/lefthook

RUN apt-get update \
 && apt-get install --yes --no-install-recommends fonts-noto-cjk fonts-noto-cjk-extra git \
 && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/dev
ENV PNPM_CONFIG_STORE_DIR=/home/dev/.pnpm-store
RUN mkdir -p /workspace/node_modules /home/dev/.pnpm-store \
 && chown -R 1000:1000 /workspace /home/dev

WORKDIR /workspace
USER 1000:1000
