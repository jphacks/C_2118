from flask import Flask, render_template, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy

import json
import random
import requests
import os
import datetime

# 環境変数
from dotenv import load_dotenv

load_dotenv()


# ID生成
from snowflake import Snowflake

snowflake = Snowflake()


app = Flask(__name__, static_folder="static")

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Comment(db.Model):
    __tablename__ = "comments"

    comment_id = db.Column(db.String, primary_key=True)  # コメントID
    parent_comment_id = db.Column(db.String, nullable=False)  # 親のコメントID
    title = db.Column(db.String, nullable=False)  # タイトル
    body = db.Column(db.String, nullable=False)  # 本文
    position = db.Column(db.Integer, nullable=False)  # 賛成 or 反対 or 中立
    datetime = db.Column(db.DateTime, nullable=False)  # 日付時間

    def serialize(self):
        return {
            "comment_id": self.comment_id,
            "parent_comment_id": self.parent_comment_id,
            "title": self.title,
            "body": self.body,
            "position": self.position,
            "datetime": f"{self.datetime:%Y-%m-%d %H:%M:%S}",
        }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/comment", methods=["POST"])
def post_comment():
    try:
        comment = json.loads(request.data)
        comment_id = str(snowflake.generate())  # コメントID生成
        new_comment = Comment(
            comment_id=comment_id,
            parent_comment_id=str(comment["parent_comment_id"]),
            title=comment["title"],
            body=comment["body"],
            position=comment["position"],
            datetime=datetime.datetime.today(),
        )

    except KeyError as e:
        print(e)
        abort(400)
    else:
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({"comment_id": comment_id})
    finally:
        pass


@app.route("/comment/<comment_id>", methods=["GET"])
def get_comment(comment_id):
    comment = Comment.query.filter_by(comment_id=comment_id).first()

    if comment is None:
        return render_template("not_found.html"), 404

    return render_template(
        "comment.html",
        comment_id=comment.comment_id,
        parent_comment_id=comment.parent_comment_id,
        title=comment.title,
        body=comment.body,
        position=comment.position,
        datetime=f"{comment.datetime:%Y-%m-%d %H:%M:%S}",
    )


@app.route("/comment/<comment_id>/replies", methods=["GET"])
def get_reply_comments(comment_id):
    agree_replies = Comment.query.filter_by(
        parent_comment_id=comment_id, position=1
    ).all()
    disagree_replies = Comment.query.filter_by(
        parent_comment_id=comment_id, position=-1
    ).all()
    neutral_replies = Comment.query.filter_by(
        parent_comment_id=comment_id, position=0
    ).all()
    return jsonify(
        {
            "agree": [agree_reply.serialize() for agree_reply in agree_replies],
            "disagree": [
                disagree_reply.serialize() for disagree_reply in disagree_replies
            ],
            "neutral": [neutral_reply.serialize() for neutral_reply in neutral_replies],
        }
    )


@app.route("/comments", methods=["GET"])
def get_comments():
    return render_template(
        "comments.html",
        comments=Comment.query.order_by(Comment.comment_id.desc()).all(),
    )


@app.route("/comment/<comment_id>/parents", methods=["GET"])
def get_comment_parents(comment_id):
    parents = []
    parent_comment_id = (
        Comment.query.filter_by(comment_id=comment_id).first().parent_comment_id
    )
    while parent_comment_id != "0":  # 一番上の親コメントまで
        parents.append(
            Comment.query.filter_by(comment_id=parent_comment_id).first().serialize()
        )
        parent_comment_id = parents[-1]["parent_comment_id"]

    return jsonify(parents)


# キーワード抽出
def get_keywords():
    item_data = {
        "app_id": os.environ["GOO_LAB_APP_ID"],
        "title": "",
        "body": "",
        "max_num": 10,
    }
    try:
        response = requests.post("https://labs.goo.ne.jp/api/keyword", json=item_data)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:  # エラーの場合のみ
        print(e)
    else:  # 正常に処理された場合のみ
        response_json = json.loads(response.text)
        print(response_json)
    finally:  # 常に実行
        pass


# テキストペア類似度
def get_textpair():
    item_data = {
        "app_id": os.environ["GOO_LAB_APP_ID"],
        "text1": "",
        "text2": "",
    }
    try:
        response = requests.post("https://labs.goo.ne.jp/api/textpair", json=item_data)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:  # エラーの場合のみ
        print(e)
    else:  # 正常に処理された場合のみ
        response_json = json.loads(response.text)
        print(response_json)
    finally:  # 常に実行
        pass


# CLI用 DB初期化
@app.cli.command("init-db")
def init_db():
    db.create_all()


if __name__ == "__main__":
    app.run()
