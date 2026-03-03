# Notes API (notes-devops)

REST API for managing notes. Built with Node.js, Express, and MongoDB for a DevOps-focused project (CRUD, tests, CI/CD, Docker).

## Tech stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB
- **ODM:** Mongoose
- **Tests:** Jest + Supertest
- **Env:** dotenv

## Prerequisites

- **Local run:** Node.js (v18+), MongoDB running locally (or a reachable MongoDB URI)
- **Docker run:** Docker and Docker Compose

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone <repo-url>
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

## API routes

| Method | Route              | Description              | Status      |
|--------|--------------------|--------------------------|-------------|
| GET    | `/health`          | Health check             | 200         |
| GET    | `/ressources`      | List all notes           | 200         |
| GET    | `/ressources/:id`  | Get one note by ID       | 200 or 404  |
| POST   | `/ressources`      | Create a note            | 201 or 400  |
| PUT    | `/ressources/:id`  | Update a note            | 200 or 404  |
| DELETE | `/ressources/:id`  | Delete a note            | 200 or 404  |

**Request body for create/update:** JSON with `title` and `content` (both required, non-empty).

**Validation:** Missing or empty `title`/`content` → `400` with error message. Invalid or non-existent ID → `404`.

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
├── src/
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/
│   │   └── note.js        # Note schema
│   └── index.js           # App entry, routes
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

## License

ISC

