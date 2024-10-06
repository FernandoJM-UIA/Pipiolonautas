# app.py
from flask import Flask
import subprocess

app = Flask(__name__)

@app.route('/run-script', methods=['GET'])
def run_script():
    result = subprocess.run(['python', 'starsdummyGen.py'], capture_output=True, text=True)
    return result.stdout

if __name__ == '__main__':
    app.run(port=5000)
