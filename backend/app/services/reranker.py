from langchain_cohere import CohereRerank
from app.core.config import settings


class RerankerService:
    def __init__(self):
        self.reranker = CohereRerank(
            cohere_api_key=settings.cohere_api_key,
            model="rerank-v4.0-fast",
            top_n=5,
        )

    def rerank(
        self,
        question: str,
        documents: list,
    ):
        return self.reranker.compress_documents(
            documents,
            question,
        )