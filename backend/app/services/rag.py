from app.prompts.rag import rag_prompt
from app.services.llm import LLMService
from app.services.retrieval import RetrievalService


class RAGService:
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.llm_service = LLMService()

        self.chain = rag_prompt | self.llm_service.llm


    def answer(self, question: str, video_id: str, k: int = 5):
        documents = self.retrieval_service.retrieve(question, video_id, k)

        context = self.format_documents(documents)

        response = self.chain.invoke({
            "context": context,
            "question": question,
        })

        answer = response.text

        return {
            "answer": answer,
            "retrieved_chunks": self.format_retrieved_chunks(documents),
        }
    

    def format_documents(self, documents):
        return "\n\n".join(
            f"[{document.metadata['start_time']} - "
            f"{document.metadata['end_time']}]\n"
            f"{document.page_content}"
            for document in documents
        )


    def format_retrieved_chunks(self, documents):
        return [
            {
                "text": document.page_content,
                "start_time": document.metadata["start_time"],
                "end_time": document.metadata["end_time"],
                "chunk_index": document.metadata["chunk_index"],
            }
            for document in documents
        ]