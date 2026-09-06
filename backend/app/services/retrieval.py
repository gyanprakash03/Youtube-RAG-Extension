from app.services.vector_store import VectorStore


class RetrievalService:
    def __init__(self):
        self.vector_store = VectorStore()

    def retrieve(self, question: str, video_id: str, k: int = 5):
        retriever = self.vector_store.get_retriever(video_id, k)

        return retriever.invoke(question)


    def similarity_search_with_score(
        self,
        question: str,
        limit: int = 5,
    ):
        return self.vector_store.similarity_search_with_score(
            question,
            limit,
        )