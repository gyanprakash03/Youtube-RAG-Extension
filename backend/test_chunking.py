from app.services.chunking import ChunkingService
from app.models.transcript import TranscriptSegment


segments = [
    TranscriptSegment(
        text="Today we're going to talk about retrieval augmented generation.",
        start_time=0,
        end_time=5,
    ),
    TranscriptSegment(
        text="RAG allows a language model to retrieve relevant information.",
        start_time=5,
        end_time=11,
    ),
    TranscriptSegment(
        text="That information is then provided to the model as context.",
        start_time=11,
        end_time=17,
    ),
    TranscriptSegment(
        text="The model can then use that context to produce a better answer.",
        start_time=17,
        end_time=24,
    ),
]


chunking_service = ChunkingService(
    chunk_size=100,
    chunk_overlap=20,
)

chunks = chunking_service.create_chunks(
    video_id="test123",
    segments=segments,
)

for chunk in chunks:
    print("=" * 50)
    print(f"Chunk index: {chunk.metadata["chunk_index"]}")
    print(f"Start: {chunk.metadata["start_time"]}")
    print(f"End: {chunk.metadata["end_time"]}")
    print(chunk.page_content)