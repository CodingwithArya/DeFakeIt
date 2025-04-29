# using lightweight Python image for docker (we don't need anything fancy)
FROM python:3.10-slim

# setting env vars
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# creating working directory
WORKDIR /app

# copying Flask app into directory
COPY . /app
COPY mesonet_model/ /app/mesonet_model/

# install requirements (using requirements.txt)
RUN pip install --no-cache-dir -r requirements.txt

# command to run app (choosing language and specific file that houses app)
CMD ["python", "server.py"]