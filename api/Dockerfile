# api/Dockerfile

FROM python:3.9-slim

WORKDIR /app

COPY . /app

RUN python -m venv venv && \
    . venv/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

CMD ["sh", "-c", ". venv/bin/activate && python app.py"]
