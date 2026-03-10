# Superhero Incidents API

Projekt udostepnia REST API do zarzadzania bohaterami i incydentami w architekturze warstwowej: route -> controller -> service -> repository -> PostgreSQL.

## Wymagania

- Node.js
- PostgreSQL
- zmienne srodowiskowe `DATABASE_URL` i `TEST_DATABASE_URL`

## Uruchomienie

1. Zainstaluj zaleznosci:

```bash
npm install
```

2. Utworz plik `.env` w katalogu projektu i ustaw co najmniej:

```env
DATABASE_URL=postgresql://postgres:haslo@localhost:5432/superheroes
TEST_DATABASE_URL=postgresql://postgres:haslo@localhost:5432/superheroes_test
PORT=3000
```

3. Wykonaj migracje bazy:

```bash
npm run migrate
```

4. Wypelnij baze danymi deweloperskimi:

```bash
npm run seed
```

5. Uruchom aplikacje:

```bash
npm start
```

Serwer wystartuje domyslnie pod adresem `http://localhost:3000`.

## Testowa baza danych

- migracje testowe: `npx knex migrate:latest --env test`
- rollback testowy: `npx knex migrate:rollback --all --env test`
- testowe seedy: `npm run seed:test`

## Endpointy

- `GET /api/v1/heroes?status=available&power=flight&sortBy=name&sortDir=asc&page=1&pageSize=5`
- `GET /api/v1/heroes/:id`
- `POST /api/v1/heroes`
- `PATCH /api/v1/heroes/:id`
- `GET /api/v1/heroes/:id/incidents?page=1&pageSize=5`
- `GET /api/v1/incidents?level=critical&status=open&district=Centrum&page=1&pageSize=10`
- `GET /api/v1/incidents/:id`
- `POST /api/v1/incidents`
- `POST /api/v1/incidents/:id/assign`
- `PATCH /api/v1/incidents/:id/resolve`
- `GET /api/v1/stats`

## Przykladowe requesty

Rejestracja bohatera:

```json
{
  "name": "Sky Guard",
  "power": "flight"
}
```

Zgloszenie incydentu:

```json
{
  "location": "Downtown",
  "level": "critical"
}
```

Przydzielenie bohatera:

```json
{
  "heroId": 1
}
```

## Najwazniejsze zasady biznesowe

- Bohater moze byc `available`, `busy` albo `retired`.
- Incydent moze byc `open`, `assigned` albo `resolved`.
- Incydent `critical` moze dostac tylko bohatera z moca `flight` albo `strength`.
- Zamkniecie incydentu automatycznie przywraca bohatera do puli `available`.
- Operacje assign i resolve sa wykonywane transakcyjnie.

## Postman

- kolekcja: `superheroes_api.postman_collection.json`
- do szybkiego sprawdzenia flow uruchom kolejno: `Dodaj bohatera` -> `Zglos nowy incydent` -> `Przydziel bohatera (Assign)` -> `Historia incydentow bohatera` -> `Zamknij incydent (Resolve)` -> `Statystyki systemu`