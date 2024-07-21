from flask import Flask, request, jsonify
import openai
import os
import logging

app = Flask(__name__)

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Загружаем ключ API из переменных окружения
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    logging.info(f"Received data: {data}")
    text = data.get('text')
    target_language = data.get('language')
    action = data.get('action')

    try:
        if action == 'get_language_name':
            prompt = f"Translate the following language name to English: {text}"
        elif action == 'translate_text':
            prompt = f"Translate the following text to {target_language}: {text}"
        else:
            return jsonify({"error": "Invalid action"}), 400

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a translator."},
                {"role": "user", "content": prompt}
            ]
        )
        logging.info(f"OpenAI response: {response}")
        translated_text = response.choices[0].message['content'].strip()
        return jsonify({"translated_text": translated_text})
    except Exception as e:
        logging.error(f"Error during translation: {e}", exc_info=True)
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
