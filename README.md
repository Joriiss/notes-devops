# Notes API (notes-devops)

REST API for managing notes. Built with Node.js, Express, and MongoDB for a DevOps-focused project (CRUD, tests, CI/CD, Docker).

## Tech stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, dotenv
- **Frontend:** React (Vite), minimal UI
- **Tests:** Jest + Supertest

## Prerequisites

- **Local run:** Node.js (v18+), MongoDB running locally (or a reachable MongoDB URI)
- **Docker run:** Docker and Docker Compose

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Joriiss/notes-devops.git
   cd notes-devops
   npm install
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` if needed. Defaults:
   - `MONGODB_URI=mongodb://127.0.0.1:27017/notes-devops`
   - `PORT=3000`

## Run locally

Start the server:

```bash
npm start
```

Or:

```bash
npm run dev
```

The API is available at `http://localhost:3000` (or the port set in `.env`).

## Frontend (React)

A minimal web UI to add, edit, delete and list notes.

**Development** (API must be running on port 3000):

```bash
cd client
npm install
npm run dev
```

**Production:** Build the client and start the API; the API serves the built files:

```bash
cd client && npm install && npm run build && cd ..
npm start
```

Then open http://localhost:3000 for the app and API.

## Run with Docker Compose

With Docker and Docker Compose installed, you can run the full stack (API + MongoDB):

```bash
docker compose up --build
```

- **API:** http://localhost:3000  
- **MongoDB:** localhost:27017 (data persisted in volume `notes-devops_mongo_data`)

Run in detached mode: `docker compose up --build -d`. Stop with `docker compose down`.

## Lint

```bash
npm run lint
```

Runs ESLint on `src/` and `tests/`.

## Run tests

```bash
npm test
```

Tests use an in-memory MongoDB (no local MongoDB required for tests).

## Seed data

You can quickly populate the database with fake notes and categories:

```bash
npm run seed          # default: 25 notes
npm run seed -- 50    # custom count
```

This creates base categories (`Work`, `Personal`, `Ideas`, `Archive`) and a set of notes assigned to them.

## API routes

### Notes

| Method | Route              | Description                                   | Status      |
|--------|--------------------|-----------------------------------------------|-------------|
| GET    | `/health`          | Health check                                  | 200         |
| GET    | `/ressources`      | List notes (paginated, `?page=1&limit=10`)   | 200         |
| GET    | `/ressources/:id`  | Get one note by ID                            | 200 or 404  |
| POST   | `/ressources`      | Create a note                                 | 201 or 400  |
| PUT    | `/ressources/:id`  | Update a note                                 | 200 or 404  |
| DELETE | `/ressources/:id`  | Delete a note                                 | 200 or 404  |

**Request body for create/update:** JSON:

```json
{
  "title": "My note",
  "content": "Hello world",
  "categoryIds": ["<categoryId>", "..."] // optional
}
```

- `title`, `content` are required and non-empty.
- `categoryIds` is optional and must contain valid category IDs if provided.

**Validation:** Missing or empty `title`/`content` → `400` with error message. Invalid or non-existent note ID → `404`.

**Pagination, filtering and sorting:**

```json
{
  "items": [ /* notes */ ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

Supported query params on `GET /ressources`:

- `page` (default `1`) — page number
- `limit` (default `10`, max `100`) — page size
- `q` — full-text search in `title` and `content` (case-insensitive)
- `categoryId` — only notes that belong to the given category
- `sortBy` — `createdAt` (default) or `title`
- `direction` — `desc` (default) or `asc`

### Categories

| Method | Route               | Description                          | Status      |
|--------|---------------------|--------------------------------------|-------------|
| GET    | `/categories`       | List all categories                  | 200         |
| GET    | `/categories/:id`   | Get a category by ID                 | 200 or 404  |
| POST   | `/categories`       | Create a category (unique `name`)    | 201 or 400  |
| PUT    | `/categories/:id`   | Rename a category                    | 200 or 404  |
| DELETE | `/categories/:id`   | Delete category and unlink from notes| 200 or 404  |

## Example requests

```bash
# Health check
curl http://localhost:3000/health

# Create a note
curl -X POST http://localhost:3000/ressources \
  -H "Content-Type: application/json" \
  -d '{"title":"My note","content":"Hello world"}'

# List notes
curl http://localhost:3000/ressources

# Get one note (replace <id> with actual _id from create response)
curl http://localhost:3000/ressources/<id>

# Update
curl -X PUT http://localhost:3000/ressources/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","content":"New content"}'

# Delete
curl -X DELETE http://localhost:3000/ressources/<id>
```

## Project structure

```
notes-devops/
├── .github/workflows/
│   └── ci.yml             # CI: Lint → Tests → Docker Build
├── client/                 # React (Vite) frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── src/
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/
│   │   ├── note.js        # Note schema
│   │   └── category.js    # Category schema
│   ├── index.js           # App entry, routes (notes + categories)
│   └── seed.js            # Seed script for notes + categories
├── tests/
│   └── ressources.test.js # API tests (Jest + Supertest)
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml     # API + MongoDB services
├── Dockerfile
├── eslint.config.js       # ESLint config
├── package.json
└── README.md
```
