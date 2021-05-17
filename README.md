# netlify-cms-github-auth

## Usage

> Work in progress

## Development

### Setup

To develop on this repo you will need to have [Docker](https://www.docker.com/) and
[node.js](https://nodejs.org) installed on your development machineand have an understanding of them.
This guide assumes you have the repo checked out and are on macOS/unix based system.

You'll only need to follow this setup once for your development machine.

```bash
# cd to/this/folder

# Install NPM dependencies
npm ci
```

### Regular use

These are the commands you'll regularly run to develop on this repo, in no particular order.

```bash
# cd to/this/folder

# ...
```

### Testing

This repo uses automated tests to ensure that everything is working correctly, avoid bad code and reduce defects.
[Jest](https://www.npmjs.com/package/jest) is used to run these tests.
Tests are any file in `src/` that end with `.spec.ts`, by convention they are inline with the source code,
in a parallel folder called `__tests__`.

```bash
# cd to/this/folder

# Run the tests
npm test -s

# Generate code coverage
npm run coverage -s
```

### Irregular use

These are commands you might need to run but probably won't, also in no particular order.

```bash
# cd to/this/folder

# ...
```

### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code.
It works using [yorkie](https://www.npmjs.com/package/yorkie)
and [lint-staged](https://www.npmjs.com/package/lint-staged) to
automatically format code when it is staged for a commit.
This means that code that is pushed to the repo is always formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [package.json#prettier](/package.json)
and can ignores files using [.prettierignore](/.prettierignore).

<!-- WIP -->

### Releasing

This repo uses [GitHub Actions](https://docs.github.com/en/actions)
to build a container when you tag a commit.
This is designed to be used with [npm version](https://docs.npmjs.com/cli/version)
so all container images are [semantically versioned](https://semver.org/).
The `:latest` docker tag is not used.

This job is defined in [.github/workflows/container.yml](/.github/workflows/container.yml)
which builds a container according to the the [Dockerfile](/Dockerfile)
and **only** runs when you push a [tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

```bash
# Deploy a new version of the CLI
npm version # major | minor | patch
git push --tags
```


---

> This project was set up by [puggle](https://npm.im/puggle)