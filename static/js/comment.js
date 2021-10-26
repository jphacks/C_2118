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

const makeCommentElm = (json) => {
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
  commentTitleElm.textContent = json.title;
  const commentContentElm = document.createElement("p");
  commentContentElm.textContent = json.body;

  commentElm.appendChild(commentTitleElm);
  commentElm.appendChild(commentContentElm);
  return commentElm;
};

fetchReplies()
  .then((replies) => {
    if (replies.agree.length > 0) {
      document.querySelector(".section-message.agree").style.display = "block";
    }
    if (replies.disagree.length > 0) {
      document.querySelector(".section-message.disagree").style.display = "block";
    }
    if (replies.neutral.length > 0) {
      document.querySelector(".section-message.neutral").style.display = "block";
    }
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
