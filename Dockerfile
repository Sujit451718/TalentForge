FROM python:3.10-slim

WORKDIR /app

# Install dependencies from backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Command to run the app using Render's dynamic port
CMD gunicorn --bind 0.0.0.0:$PORT "app:create_app()"
