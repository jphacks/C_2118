from flask import Flask, jsonify, request
import json

from src import sentiment_analysis

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


@app.route("/positiveness", methods=["POST"])
def get_positiveness():
    req = json.loads(request.data)
    comment_body = req["body"]
    positiveness = sentiment_analysis.predict(comment_body)
    return jsonify({"positiveness": positiveness})

if __name__ == "__main__":
    app.run()
