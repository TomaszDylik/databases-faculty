# Superhero Incidents API

Projekt udostepnia REST API do zarzadzania bohaterami i incydentami w architekturze warstwowej: route -> controller -> service -> repository -> PostgreSQL.

## Wymagania

- Node.js
- PostgreSQL
- zmienna srodowiskowa `DATABASE_URL`

## Uruchomienie

1. Zainstaluj zaleznosci:

```bash
npm install
```

2. Utworz plik `.env` w katalogu projektu i ustaw co najmniej:

```env
DATABASE_URL=postgresql://postgres:haslo@localhost:5432/superheroes
PORT=3000
```

3. Uruchom aplikacje:

```bash
npm start
```

Serwer wystartuje domyslnie pod adresem `http://localhost:3000`.

## Endpointy

- `GET /api/v1/heroes?status=available&power=flight`
- `POST /api/v1/heroes`
- `GET /api/v1/incidents?level=critical&status=open`
- `POST /api/v1/incidents`
- `POST /api/v1/incidents/:id/assign`
- `PATCH /api/v1/incidents/:id/resolve`

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

- Bohater moze byc `available` albo `busy`.
- Incydent moze byc `open`, `assigned` albo `resolved`.
- Incydent `critical` moze dostac tylko bohatera z moca `flight` albo `strength`.
- Zamkniecie incydentu automatycznie przywraca bohatera do puli `available`.
- Operacje assign i resolve sa wykonywane transakcyjnie.