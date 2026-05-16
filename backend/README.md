# Cradle Ecosystem Portal — Backend

FastAPI + LangGraph + Neo4j AuraDB + Vertex AI (Gemini, Claude, Grok, Mistral OCR)

## Quick Start

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_REGION
# Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
```

### 3. Verify connections
```bash
python -c "import vertexai; vertexai.init(project='YOUR_PROJECT', location='us-central1'); print('Vertex AI OK')"
python -c "
from neo4j import GraphDatabase
d = GraphDatabase.driver('YOUR_NEO4J_URI', auth=('neo4j', 'YOUR_PASSWORD'))
d.verify_connectivity(); print('Neo4j OK'); d.close()
"
```

### 4. Run
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Neo4j is seeded automatically on first run.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check — Vertex AI + Neo4j status |
| POST | `/api/apply` | Submit application, start LangGraph pipeline |
| GET | `/api/apply/{id}/stream` | SSE stream of Gatekeeper eligibility reasoning |
| GET | `/api/apply/{id}/status` | Current pipeline status + eligibility result |
| POST | `/api/interview/{id}/generate` | Generate Claude interview questions |
| POST | `/api/interview/{id}/submit` | Submit interview answers, trigger judging |
| GET | `/api/judge/queue` | All applications sorted by submission date |
| GET | `/api/judge/{id}` | Full consolidated 3-model analysis |
| POST | `/api/judge/{id}/verdict` | Submit APPROVE/DECLINE verdict |
| GET | `/api/graph/ecosystem` | Neo4j graph as `{nodes, links}` |
| POST | `/api/milestone/{id}/upload` | Upload video, trigger Gemini vision verification |
| GET | `/api/milestone/{id}/status` | Milestone checklist result |

## Architecture

```
POST /api/apply
  → ocr_node (Mistral OCR + Gemini extraction)
  → few_shot_retrieval (Neo4j historical cases)
  → screening_agent (Gemini Gatekeeper, SSE streamed)
     ├── FAIL → rejection_node → END
     └── PASS/MANUAL_REVIEW → interview_agent (Claude)

POST /api/interview/{id}/submit
  → judging_consolidator (Gemini + Claude + Grok in parallel via asyncio.gather)

POST /api/judge/{id}/verdict
  → alignment_node (compute +1/-1 score)
  → linkage_node (write to Neo4j: Startup, ENROLLED_IN, MATCHED_TO, REVIEWED_BY)
```
