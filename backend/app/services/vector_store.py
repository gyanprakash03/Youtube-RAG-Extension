from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, FieldCondition, Filter, MatchValue
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document

from app.core.config import settings
from app.services.embedding import EmbeddingService
import uuid


class VectorStore:
    COLLECTION_NAME = "youtube_transcripts"

    def __init__(self):
        self.embedding_service = EmbeddingService()

        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )

        if not self.client.collection_exists(self.COLLECTION_NAME):
            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=1536,
                    distance=Distance.COSINE,
                ),
            )

            self.client.create_payload_index(
                collection_name=self.COLLECTION_NAME,
                field_name="metadata.video_id",
                field_schema="keyword",
            )

        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=self.COLLECTION_NAME,
            embedding=self.embedding_service.embeddings,
        )
        

    def add_documents(self, documents: list[Document]):
        ids = [
            str(uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"{document.metadata['video_id']}:{document.metadata['chunk_index']}",
                )
            )
            for document in documents
        ]

        return self.vector_store.add_documents(
            documents=documents,
            ids=ids,
        )

    def get_retriever(self, video_id: str, k: int = 5):
        return self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": k,
                "filter": Filter(
                    must=[
                        FieldCondition(
                            key="metadata.video_id",
                            match=MatchValue(value=video_id),
                        )
                    ]
                ),
            },
        )


    def similarity_search_with_score(self, question: str, k: int = 5):
        return self.vector_store.similarity_search_with_score(
            query=question,
            k=k,
        )


    # def recreate_collection(self):
    #     self.client.delete_collection(self.COLLECTION_NAME)

    #     self.client.create_collection(
    #         collection_name=self.COLLECTION_NAME,
    #         vectors_config=VectorParams(
    #             size=1536,
    #             distance=Distance.COSINE,
    #         ),
    #     )

    #     self.vector_store = QdrantVectorStore(
    #         client=self.client,
    #         collection_name=self.COLLECTION_NAME,
    #         embedding=self.embedding_service.embeddings,
    #     )