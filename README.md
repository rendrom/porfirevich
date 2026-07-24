# porfirevich

UI for [ru_transformers](https://github.com/mgrankin/ru_transformers)
[LIVE](https://text.skynet.center/)

## Local Docker setup

Create a `.env` file:

```text
SITE=http://localhost:3000
JWT_SIGNING_KEY=

GOOGLE_CLIENTID=
GOOGLE_CLIENTSECRET=

POSTGRES_USER=porf
POSTGRES_PASSWORD=123456
POSTGRES_DB=porf
```

```bash
docker-compose up -d --build
```

The application will be available at [http://localhost:3000](http://localhost:3000),
and PostgreSQL will listen on `localhost:5433`.

To build and start the development Compose stack:

```bash
docker-compose -f docker-compose-dev.yml up --build
```

Check the service status:

```bash
docker-compose ps
curl http://localhost:3000/health
```

## Running without Docker

```bash
npm install
npm --prefix client install
npm --prefix server install
npm run dev
```

Vite serves the client at `http://localhost:8080` and proxies API requests to
the server at `http://localhost:3000`.

## Checks

```bash
npm run build
npm run lint
```

Individual checks:

```bash
npm --prefix client run typecheck
npm --prefix server run typecheck
```
