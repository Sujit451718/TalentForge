FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Expose the port Flask/Gunicorn will run on
EXPOSE 7860

# Command to run the app (Hugging Face expects port 7860)
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "app:create_app()"]
