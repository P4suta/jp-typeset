FROM jdxcode/mise:2026.10.13@sha256:a2f1563d47f56a7ce69d5c94ac61d9f7af5063613bfd3c50e6268768ed9c87ad AS tools
FROM mcr.microsoft.com/playwright:v1.64.1-noble@sha256:7852dc5a7d72f5fe458a597d690f6c42fbc8e9e26ddfa95f8e6ef552558d9bbf

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
