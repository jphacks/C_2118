from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy

import json

import random

app = Flask(__name__, static_folder="static")

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Comment(db.Model):
    __tablename__ = "comments"

    comment_id = db.Column(db.String, primary_key=True)  # コメントID
    parent_comment_id = db.Column(db.String, nullable=False)  # 親のコメントID
    title = db.Column(db.String, nullable=False)  # タイトル
    text = db.Column(db.String, nullable=False)  # 本文
    attribute = db.Column(db.Integer, nullable=False)  # 賛成 or 反対 or 中立


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/comment", methods=["POST"])
def post_comment():
    comment = json.loads(request.data)
    new_comment = Comment(
        comment_id=str(random.randint(1, 100000)),
        parent_comment_id=comment["parent_comment_id"],
        title=comment["title"],
        text=comment["text"],
        attribute=comment["attribute"],
    )

    db.session.add(new_comment)
    db.session.commit()

    return comment["title"]


@app.route("/comment/<comment_id>", methods=["GET"])
def get_comment(comment_id):
    comment = Comment.query.filter_by(comment_id=comment_id).first()

    return render_template(
        "comment.html",
        comment_id=comment.comment_id,
        parent_comment_id=comment.parent_comment_id,
        title=comment.title,
        text=comment.text,
        attribute=comment.attribute,
    )


@app.route("/comments", methods=["GET"])
def get_comment_all():
    return render_template(
        "comments.html",
        comments=Comment.query.order_by(Comment.comment_id.desc()).all(),
    )


# CLI用 DB初期化
@app.cli.command("init-db")
def init_db():
    db.create_all()


if __name__ == "__main__":
    app.run()
