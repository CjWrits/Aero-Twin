FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, prebuilt frontend distribution, and launcher
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/
COPY run.py .

# Cloud container port
EXPOSE 8000
ENV PORT=8000

CMD ["python", "run.py"]
