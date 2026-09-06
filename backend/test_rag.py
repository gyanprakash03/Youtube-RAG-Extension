from app.services.rag import RAGService

rag_service = RAGService()

answer = rag_service.answer(
    question="Which joke is offensive?",
    video_id="JHdl2qcwZxs"
)

print(answer)