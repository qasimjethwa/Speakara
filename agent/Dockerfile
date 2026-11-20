# Speakara companion agent worker: a long-running LiveKit Agents process (not for Vercel).
FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
RUN useradd --create-home --uid 10001 appuser
WORKDIR /home/appuser/app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY prompts.py agent.py ./
RUN python agent.py download-files || true
USER appuser
CMD ["python", "agent.py", "start"]
