from youtube_transcript_api import YouTubeTranscriptApi
from app.models.transcript import TranscriptSegment


class TranscriptService:
    def __init__(self):
        self.youtube_api = YouTubeTranscriptApi()

    def get_transcript(self, video_id: str) -> list[TranscriptSegment]:
        transcript_list = self.youtube_api.list(video_id)

        transcript = self._select_transcript(transcript_list)

        fetched_transcript = transcript.fetch()

        segments = []

        for snippet in fetched_transcript:
            text = " ".join(snippet.text.split()).strip()

            if not text:
                continue

            segments.append(
                TranscriptSegment(
                    text=text,
                    start_time=round(snippet.start, 2),
                    end_time=round(snippet.start + snippet.duration, 2)
                )
            )

        return segments


    def _select_transcript(self, transcript_list):
        transcripts = list(transcript_list)

        # Prefer manually created English
        for transcript in transcripts:
            if (
                transcript.language_code == "en"
                and not transcript.is_generated
            ):
                return transcript

        # Then prefer auto-generated English
        for transcript in transcripts:
            if (
                transcript.language_code == "en"
                and transcript.is_generated
            ):
                return transcript

        # Finally, use whatever transcript is available
        if transcripts:
            return transcripts[0]

        raise ValueError("No transcripts are available for this video.")