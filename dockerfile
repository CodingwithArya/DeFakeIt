# Use an official lightweight Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a working directory
WORKDIR /app

# Copy everything into the container
COPY . /app

# install requirements
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5001 (bc MAC uses 5000 for AirTunes) for Flask
EXPOSE 5001

# Command to run the app
CMD ["python", "server.py"]