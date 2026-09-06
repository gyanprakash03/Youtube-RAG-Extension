from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import Video


class VideoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, video_id: str) -> Video | None:
        return self.session.get(Video, video_id)

    def create(self, video_id: str) -> Video:
        now = datetime.now(timezone.utc)

        video = Video(
            video_id=video_id,
            status="processing",
            created_at=now,
            updated_at=now,
        )

        self.session.add(video)
        self.session.commit()
        self.session.refresh(video)

        return video


    def update_status(self, video_id: str, status: str):
        video = self.session.get(Video, video_id)

        if video is None:
            return

        video.status = status
        video.updated_at = datetime.now(timezone.utc)

        self.session.commit()