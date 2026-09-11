# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from app.core.config import settings


class LLMService:
    def __init__(self):
        self.llm = ChatGroq(
            model="openai/gpt-oss-120b",
            groq_api_key=settings.groq_api_key,
            reasoning_effort="high",
        )

        self.rewrite_llm = ChatGroq(
            model="openai/gpt-oss-120b",
            groq_api_key=settings.groq_api_key,
            reasoning_effort="medium",
        )