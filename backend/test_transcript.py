from youtube_transcript_api import YouTubeTranscriptApi

video_id = "dQw4w9WgXcQ"

ytt_api = YouTubeTranscriptApi()
transcript = ytt_api.fetch(video_id)

print(f"Video ID: {transcript.video_id}")
print(f"Language: {transcript.language}")
print(f"Language code: {transcript.language_code}")
print(f"Generated: {transcript.is_generated}")
print(f"Number of snippets: {len(transcript)}")

for snippet in transcript[:5]:
    print(snippet)