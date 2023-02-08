# porfirevich

UI for [ru_transformers](https://github.com/mgrankin/ru_transformers)
[LIVE](https://text.skynet.center/)

## Project setup

```bash
npm install
```

Create node config

```bash
vim ./.env
```

and paste

```text
SITE=http://localhost:3000
JWT_SIGNING_KEY=

GOOGLE_CLIENTID=
GOOGLE_CLIENTSECRET=

FACEBOOK_CLIENTID=
FACEBOOK_CLIENTSECRET=
```

## Production

```bash
npm run build
npm start
```

## Development

```bash
npm run express
npm run serve
```

### Lints and fixes files

```bash
npm run lint
```

## Docker

```bash
docker-compose build
```

Production

```bash
docker-compose up
```

Development

```bash
docker-compose -f ./docker-compose-dev.yml up
```

To run DB migration

```bash
node ./node_modules/ts-node/dist/bin.js ./scripts/moveToPg.ts 
```
