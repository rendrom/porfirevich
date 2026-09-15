# Порфирьевич — сайт

[porfirevich.ru](https://porfirevich.ru): редактор историй с продолжением текста
нейросетью, переключением вариантов, галереей и открытками для публикации.
При первом посещении выбирается `original`; сохранённый выбор пользователя сохраняется.

## Устройство проекта

- `client/` — Vue 3, Pinia, Vue Router, Buefy и Vite; редактор на `contenteditable`.
- `server/` — Express, TypeORM, PostgreSQL, авторизация и генерация открыток Chromium/Puppeteer.
- `shared/` — общие типы, настройки и небольшие утилиты.
- `Dockerfile` — раздельная сборка клиента и сервера, запуск от непривилегированного пользователя.

Браузер обращается к отдельному сервису инференса (`shared/config.ts`, сейчас
`https://api.porfirevich.com`). В этом репозитории нет весов моделей или GPU-движка.
Сайт обслуживает `/api/story`, `/api/user`, `/auth`, `/media` и `/health`.

Рабочий стек: Node **24.20.0 LTS**, Vue **3.5.42**, Pinia **4.0.3**,
Router **5.3.1**, Buefy **3.1.0**, Vite **8.2.2**, Express **5.2.1**,
TypeORM **1.1.1**, Puppeteer **25.10.0**, PostgreSQL **18.6**.
Точные зависимости зафиксированы в трёх `package-lock.json`.
TypeScript оставлен на **6.0.3**: текущий `typescript-eslint` ещё требует `<6.1`.

## Запуск в Docker

Нужны Docker и Compose v2. Скопируйте `.env.example` в `.env`, задайте собственные
`POSTGRES_PASSWORD`, `JWT_SIGNING_KEY` и адрес `SITE`. Для генерации секретов можно
использовать `openssl rand -hex 32`. Не публикуйте `.env`.

```bash
docker compose build
docker compose up -d --wait db
```

Только для **новой пустой БД** создайте схему:

```bash
docker compose run --rm --no-deps -e TYPEORM_SYNCHRONIZE=true app node -e "const ds=require('./dist/server/src/data-source').default; ds.initialize().then(()=>ds.destroy()).catch(e=>{console.error(e);process.exit(1)})"
docker compose up -d --wait app
```

Сайт: `http://localhost:3000`; PostgreSQL: `localhost:5433`.
Истории хранятся в named volume `db18`, открытки — в `./media`.
Не используйте `docker compose down -v` для рабочей установки.

При обновлении существующей установки с PostgreSQL 14 (или dev с 17) сначала
выполните [миграцию данных](docs/postgresql.md). Простая смена тега несовместима
со старым форматом данных; новый том без восстановления будет пустым.

Автосинхронизация схемы в production выключена. Обновление TypeORM не требует
изменения рабочей схемы; имя существующего индекса email сохранено явно.
Старые миграции лежат в `server/src/migration` и не запускаются автоматически.
Не применяйте их вслепую к уже существующей базе.

## Разработка и тесты

Используйте Node 24.20.0. Локальный `npm run dev` запускает Vite на `:8080`
и Express на `:3000`; БД указывается через переменные `POSTGRES_*`.
Для новой локальной БД можно задать `TYPEORM_SYNCHRONIZE=true`.
`docker-compose-dev.yml` — отдельная локальная установка, не hot reload.

```bash
npm ci
PUPPETEER_SKIP_DOWNLOAD=true npm --prefix client ci
PUPPETEER_SKIP_DOWNLOAD=true npm --prefix server ci
npm run build
npm run lint
npm --prefix client test
CHROME_PATH=/usr/bin/chromium npm --prefix client run test:browser
```

Браузерные тесты редактора проверяют выделение, удаление, переносы строк, вставку,
IME, варианты, смену настроек, задержанные ответы и undo. При заданном `SMOKE_URL`
дополнительно проверяется собранный сайт в desktop/mobile-режимах Chromium;
ответы инференса в обычных тестах подменяются.

Серверные тесты **пишут тестовые данные** и отказываются работать, если имя БД
не оканчивается на `_test`. Запускайте на отдельной базе, никогда на production:

```bash
POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5432 POSTGRES_USER=porf \
POSTGRES_PASSWORD=test-only POSTGRES_DB=porf_test TYPEORM_SYNCHRONIZE=true \
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium npm --prefix server test
```

На копии рабочей схемы используйте `TYPEORM_SYNCHRONIZE=false` — тест проверит,
что новая ORM не предлагает изменений схемы. Для проверок сайта запустите сервер
с той же тестовой БД и задайте `SMOKE_URL=http://localhost:3000`.

Отдельная opt-in проверка длинных промптов использует реальные GPU, но не сохраняет истории:

```bash
LIVE_API=1 SMOKE_URL=http://localhost:3000 CHROME_PATH=/usr/bin/chromium \
npm --prefix client run test:browser
```

Шаблон [docs/ci-example.yml](docs/ci-example.yml) выполняет сборку, lint,
unit/integration/browser-тесты и `npm audit`. Для включения CI перенесите его в
`.github/workflows/test.yml` с учётной записью, имеющей право изменять workflows.
При этом обновлении доступный GitHub-токен такого права не имел; тесты выполнены вручную.
Мобильные проверки — эмуляция Chromium, не тест на физическом iPhone/Android.
Разбор открытых issues: [docs/issues.md](docs/issues.md).

## Обновление с коротким простоем

1. Проверьте свободный диск, сделайте резервную копию БД и сохраните текущий Docker image отдельным тегом.
2. Соберите новый image, пока старый контейнер работает. При нехватке места собирайте на другом хосте и передавайте через `docker save | ssh HOST docker load`.
3. Проверьте image с отдельной тестовой БД и браузерными тестами. Затем можно запустить canary на отдельном localhost-порту с рабочей БД, строго с `TYPEORM_SYNCHRONIZE=false` и без тестовых записей.
4. После проверок переключите тег `porfirevich:local` на новый image и выполните `docker compose up -d --no-deps --no-build --wait app`. Не останавливайте весь Compose-стек.
5. Проверьте `/health`, главную страницу, галерею и генерацию через публичный HTTPS. Удалите только свой временный canary.

Для отката верните прежний image под тег `porfirevich:local` и повторите команду
обновления `app`. БД и `media` остаются на месте.

PostgreSQL используется из стабильной ветки **18**, поддерживаемой до ноября 2030.
Порядок major-миграции и ограничения отката: [docs/postgresql.md](docs/postgresql.md).
Сроки поддержки остальных компонентов: [docs/support.md](docs/support.md).
Диски, Traefik, резервные копии и проверка автозапуска на dobro:
[docs/operations-dobro.md](docs/operations-dobro.md).
