from flask import Flask, request, jsonify
import openai

app = Flask(__name__)

# Устанавливаем API ключ OpenAI
openai.api_key = 'YOUR_OPENAI_API_KEY'

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text')
    target_language = data.get('language')
    
    # Используем OpenAI для перевода сообщения
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=f"Translate the following message to {target_language}: {text}",
        max_tokens=60
    )
    translated_text = response.choices[0].text.strip()
    return jsonify({'translated_text': translated_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

