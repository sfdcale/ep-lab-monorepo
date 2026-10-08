# EP Lab Consumer

This repository calls the action in [ep-lab-action](https://github.com/sfdcale/ep-lab-action). Open [the workflow](.github/workflows/demo.yml) to see its cross-repository `uses:` line.

## First GitHub exercise

1. Edit `project: help` to `project: billing` in the GitHub web editor.
2. Commit directly to `main`.
3. Open the repository's **Actions** tab and select the new **Demo action from another repository** run.

The log should say `Hello billing — lab v1` and show Node 24. This workflow currently refers to `sfdcale/ep-lab-action@main`, so it follows the action repository's current `main` branch. That makes the first lesson convenient, but the reference can change over time.

Later, replace `main` with a full commit SHA and compare the behavior. A SHA fixes the action revision the consumer runs.

An action-repository push does not trigger this repository's workflow. Change this workflow or use **Run workflow** in the Actions tab when you want a new consumer run.
