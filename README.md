# Resume AI Upgrade

Production-style GenAI resume application with a Next.js frontend, FastAPI backend, ChromaDB vector store, Sentence Transformers embeddings, and Groq LLM calls.

## Docker Usage

### Prerequisites

- Docker Engine with Docker Compose v2
- A Groq API key

Create `backend/.env` from `backend/.env.example` if it does not already exist:

```bash
cp backend/.env.example backend/.env
```

Set at least:

```bash
GROQ_API_KEY=your_groq_api_key
```

The frontend calls FastAPI through `NEXT_PUBLIC_API_URL`. For local Docker usage, the default is already correct:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If ports `3000` or `8000` are already in use, override the host ports and rebuild the frontend with the matching public backend URL:

```bash
BACKEND_PORT=18000 FRONTEND_PORT=13000 NEXT_PUBLIC_API_URL=http://localhost:18000 docker compose up --build
```

### Start Everything

Run from the project root:

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- Swagger docs: http://localhost:8000/docs

### Container Architecture

```text
Browser
  |
  | http://localhost:3000
  v
frontend container
Next.js app
  |
  | NEXT_PUBLIC_API_URL=http://localhost:8000
  v
backend container
FastAPI routes and services
  |
  | VECTORSTORE_PATH=/app/vectorstore
  v
ChromaDB persistent client
  |
  v
Docker named volume: chroma_vectorstore

backend container also uses:
- Sentence Transformers for embeddings
- Groq API for LLM generation
```

### Vectorstore Persistence

ChromaDB data is stored in the Docker named volume `chroma_vectorstore` and mounted into the backend at:

```text
/app/vectorstore
```

Uploaded/ingested resumes remain searchable after container restarts:

```bash
docker compose down
docker compose up
```

To intentionally delete the persisted vectorstore:

```bash
docker compose down -v
```

### Useful Commands

Build and start:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Stop containers without deleting ChromaDB data:

```bash
docker compose down
```

### Verification Flow

1. Start the stack with `docker compose up --build`.
2. Open http://localhost:3000.
3. Upload a resume PDF and run analysis.
4. Ask a question in the Chat With Resume section.
5. Confirm retrieved chunks and similarity scores are shown.
6. Stop with `docker compose down`.
7. Start again with `docker compose up`.
8. Use the same resume-derived workflow and confirm ChromaDB data persisted.
