# netlify-cms-github-auth

A backend to allow GitHub logins for a self hosted netlify-cms.

## About

This project produces a container that you can use as a backend for
[netlify-cms](https://www.netlifycms.org)
so that you can authenticate with GitHub via OAuth2.
The container wraps the logic from
[digitalinteraction/vercel-netlify-cms-github](https://github.com/digitalinteraction/vercel-netlify-cms-github)
into a http server to serve requests and a health check.
The app itself is minimal and only relies on
[@openlab/vercel-netlify-cms-github](https://github.com/digitalinteraction/vercel-netlify-cms-github),
[debug](https://github.com/visionmedia/debug), and
[simple-oauth2](https://github.com/lelylan/simple-oauth2).

## Guide

This guide follows a deployment where the auth container is at `https://example.com`.

**1. Create a GitHub OAuth application**

Go to https://github.com/settings/developers.

- Set **Homepage URL** to your static website url
- Set **Authorization callback URL** to `https://example.com/callback`
- Make a note of your `client_id` and `client_secret`

**2. Deploy your container**

There are so many ways to deploy containers, so this guide won't go into specifics.
You want the container to be publicly available,
probably behind a reverse proxy with an SSL certificate.
The app runs on port `3000`
and you will need to set the required environment variables from below.

[You can find the container here →](https://github.com/orgs/digitalinteraction/packages/container/package/netlify-cms-github-auth)

**3. Configure netlify-cms**

Update your `config.yml`'s backend:

```yaml
backend:
  name: github
  repo: example/repository
  base_url: https://example.com
  auth_endpoint: auth
```

where:

- `repo` is the GitHub repository path with the owner in it
- `base_url` is the url to your server
  This must not have any path components in, see _path-based routing_ below
- `auth_endpoint` is the endpoint netlify-cms talks to (set to `auth`)

[More information about netlify-cms backends →](https://www.netlifycms.org/docs/backends-overview/)

> For path-based routing, for instance where your container is accessible at
> `https://example.com/api/`,
> set `base_url` to `https://example.com`
> and `auth_endpoint` to `api/auth`.
>
> The `auth` on the end is the endpoint inside the container netlify-cms needs to talk to
> and `api` at the start is your path to the container.
>
> Make sure this aligns with **Authorization callback URL** from step 1.

### Environment variables

**Required**

- `SELF_URL` - The public url where the container is accessible at with no trailing slashes
- `OAUTH_CLIENT_ID` - Your GitHub OAuth2 client id
- `OAUTH_CLIENT_SECRET` - Your GitHub OAuth2 client secret

**Optional**

You could use these to talk to an enterprise version of GitHub,
but this hasn't been tested.

- `OAUTH_HOST` (default: `https://github.com`)
- `OAUTH_TOKEN_PATH` (default: `/login/oauth/access_token`)
- `OAUTH_AUTHORIZE_PATH` (default: `/login/oauth/authorize`)

### Health check endpoint

The app has an endpoint at `/healthz` which you can use for checking the container's health.
Currently, it will return a `200` if everything is ok
or a `503` if the app is terminating.

### High-availability

The app is stateless so you can run multiple instances if you'd like.
In production, the app will wait an extra 5 seconds before shutting down
while failing the health check to allow load balancers to update
and connections to terminate.

[More info →](https://github.com/godaddy/terminus#how-to-set-terminus-up-with-kubernetes)

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
