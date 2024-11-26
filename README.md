# VPS

Empower your software hosting it on a VPS (Virtual Private Server). Cheaper and portable.

If you want to replicate your localhost to staging/production, you can use this guide.

Self-hosted TypeScript apps I'm using:

- [Web] Vite React (<www.yourdomain.com>)
- [Server] NodeJS (api.yourdomain.com)

Self-hosted services I'm using:

- [VPS] Hetzner
- [Git] GitHub
- [Deployment] Coolify
- [Database] Postgres
- [Local-Cloud Sync] PowerSync
- [Auth] Supertokens

Other services:

- [Reverse Proxy] Traefik (configured in Coolify)
- [DNS, TLS, Protection] Cloudflare
- [Email] Docker Inbucket for local development (not VPS)
- [Postgres Migration] Flyway

For Postgres migration, I'm using [Flyway](https://flywaydb.org/).

## Content Table

- [0. Pre-requisites](#0-pre-requisites)
- [1. Create The Services Locally](#1-create-the-services-locally)
- [2. Setup VPS](#2-setup-vps)
- [3. Setup DNS & TLS](#3-setup-dns-tls)
- [4. Setup Coolify](#4-setup-coolify)
- [5. Deploy the Services to the VPS](#5-deploy-the-services-to-the-vps)

## [0. Pre-requisites](#0-pre-requisites)

- Install on your laptop [Docker Desktop](https://www.docker.com/products/docker-desktop/) or other, like [OrbStack](https://orbstack.dev/).
- Your domain connected to Cloudflare.

## [1. Create The Services Locally](#1-create-the-services-locally)

1. Fork my `services` folder to your repository.
2. Copy the `.env.example` file to `.env` and update the variables.
3. From each service directory, run `docker compose up` to start the services.

## [2. Setup The VPS](#2-setup-the-vps)

1. [Create VPS on Hetzner](https://docs.hetzner.com/cloud/servers/getting-started/creating-a-server) (cheaper than AWS; [link 2](https://tech.ahrefs.com/how-ahrefs-saved-us-400m-in-3-years-by-not-going-to-the-cloud-8939dd930af8). [link 2](https://learn.umh.app/course/aws-and-azure-are-at-least-4x-10x-more-expensive-than-hetzner/)). Debian.
2. Connect to your Hetzner VPS with SSH. Guide <https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server/>
3. Update and upgrade Debian packages.

```bash
sudo apt update && sudo apt upgrade -y
```

## [3. Setup DNS & TLS](#3-setup-dns-tls)

[!CAUTION] Work in progress

1. Enable TLS Strict mode on Cloudflare <https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/>
2. Create a Cloudflare Origin CA <https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/>
3. Setup a DNS record for your domain pointing to your VPS.
4. Obtain API Token from Cloudflare and update Traefik .env

<img src="assets/cloudflare_dns.png" alt="Cloudflare DNS" width="600" />

## [4. Setup Coolify](#4-setup-coolify)

Use cloud or self-hosted. I'm using the cloud (only $5/month).

1. Create a Coolify account.
2. Create a new server in an Staging or Production environment. My case is Staging.

   <img src="assets/coolify_server.png" alt="Coolify server" height="300" />

3. Create a SSH key automatically with the "Generate new Ed25519 SSH key" function.

   To allow Coolify to connect to your VPS, you need to create a SSH key. I prefer to use a different one than my laptop (in step #1).

   <img src="assets/coolify_ssh_1.png" alt="Coolify ssh step 1" width="600" />
   <img src="assets/coolify_ssh_2.png" alt="Coolify ssh step 2" width="600" />

4. I'm using the root user automatically created by the VPS. Note that this is not recommended for production. Coolify has a beta feature to allow other users.
5. Create a source with GitHub Apps to connect Coolify to your repository.

   <img src="assets/coolify_sources.png" alt="Coolify sources" width="600" />

## [5. Deploy the Services to the VPS](#5-deploy-the-services-to-the-vps)

1. Create a new resource on Coolify via the source you created in the previous step (GitHub Apps).

   <img src="assets/coolify_resources_1.png" alt="Coolify resources step 1" width="600" />

2. Select (Docker Compose instead of Nixpacks). Remember to write the branch you want to deploy.

   <img src="assets/coolify_resources_2.png" alt="Coolify resources step 2" width="600" />

3. Do this for each service (PowerSync, Supertokens, Postgres).

## [Work in progress]

- Sample Vite web
- Sample Node.js server

Issues:

- Coolify doesn't load Docker Compose files.