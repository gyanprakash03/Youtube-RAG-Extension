from app.services.chunking import ChunkingService
from app.services.transcript import TranscriptService
from app.services.vector_store import VectorStore

from sqlalchemy.orm import Session
from app.repositories.video import VideoRepository
from datetime import datetime, timezone


class IngestionService:
    def __init__(self, db: Session):
        self.video_repository = VideoRepository(db)

        self.transcript_service = TranscriptService()
        self.chunking_service = ChunkingService()
        self.vector_store = VectorStore()


    def ingest_video(self, video_id: str):
        video = self.video_repository.get(video_id)

        if video is not None and video.status == "ready":
            return "video already ingested"

        if video is None:
            self.video_repository.create(video_id)
        else:
            self.video_repository.update_status(video_id, "processing")

        try:
            segments = self.transcript_service.get_transcript(video_id)

            chunks = self.chunking_service.create_chunks(
                video_id=video_id,
                segments=segments,
            )

            self.vector_store.add_documents(chunks)

            self.video_repository.update_status(video_id, "ready")

            return "video ingested"

        except Exception:
            self.video_repository.update_status(video_id, "failed")
            raise