from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.models.transcript import TranscriptSegment


class ChunkingService:
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )


    def create_chunks(
        self,
        video_id: str,
        segments: list[TranscriptSegment],
    ) -> list[Document]:

        full_text, segment_ranges = self._build_text_and_ranges(segments)

        text_chunks = self.splitter.split_text(full_text)

        chunks = []
        search_position = 0

        for index, chunk_text in enumerate(text_chunks):
            start_position = full_text.find(chunk_text, search_position)

            if start_position == -1:
                continue

            end_position = start_position + len(chunk_text)

            contributing_segments = [
                segment
                for segment, segment_start, segment_end in segment_ranges
                if segment_end > start_position
                and segment_start < end_position
            ]

            if not contributing_segments:
                continue

            chunks.append(
                Document(
                    id=f"{video_id}:{index}",
                    page_content=chunk_text,
                    metadata={
                        "video_id": video_id,
                        "start_time": contributing_segments[0].start_time,
                        "end_time": contributing_segments[-1].end_time,
                        "chunk_index": index,
                    },
                )
            )

            search_position = start_position + max(
                1,
                len(chunk_text) - self.chunk_overlap,
            )

        return chunks


    def _build_text_and_ranges(
        self,
        segments: list[TranscriptSegment],
    ):
        parts = []
        segment_ranges = []

        current_position = 0

        for segment in segments:
            if parts:
                parts.append(" ")
                current_position += 1

            start_position = current_position

            parts.append(segment.text)
            current_position += len(segment.text)

            end_position = current_position

            segment_ranges.append(
                (
                    segment,
                    start_position,
                    end_position,
                )
            )

        return "".join(parts), segment_ranges