# bookchaowalit-vr-starter

Starter repository for the `bookchaowalit-vr` organization.

## Purpose

This repository is an intentionally thin baseline for VR/XR interfaces
and shared conventions under the Book Dev owner model. It contains no product
features yet.

## Repository boundary

- **Owner:** `bookchaowalit-vr`
- **Surface:** VR/XR
- **Book Dev category:** `book-apps/vr`
- **Default branch:** `main`
- **Status:** starter / skeleton

## CI

GitHub Actions runs the starter contract check on pushes and pull requests.
The workflow verifies that the required baseline files remain present.

The shared security workflow from
[`bookchaowalit/platform-ci-workflows`](https://github.com/bookchaowalit/platform-ci-workflows)
(v1.1.1: gitleaks, Semgrep, OSV-Scanner, Trivy) runs in the same CI. The shared
language CIs (`ci-node.yml`, `ci-python.yml`) are added with the first product
scaffold, once there is a stack to lint, type check and test.

## Local development

There is no runtime or dependency setup yet. Add implementation only when a
concrete VR/XR product is approved.

## License

MIT. See [`LICENSE`](./LICENSE).
