# Contributing

Use Docker with Compose for the pinned tools, browser engines, and Japanese fonts.
Commands run as a non-root container user with two CPUs, 3 GiB of memory, and 512 MiB of shared memory.

```sh
docker compose build
docker compose run --rm dev pnpm install --frozen-lockfile
docker compose run --rm dev pnpm run ci:gate
```

`ci:gate` runs CSS and JavaScript linting, formatting, strict TypeScript checks, spelling, builds, and 51 browser checks across Chromium, Firefox, and WebKit.
The browser gate uses two workers and no retries.
Failure traces and screenshots are written to `test-results/`.

For development, run `docker compose run --rm --service-ports dev pnpm run dev` and open `http://localhost:5173/demo/`.
The `./x` wrapper exposes the same container's `just` recipes on systems with Bash.
Run `./x` to list them.

## Checks in pull requests

Fast checks run for every pull request and merge group.
Browser checks run when library code, tests, dependencies, build inputs, or their workflow change.
Documentation-only changes keep the fast checks and skip browser startup.
The required status fails unless every selected check succeeds.

Visual snapshots remain an explicit inspection tool through `pnpm run test:visual` or `pnpm run shots` inside the container.
Review rendering changes before updating snapshots with `pnpm run test:update`.
Keep the Playwright package and Docker image at the same version.
Renovate groups their updates.

## Repository metadata

The README and dual-license files are generated from `repository.toml`.
Preserve the original copyright notice in `LICENSE`.
Keep detailed usage in `docs/` and executable examples in `demo/`.
