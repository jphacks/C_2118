const commentTree = document.querySelector(".comment-tree");
const replyComment = document.querySelector(".comment.reply");
const newCommentForm = document.querySelector("form.new-comment-form");
const newCommentFormSubmitButton = document.querySelector("button.new-comment-form-submit-button");

const agreeReplies = document.querySelector(".replies.agree");
const disagreeReplies = document.querySelector(".replies.disagree");
const neutralReplies = document.querySelector(".replies.neutral");

const commentID = location.pathname.replace("/comment/", "");

newCommentForm.addEventListener("change", () => {
  const formData = new FormData(newCommentForm);

  replyComment.classList.remove("agree");
  replyComment.classList.remove("neutral");
  replyComment.classList.remove("disagree");

  replyComment.classList.add(formData.get("position"));
});

newCommentFormSubmitButton.addEventListener("click", () => {
  const formData = new FormData(newCommentForm);
  let requestData = {};
  requestData.parent_comment_id = commentID;
  requestData.title = formData.get("title");
  requestData.body = formData.get("body");
  if (formData.get("position") === "agree") {
    requestData.position = 1;
  }
  if (formData.get("position") === "neutral") {
    requestData.position = 0;
  }
  if (formData.get("position") === "disagree") {
    requestData.position = -1;
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

const makeCommentElm = (json, hasReply = false) => {
  const commentElm = document.createElement("a");
  commentElm.setAttribute("href", `/comment/${json.comment_id}`);
  commentElm.classList.add("comment");
  switch (json.position) {
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
  commentTitleElm.classList.add("title");
  commentTitleElm.textContent = json.title;
  const commentBodyElm = document.createElement("p");
  commentBodyElm.classList.add("body");
  commentBodyElm.textContent = json.body;

  commentElm.appendChild(commentTitleElm);
  commentElm.appendChild(commentBodyElm);
  if (hasReply) {
    const commentThreadElm = document.createElement("div");
    commentThreadElm.classList.add("thread");
    commentElm.appendChild(commentThreadElm);
  }
  return commentElm;
};

const openReplyForm = (position) => {
  switch (position) {
    case "agree":
      document.querySelector(`.new-comment-form-position[value="agree"]`).checked = true;
      replyComment.classList.add("agree");
      break;
    case "disagree":
      document.querySelector(`.new-comment-form-position[value="disagree"]`).checked = true;
      replyComment.classList.add("disagree");
      break;
    case "neutral":
      document.querySelector(`.new-comment-form-position[value="neutral"]`).checked = true;
      replyComment.classList.add("neutral");
  }
  document.querySelector(".position-buttons").style.display = "none";
  const commentThreadElm = document.createElement("div");
  commentThreadElm.classList.add("thread");
  document.querySelector(".comment-tree div.comment").appendChild(commentThreadElm);
  replyComment.style.display = "block";
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
      commentTree.prepend(makeCommentElm(parent, true));
    }
  });
