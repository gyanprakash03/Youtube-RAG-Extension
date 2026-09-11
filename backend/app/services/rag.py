from app.prompts.rag import rag_prompt
from app.services.llm import LLMService
from app.services.retrieval import RetrievalService
from app.prompts.query_rewrite import query_rewrite_prompt


class RAGService:
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.llm_service = LLMService()

        self.rewrite_chain = query_rewrite_prompt | self.llm_service.llm
        self.chain = rag_prompt | self.llm_service.llm


    def answer(self, question: str, video_id: str, history: list, k: int = 5):
        history_text = "\n".join(
            f"{message.role}: {message.content}"
            for message in history
        )

        rewritten_question = self.rewrite_chain.invoke({
            "history": history_text,
            "question": question,
        })
        rewritten_question = rewritten_question.text

        documents = self.retrieval_service.retrieve(rewritten_question, video_id, k)

        context = self.format_documents(documents)

        response = self.chain.invoke({
            "history": history_text,
            "context": context,
            "question": question,
        })

        answer = response.text

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