from flask import Flask, render_template, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy

import json
import random
import requests
import os
import datetime

from typing import List

# 環境変数
from dotenv import load_dotenv

load_dotenv()

# index.htmlの新着親コメント表示数
DISPLAY_COMMENT_COUNT = 5

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
    keywords = db.Column(db.String, nullable=False)  # 抽出したキーワード
    similar_to = db.Column(db.String, nullable=False)  # 類似しているコメントのID
    has_similar_comment = db.Column(db.Boolean, nullable=False)

    def serialize(self):
        return {
            "comment_id": self.comment_id,
            "parent_comment_id": self.parent_comment_id,
            "title": self.title,
            "body": self.body,
            "position": self.position,
            "datetime": f"{self.datetime:%Y-%m-%d %H:%M:%S}",
            "keywords": self.keywords,
            "similar_to": self.similar_to,
            "has_similar_comment": self.has_similar_comment,
        }


@app.route("/")
def index():
    now_page = int(request.args.get("p")) if request.args.get("p") is not None else 1
    is_last_page = Comment.query.filter_by(parent_comment_id="0").count() <= now_page * DISPLAY_COMMENT_COUNT

    return render_template(
        "index.html",
        comments=Comment.query.filter_by(parent_comment_id="0")
        .order_by(Comment.datetime.desc())
        .offset(DISPLAY_COMMENT_COUNT * (now_page - 1))
        .limit(DISPLAY_COMMENT_COUNT)
        .all(),
        now_page=now_page,
        is_last_page=is_last_page,
    )

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
            has_similar_comment=False,
        )

    except KeyError as e:
        print(e)
        abort(400)
    else:
        # 類似コメント
        candidates = []
        for old_comment in Comment.query.filter_by(
            parent_comment_id=new_comment.parent_comment_id
        ).all():
            similarity = get_similarity(new_comment.body, old_comment.body)
            if similarity >= 0.6:  # 閾値
                candidates.append(
                    (similarity, old_comment.comment_id)
                )  # (類似度, コメントID)のtupleで格納

        # 候補リストが空でなければ一番類似度が高いやつを採用
        new_comment.similar_to = (
            list(sorted(candidates, key=lambda x: x[0]))[-1][1] if candidates else "0"
        )
        # has_similar_comment変更
        similar_comment = Comment.query.filter_by(
            comment_id=new_comment.similar_to
        ).first()
        if similar_comment:
            similar_comment.has_similar_comment = True
            db.session.commit()

        # キーワード
        new_comment.keywords = json.dumps(
            get_keywords(new_comment.title, new_comment.body)
        )

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
        keywords=" ".join(json.loads(comment.keywords)),
        similar_to=comment.similar_to,
    )


@app.route("/comment/<comment_id>/replies", methods=["GET"])
def get_reply_comments(comment_id):
    agree_replies = Comment.query.filter_by(
        parent_comment_id=comment_id, position=1, similar_to="0"
    ).all()
    disagree_replies = Comment.query.filter_by(
        parent_comment_id=comment_id, position=-1, similar_to="0"
    ).all()
    neutral_replies = Comment.query.filter_by(
        parent_comment_id=comment_id, position=0, similar_to="0"
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


@app.route("/comment/<comment_id>/get_similar_comments", methods=["GET"])
def get_similar_comments(comment_id):
    return jsonify(
        [
            comment.serialize()
            for comment in Comment.query.filter_by(similar_to=comment_id).all()
        ]
    )


# キーワード抽出
def get_keywords(title: str, body: str) -> List[str]:
    item_data = {
        "app_id": os.environ["GOO_LAB_APP_ID"],
        "title": title,
        "body": body,
        "max_num": 10,
    }
    try:
        response = requests.post("https://labs.goo.ne.jp/api/keyword", json=item_data)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:  # エラーの場合のみ
        print(e)
        return []
    else:  # 正常に処理された場合のみ
        response_json = json.loads(response.text)
        keywords = []
        for keyword in response_json["keywords"]:
            keywords.append(list(keyword.keys())[0])
        return keywords
    finally:  # 常に実行
        pass


# テキストペア類似度
def get_similarity(text1: str, text2: str) -> float:
    item_data = {
        "app_id": os.environ["GOO_LAB_APP_ID"],
        "text1": text1,
        "text2": text2,
    }
    try:
        response = requests.post("https://labs.goo.ne.jp/api/textpair", json=item_data)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:  # エラーの場合のみ
        print(e)
        return 0.0
    else:  # 正常に処理された場合のみ
        response_json = json.loads(response.text)
        return response_json["score"]
    finally:  # 常に実行
        pass


# CLI用 DB初期化
@app.cli.command("init-db")
def init_db():
    db.create_all()


if __name__ == "__main__":
    app.run()
