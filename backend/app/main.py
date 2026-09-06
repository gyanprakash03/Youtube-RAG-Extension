from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

# from app.services.transcript import TranscriptService
# from app.services.chunking import ChunkingService
# from app.services.vector_store import VectorStore
# from app.services.retrieval import RetrievalService
from app.services.rag import RAGService
from app.services.ingestion import IngestionService
from app.db.database import create_tables

from sqlalchemy.orm import Session
from app.db.database import get_db
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware



@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(
    title="YouTube RAG API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# vector_store = VectorStore()
# transcript_service = TranscriptService()
# chunking_service = ChunkingService()
# retrieval_service = RetrievalService()
rag_service = RAGService()



class RetrievedChunk(BaseModel):
    text: str
    start_time: float
    end_time: float
    chunk_index: int

class ChatResponse(BaseModel):
    answer: str
    retrieved_chunks: list[RetrievedChunk]

class ChatRequest(BaseModel):
    video_id: str
    question: str
    k: int = 5

class IngestRequest(BaseModel):
    video_id: str

class IngestResponse(BaseModel):
    message: str



@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return rag_service.answer(
        question=request.question,
        video_id=request.video_id,
        k=request.k,
    )


@app.post("/ingest", response_model=IngestResponse)
def ingest(
    request: IngestRequest,
    db: Session = Depends(get_db),
):
    ingestion_service = IngestionService(db)

    try:
        message = ingestion_service.ingest_video(request.video_id)

        return IngestResponse(message=message)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to prepare this video",
        )


# @app.get("/transcript/{video_id}")
# def get_transcript(video_id: str):
#     segments = transcript_service.get_transcript(video_id)

#     return {
#         "video_id": video_id,
#         "segments": [segment.model_dump() for segment in segments],
#     }


# @app.get("/chunks/{video_id}")
# def get_chunks(video_id: str):
#     segments = transcript_service.get_transcript(video_id)

#     chunks = chunking_service.create_chunks(
#         video_id=video_id,
#         segments=segments,
#     )

#     return {
#         "video_id": video_id,
#         "chunks": [chunk.model_dump() for chunk in chunks],
#     }


# @app.get("/search")
# def search(question: str, limit: int = 5):
#     results = retrieval_service.retrieve(
#         question=question,
#         limit=limit,
#     )

#     # return [
#     #     {
#     #         "text": document.page_content,
#     #         "video_id": document.metadata["video_id"],
#     #         "start_time": document.metadata["start_time"],
#     #         "end_time": document.metadata["end_time"],
#     #         "chunk_index": document.metadata["chunk_index"],
#     #     }
#     #     for document in results
#     # ]
#     return results

# @app.get("/search")
# def search(question: str, limit: int = 5):
#     results = retrieval_service.similarity_search_with_score(
#         question,
#         limit,
#     )

#     return [
#         {
#             "score": score,
#             "text": document.page_content,
#             "start_time": document.metadata["start_time"],
#             "end_time": document.metadata["end_time"],
#             "chunk_index": document.metadata["chunk_index"],
#         }
#         for document, score in results
#     ]