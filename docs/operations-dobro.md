# Эксплуатация dobro

## Состояние после обновления 09.09.2026

Ubuntu **22.04.5 → 24.04.5 LTS**, ядро **7.0.0-1012-aws**, nginx **1.24.0**.
Выполнены две настоящие перезагрузки: подготовительная на 22.04 и после
release upgrade. Диски, три рабочих Docker-контейнера, nginx/SSH/cron,
два scheduler.py, штатные PostgreSQL 15/16 и таймер Certbot запустились сами.
Ручной запуск для прохождения проверки не использовался.
После reboot прошли desktop/mobile browser-smoke, создание открытки Chromium
и реальные запросы к original/gpt3/mig/lawa/frida: 24 450 байт, 150 токенов,
три ответа, HTTP 200 у всех пяти моделей.

Внешний монитор зафиксировал около 253 с недоступности сайта при первой
перезагрузке (до исправления остановки Docker Snap) и 51 с при второй,
после release upgrade. Inference API устойчиво отвечал примерно через 58 с
после начала второй перезагрузки.

Запрошенная **26.04.1 пока не установлена**: Canonical не открыла штатный
LTS-upgrade (`Supported: 0` в `meta-release-lts`, `do-release-upgrade` не
предлагает релиз). По [объявлению Canonical](https://lists.ubuntu.com/archives/ubuntu-announce/2026-August/000326.html),
ожидаются backport-исправления регрессий rust-coreutils. Форсирование через
`-d` не выполнялось. После разблокировки повторите обычный
`sudo do-release-upgrade`, затем reboot и проверки ниже. Если понадобится
ранний переход — сначала согласуйте повышенный риск и проверьте, что
upgrader выбирает именно стабильную 26.04.1, а не development release.

Репозиторий PGDG, отключаемый Ubuntu при major-upgrade, восстановлен для
`noble` в deb822-формате (`ops/dobro/pgdg.sources`) с HTTPS и отдельным
`Signed-By`. При будущем переходе на 26.04 его suite нужно сменить на
`resolute-pgdg` после обновления ОС.

Основные потребители root до переноса: Docker около 7.4 GB, Snap около
7.1 GB, домашние каталоги без media около 8.2 GB, system journal около
1.7 GB. Docker перенесён на `/dev/xvdf`; после обновления Ubuntu на root
свободно около 6.8 GB вместо исходных 2.1 GB. Старые данные сохранены.

## Диски и автозапуск

`/dev/xvdf` смонтирован по UUID в `/home/ubuntu/porfirevich/media`.
Docker Snap использует прежний путь `/var/snap/docker/common/var-lib-docker`,
но теперь это bind mount каталога `media/.infrastructure/docker` с большого
диска. Так сохраняются все существующие images, volumes и настройки Snap.

`media/.infrastructure` принадлежит root и имеет права 0700: приложение и
публичный `/media` не имеют доступа к данным Docker и резервным копиям.
Родитель `media` имеет sticky bit (1777), чтобы uid приложения не мог
переименовать защищённый каталог.

- `ops/dobro/fstab` — **пример именно для этого хоста**, установлен в `/etc/fstab`.
- `ops/dobro/docker-storage.conf` установлен как
  `/etc/systemd/system/snap.docker.dockerd.service.d/storage.conf`.
- Docker требует оба mount point до запуска и получает 210 секунд на остановку.
  `KillMode=process`, как в upstream Docker unit, позволяет самому dockerd
  остановить containerd и контейнеры по порядку. Стандартный `control-group`
  в Snap при первой проверке убивал containerd одновременно с dockerd и
  задержал reboot до таймаута остановки.
- app, db и proxy имеют `restart: unless-stopped`. `depends_on` Compose сам по
  себе не упорядочивает запуск при reboot: приложение повторяет подключение к БД.
- nginx, SSH, cron и Docker включены в systemd. Боты `stihbot` запускаются двумя
  существующими `@reboot`-заданиями пользователя ubuntu; их окружение Conda отдельно
  от системного Python.
- В `/etc/hosts` добавлено `127.0.1.1 dobro`: локальное имя разрешается даже
  при временной остановке DNS во время обновления (`ops/dobro/hosts`).

Не выполняйте `docker compose down` перед reboot: удалённые контейнеры не
восстановятся от restart policy. После ручного `docker stop` policy
`unless-stopped` также оставляет контейнер остановленным.

При недоступности `/dev/xvdf` система может загрузиться для ремонта через SSH,
но Docker намеренно не запускается с пустым каталогом на системном диске.
Не удаляйте проверки mount point ради запуска.

## Traefik 3

Прокси оформлен отдельным Compose, без доступа к Docker socket:

```bash
sudo docker compose -f docker-compose-proxy.yml config --quiet
sudo docker compose -f docker-compose-proxy.yml up -d --no-build --wait
```

Статический конфиг: `ops/traefik/traefik.yaml`, динамический:
`ops/traefik/dynamic.yaml`. Используется native v3 rule syntax, без
`defaultRuleSyntax=v2`. Убраны бессмысленные weighted-обёртки с одним сервисом,
адреса inference upstream сохранены. Таймаут ожидания ответа — 185 с,
внешние entry points — 190 с (backend ограничивает генерацию 180 с).
Health-check выполняется каждые 10 с с таймаутом 5 с. Прежний таймаут 1 с
привёл к исключению единственного доступного inference upstream и короткому
503 на `/models` во время проверок; увеличен допуск к задержкам сети/сервера.
При динамической перезагрузке этого конфига контейнер не перезапускался,
но inference API около 30 с отвечал нестабильно, пока health-check исключал
недоступные upstream; сайт и каталог продолжали отвечать. После стабилизации
повторный браузерный тест всех пяти моделей с длинными запросами прошёл
без ошибок. При следующих изменениях используйте canary-переключение,
описанное ниже, если нельзя допустить такой интервал прогрева.

Порты inference: 8096/8097; TLS завершает nginx. Dashboard доступен только
на `127.0.0.1:8098` и защищён прежним Basic Auth. Для доступа:

```bash
ssh -N -L 8098:127.0.0.1:8098 dobro
# http://127.0.0.1:8098/dashboard/
```

Файл `/home/ubuntu/traefik-secrets/dashboard.htpasswd` — root:root 0600,
подключается как Compose secret. Пароли и их хэши не хранятся в Git.
Можно переопределить путь через `TRAEFIK_DASHBOARD_USERS_FILE`.

Обновление проверялось на localhost-canary: длинный промпт 24 450 байт,
5 продолжений, 61,8 с, HTTP 200 и CORS. nginx временно переключался на canary,
старые worker-процессы завершали запросы; затем nginx возвращён на 8096/8097.
Старый `goofy_kalam` оставлен остановленным с `restart=no` для отката.
Не запускайте его вместе с новым proxy: порты совпадают.

Маршрут poetry возвращал 503 **до** обновления: его upstream-серверы недоступны.
У старых `dev.porfirevich.ru` (3003) и `models.*` (8095) также не было слушателей.
Эти отдельные приложения не разворачиваются данным Compose.

## Резервные копии

Состояние до обновления сохранено под root-only каталогом
`media/.infrastructure/backups/20260909/`: конфиги, системный rootfs,
прежний Docker data root и финальный dump PostgreSQL 14. Старый volume
`porfirevich_db` не удалён. `final-pg14.dump` получен при остановленных писателях;
контрольные суммы данных/последовательности/индексы/ограничения совпали на 18.

Копии финального dump и конфигов также находятся **на другом хосте** в
`/home/u/backups/porfirevich-20260909/`. Откат к старой БД после новых записей
небезопасен без переноса этих записей. Rootfs — файловая копия живой системы,
а не EBS snapshot; меняющиеся журналы Certbot могли ротироваться во время копии.

Docker Snap не видит host `/tmp` и `/dev/shm` как обычный Docker: Compose,
env-файлы и источники bind mount для служебных контейнеров размещайте под
`/home/ubuntu`, с закрытыми правами для секретов.

## HTTPS

Certbot 5.8 и `certbot-dns-cloudflare` установлены из официальных Snap-пакетов;
`/usr/bin/certbot` указывает на `/snap/bin/certbot`. Это не зависит от версии
системного Python при release upgrade. Прежний venv `/opt/certbot` сохранён,
но не используется. Сертификаты, Cloudflare credentials и renewal hook сохранены.
Включён `snap.certbot.renew.timer`; `certbot renew --dry-run` прошёл для всех
семи имён существующего wildcard-сертификата без замены рабочего сертификата.
Секрет Cloudflare остаётся в закрытом файле вне Git.

Перед ручной проверкой продления используйте `--dry-run`, а не
`--force-renewal`. Snap-установка и DNS-плагин соответствуют
[инструкции Certbot](https://certbot.eff.org/instructions?ws=nginx&os=snap&tab=wildcard).

## Проверка после перезагрузки

Сначала проверяйте состояние, **не запуская сервисы вручную**:

```bash
cat /etc/os-release
uptime -s
findmnt -T /home/ubuntu/porfirevich/media
findmnt -T /var/snap/docker/common/var-lib-docker
systemctl --failed
systemctl is-active nginx ssh cron snap.docker.dockerd
sudo docker ps --format '{{.Names}} {{.Status}}'
curl --fail https://porfirevich.ru/health
curl --fail --output /dev/null 'https://porfirevich.ru/api/story?limit=1'
curl --fail https://api.porfirevich.com/models
sudo pg_lsclusters
systemctl list-timers snap.certbot.renew.timer
```

Дополнительно проверьте оба scheduler.py (`CONFIG=pelevin.json` и `poetry.json`),
существующую открытку `/media`, браузерный desktop/mobile smoke и реальную
генерацию. Если понадобился ручной запуск — исправьте постоянную настройку
и повторите reboot; ручной запуск не подтверждает автозагрузку.
