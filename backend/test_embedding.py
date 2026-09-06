from app.services.embedding import EmbeddingService


embedding_service = EmbeddingService()

texts = [
    "Retrieval Augmented Generation allows an LLM to use external information.",
    "Vector databases store embeddings and allow similarity search.",
    "Chunking divides large documents into smaller pieces.",
    "Embeddings represent text as numerical vectors.",
]

vectors = embedding_service.embed_documents(texts)

print(f"Number of texts: {len(texts)}")
print(f"Number of vectors: {len(vectors)}")
print(f"Dimensions of each vector: {len(vectors[0])}")