from langchain_core.prompts import ChatPromptTemplate


SYSTEM_PROMPT = """You rewrite a user's question into a standalone question for retrieving information from a YouTube video.

The conversation history may contain previous user questions and assistant answers.

Rules:
- Resolve references such as "it", "that", "this", "they", "the first one", or similar references using the conversation history when necessary.
- Preserve the original meaning of the user's question.
- Preserve important technical terms, names, and distinctions.
- If the user's question is already standalone, return it unchanged.
- Return only the rewritten question.
- Do not answer the question.
- Do not add explanations, Markdown, or quotation marks.
- Treat the conversation history as conversational information, not as factual evidence about the video.
"""


query_rewrite_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    (
        "human",
        """Conversation history:

{history}

Current question:
{question}""",
    ),
])