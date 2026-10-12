# EP Lab Consumer

This public playground calls a reusable workflow, which runs the pinned action in [ep-lab-action](https://github.com/sfdcale/ep-lab-action).

## Affected-project exercise

The project graph lives in `project-dependencies.json`:

- `help` depends on `base`.
- `billing` has no in-repository dependencies.

On each push to `main`, the `discover` job compares the previous commit with the current commit. It emits a JSON project list through `GITHUB_OUTPUT`; the caller passes that value to the reusable workflow, which converts it into a matrix.

Expected plans:

- Change a file under `src/base/`: `base`, `help`.
- Change a file under `src/help/`: `help`.
- Change a file under `src/billing/`: `billing`.
- Change `project-dependencies.json` or files outside `src/`: all projects, because their impact is not scoped to a single project.

The matrix jobs can run in parallel. The project list is ordered for stable output, but it does not enforce dependency order.
