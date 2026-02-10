"""Flask web application for displaying environment information."""

from flask import Flask, render_template, jsonify, request
from app.system_info import get_all_info
import os
import logging

# Configure logging
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__, template_folder="templates", static_folder="../static")

# Configuration
app.config["PORT"] = int(os.environ.get("PORT", 8080))
app.config["REFRESH_INTERVAL"] = int(os.environ.get("REFRESH_INTERVAL", 30))


@app.route("/")
def index():
    """Render main dashboard."""
    try:
        info = get_all_info(request)
        return render_template(
            "index.html", refresh_interval=app.config["REFRESH_INTERVAL"]
        )
    except Exception as e:
        logger.error(f"Error rendering index: {e}")
        return f"Error: {str(e)}", 500


@app.route("/api/info")
def api_info():
    """API endpoint for system information."""
    try:
        info = get_all_info(request)
        return jsonify(info)
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    """Health check endpoint for liveness probe."""
    return jsonify({"status": "healthy"}), 200


@app.route("/ready")
def ready():
    """Readiness check endpoint."""
    return jsonify({"status": "ready"}), 200


if __name__ == "__main__":
    port = app.config["PORT"]
    logger.info(f"Starting Canary Piet on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
