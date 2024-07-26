# Используйте подходящий базовый образ
FROM python:3.10

# Установите необходимые зависимости
RUN pip install --upgrade pip

# Установите зависимости из requirements.txt
COPY requirements.txt .
RUN pip install -r requirements.txt

# Скопируйте приложение
COPY . /app

# Установите рабочую директорию
WORKDIR /app

# Запустите приложение
CMD ["python", "app.py"]
