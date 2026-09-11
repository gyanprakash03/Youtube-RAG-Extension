from app.prompts.rag import rag_prompt
from app.services.llm import LLMService
from app.services.retrieval import RetrievalService
from app.services.reranker import RerankerService
from app.prompts.query_rewrite import query_rewrite_prompt
import time


class RAGService:
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.reranker_service = RerankerService()
        self.llm_service = LLMService()

        self.rewrite_chain = query_rewrite_prompt | self.llm_service.rewrite_llm
        self.chain = rag_prompt | self.llm_service.llm


    def answer(self, question: str, video_id: str, history: list):
        total_start = time.perf_counter()

        # -------------------------
        # Query rewriting
        # -------------------------
        start = time.perf_counter()

        history_text = "\n".join(
            f"{message.role}: {message.content}"
            for message in history
        )

        rewritten_question = self.rewrite_chain.invoke({
            "history": history_text,
            "question": question,
        })

        rewritten_question = rewritten_question.text

        print(
            f"Query rewrite: {time.perf_counter() - start:.2f}s"
        )

        # -------------------------
        # Hybrid retrieval
        # -------------------------
        start = time.perf_counter()

        documents = self.retrieval_service.retrieve(
            rewritten_question,
            video_id,
        )

        print(
            f"Hybrid retrieval: {time.perf_counter() - start:.2f}s"
        )

        # -------------------------
        # Reranking
        # -------------------------
        start = time.perf_counter()

        documents = self.reranker_service.rerank(
            rewritten_question,
            documents,
        )

        print(
            f"Reranking: {time.perf_counter() - start:.2f}s"
        )

        # -------------------------
        # Context formatting
        # -------------------------
        start = time.perf_counter()

        context = self.format_documents(documents)

        print(
            f"Context formatting: {time.perf_counter() - start:.2f}s"
        )

        # -------------------------
        # Final answer generation
        # -------------------------
        start = time.perf_counter()

        response = self.chain.invoke({
            "history": history_text,
            "context": context,
            "question": question,
        })

        answer = response.text

        print(
            f"Final LLM: {time.perf_counter() - start:.2f}s"
        )

        print(
            f"TOTAL: {time.perf_counter() - total_start:.2f}s"
        )

        return {
            "answer": answer,
        }
    

    def format_documents(self, documents):
        return "\n\n".join(
            f"[{document.metadata['start_time']} - "
            f"{document.metadata['end_time']}]\n"
            f"{document.page_content}"
            for document in documents
        )