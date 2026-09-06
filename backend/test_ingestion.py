from app.db.database import SessionLocal
from app.services.ingestion import IngestionService


db = SessionLocal()

try:
    ingestion_service = IngestionService(db)

    result = ingestion_service.ingest_video("JHdl2qcwZxs")

    print(result)

finally:
    db.close()