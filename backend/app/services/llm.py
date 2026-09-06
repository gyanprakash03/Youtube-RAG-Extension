from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings


class LLMService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=settings.google_api_key,
            # temperature=0,
        )