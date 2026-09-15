# Поддержка стека

Проверено 09.09.2026. Зафиксированная версия делает сборку воспроизводимой,
но не заменяет регулярные security/patch-обновления.

| Компонент | Рабочая ветка | Срок / действие |
| --- | --- | --- |
| Node в приложении | 24 LTS | EOL 30.04.2028; устанавливать новые patch-релизы |
| PostgreSQL приложения | 18 | EOL 14.11.2030; major-миграция выполнена отдельно от замены image |
| Ubuntu на dobro | 24.04 LTS | Standard support до 2029; штатный переход на 26.04.1 пока не открыт Canonical |
| Traefik на dobro | 3.7 | Каждая minor-ветка поддерживается около 6 месяцев; следить за следующей minor осенью 2026 |
| Debian в app image | 12 Bookworm | Уже LTS: до 30.06.2028, состав поддерживаемых пакетов ограничен |
| Alpine в PostgreSQL image | 3.24 | Main до 01.06.2028; community — только до следующего stable |
| Python фоновых ботов | 3.11 | Security support до октября 2027 |

Traefik 2.10 на dobro больше не используется. Нельзя оставаться на старом minor
Traefik только потому, что major 3 ещё актуален. Vue/Vite/Express/TypeORM и
остальные npm-пакеты не имеют единого LTS-календаря: проверяйте release notes,
совместимость, `npm audit` и тесты перед обновлением lock-файлов.

На хосте также остался старый CLI Node 12 (Snap `12/stable`, EOL 30.04.2022)
и legacy-библиотеки прежних Ubuntu. Рабочее приложение использует **Node 24
в контейнере**, а не этот CLI. Массовое удаление старых окружений и чужих
проектов при release upgrade не выполнялось.

26.04.1 уже выпущена, но в `meta-release-lts` на 09.09.2026 имеет `Supported: 0`:
автоматические LTS-upgrades задержаны из-за регрессий rust-coreutils.
Это ограничение **пути обновления**, не отсутствие поддержки самой 26.04.
Принудительный переход требует отдельного решения о риске для production.
[Официальное объявление](https://lists.ubuntu.com/archives/ubuntu-announce/2026-August/000326.html).

Источники: [Node](https://github.com/nodejs/Release#release-schedule),
[PostgreSQL](https://www.postgresql.org/support/versioning/),
[Traefik](https://doc.traefik.io/traefik/deprecation/releases/),
[Debian](https://www.debian.org/releases/bookworm/),
[Alpine](https://alpinelinux.org/releases/),
[Python](https://devguide.python.org/versions/),
[Ubuntu](https://ubuntu.com/about/release-cycle).
