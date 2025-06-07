from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os
from routes.polls import polls_bp

app = Flask(__name__, static_folder='../frontend')
CORS(app)  # Enable CORS for all routes

# Register blueprints
app.register_blueprint(polls_bp, url_prefix='/api')

# Serve frontend files
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 