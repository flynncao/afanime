# Release Version Design

## Decision

Release the current `main` branch as version `0.2.5`. Update the root
`package.json` version to `0.2.5`, commit that change, and create an annotated
`v0.2.5` tag on the same commit.

## Why `0.2.5`

- The newest existing tag is `v0.2.4.1`; `0.2.4.1` has four numeric parts and
  is not valid semantic versioning.
- The changes since that tag are backward-compatible fixes, dependency work,
  CI changes, and a Realsearch endpoint/configuration update. They justify a
  patch release rather than a minor or major release.
- `v0.2.5` resumes valid SemVer without rewriting or deleting historical tags.
- Matching the tag with the package version gives production code a stable
  version source because `package.json` is copied into the Docker image.

## Alternatives Considered

- `v0.2.4.2`: follows the accidental four-part pattern but remains invalid
  SemVer and is rejected.
- `v0.3.0`: valid SemVer, but it overstates the scope of the changes since the
  last release and is rejected.

## Release Mechanics

1. Fast-forward local `main` to `origin/main` and fetch remote tags.
2. Set `package.json#version` to `0.2.5` without changing dependencies.
3. Run package metadata, build, and lint checks.
4. Commit the version update.
5. Create annotated tag `v0.2.5` on the version commit.

Pushing the commit and tag is outside this local preparation unless explicitly
requested.
