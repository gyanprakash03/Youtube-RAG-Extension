import time
import httpx
from app.core.config import settings
from app.models.transcript import TranscriptSegment


class TranscriptService:
    BASE_URL = "https://api.supadata.ai/v1/transcript"

    def get_transcript(self, video_id: str) -> list[TranscriptSegment]:
        headers = {
            "x-api-key": settings.supadata_api_key,
        }

        params = {
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "lang": "en",
            "mode": "auto",
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                self.BASE_URL,
                headers=headers,
                params=params,
            )

            if response.status_code == 202:
                data = response.json()
                data = self._wait_for_job(
                    client=client,
                    job_id=data["jobId"],
                    headers=headers,
                )
            else:
                response.raise_for_status()
                data = response.json()

        return self._parse_segments(data)


    def _wait_for_job(
        self,
        client: httpx.Client,
        job_id: str,
        headers: dict,
    ):
        for _ in range(120):
            time.sleep(1)

            response = client.get(
                f"{self.BASE_URL}/{job_id}",
                headers=headers,
            )

            response.raise_for_status()

            data = response.json()
            status = data["status"]

            if status == "completed":
                return data

            if status == "failed":
                error = data.get("error", {})
                message = error.get(
                    "message",
                    "Transcript generation failed.",
                )
                raise RuntimeError(message)

        raise TimeoutError(
            "Transcript processing timed out."
        )
    

    def _parse_segments(self, data) -> list[TranscriptSegment]:
        segments = []

        for snippet in data.get("content", []):
            text = " ".join(snippet["text"].split()).strip()

            if not text:
                continue

            start_time = snippet["offset"] / 1000
            end_time = start_time + (
                snippet["duration"] / 1000
            )

            segments.append(
                TranscriptSegment(
                    text=text,
                    start_time=round(start_time, 2),
                    end_time=round(end_time, 2),
                )
            )

        if not segments:
            raise ValueError(
                "No transcript segments are available for this video."
            )

        return segments