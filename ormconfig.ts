module.exports = {
   "type": "sqlite",
   "database": "srv/data/line.sqlite",
   "synchronize": true,
   "logging": false,
   "entities": [
      "srv/entity/**/*.ts"
   ],
   "migrations": [
      "srv/migration/**/*.ts"
   ],
   "subscribers": [
      "srv/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "srv/entity",
      "migrationsDir": "srv/migration",
      "subscribersDir": "srv/subscriber"
   }
}
