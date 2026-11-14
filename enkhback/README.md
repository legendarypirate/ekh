# ЭнхЭх API

Node.js + Express + Sequelize + PostgreSQL backend for the mom app and clinic admin.

## Setup

```bash
cd enkhback
npm install
npm run db:create
npm run seed
npm run dev
```

API: [http://localhost:4000](http://localhost:4000)

Database (from `.env`): `mom` / `postgres`.

## Demo logins

Staff `POST /api/auth/staff/login`

- `horoo08` / `Demo@0808`
- `horoo09` / `Demo@0909`
- `duureg` / `Demo@district`
- `superadmin` / `Demo@Super26!`

Mom `POST /api/auth/mom/login`

- `99000001` / `Demo@Mom1`
- `99000002` / `Demo@Mom1`
- `99000003` / `Demo@Mom1`

Send `Authorization: Bearer <token>` on later requests.
