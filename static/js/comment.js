const parentComments = document.querySelector(".parent-comments");
const replyComment = document.querySelector(".comment.reply");
const newCommentForm = document.querySelector("form.new-comment-form");
const newCommentFormSubmitButton = document.querySelector("button.new-comment-form-submit-button");

const agreeReplies = document.querySelector(".agree-replies");
const disagreeReplies = document.querySelector(".disagree-replies");
const neutralReplies = document.querySelector(".neutral-replies");

const commentID = location.pathname.replace("/comment/", "");

newCommentForm.addEventListener("change", () => {
  const formData = new FormData(newCommentForm);

  replyComment.classList.remove("agree");
  replyComment.classList.remove("neutral");
  replyComment.classList.remove("disagree");
  switch (formData.get("position")) {
    case "agree":
      replyComment.classList.add("agree");
      break;
    case "disagree":
      replyComment.classList.add("disagree");
      break;
    case "neutral":
      replyComment.classList.add("neutral");
  }
});

newCommentFormSubmitButton.addEventListener("click", () => {
  const formData = new FormData(newCommentForm);
  let requestData = {};
  requestData.parent_comment_id = commentID;
  requestData.title = formData.get("title");
  requestData.text = formData.get("content");
  if (formData.get("position") === "agree") {
    requestData.attribute = 1;
  }
  if (formData.get("position") === "neutral") {
    requestData.attribute = 0;
  }
  if (formData.get("position") === "disagree") {
    requestData.attribute = -1;
  }
  fetch(`/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(requestData)
  }).then((response) => {
    return response.json();
  }).then((responseJSON) => {
    location.pathname = `/comment/${responseJSON.comment_id}`;
  }).catch((error) => {
    console.error(error);
  });
});

const fetchReplies = async () => {
  return fetch(`${location.pathname}/replies`)
    .then((response) => {
      return response.json();
    }).then((responseJSON) => {
      return responseJSON;
    }).catch((error) => {
      console.error(error);
    });
};

const fetchParents = async () => {
  return fetch(`${location.pathname}/parents`)
    .then((response) => {
      return response.json();
    }).then((responseJSON) => {
      return responseJSON;
    }).catch((error) => {
      console.error(error);
    });
};

const makeCommentElm = (json) => {
  const commentElm = document.createElement("div");
  commentElm.classList.add("comment");
  switch (json.attribute) {
    case 1:
      commentElm.classList.add("agree");
      break;
    case -1:
      commentElm.classList.add("disagree");
      break;
    case 0:
      commentElm.classList.add("neutral");
  }
  const commentTitleElm = document.createElement("h2");
  const commentTitleLinkElm = document.createElement("a");
  commentTitleLinkElm.setAttribute("href", json.comment_id);
  commentTitleLinkElm.textContent = json.title;
  const commentContentElm = document.createElement("p");
  commentContentElm.textContent = json.text;

  commentTitleElm.appendChild(commentTitleLinkElm);
  commentElm.appendChild(commentTitleElm);
  commentElm.appendChild(commentContentElm);
  return commentElm;
};

fetchReplies()
  .then((replies) => {
    console.log(replies);
    for (reply of replies.agree) {
      agreeReplies.appendChild(makeCommentElm(reply));
    }
    for (reply of replies.disagree) {
      disagreeReplies.appendChild(makeCommentElm(reply));
    }
    for (reply of replies.neutral) {
      neutralReplies.appendChild(makeCommentElm(reply));
    }
  });

fetchParents()
  .then((parents) => {
    console.log(parents);
    for (parent of parents) {
      parentComments.prepend(makeCommentElm(parent));
    }
  })
