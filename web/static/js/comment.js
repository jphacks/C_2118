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

newCommentForm.addEventListener("input", () => {
  const formData = new FormData(newCommentForm);
  if (formData.get("title") === "" || formData.get("body") === "" || formData.get("position") === "") {
    newCommentFormSubmitButton.disabled = true;
  } else {
    newCommentFormSubmitButton.disabled = false;
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

const fetchSimilarComments = async (comment_id) => {
  return fetch(`/comment/${comment_id}/get_similar_comments`) // 一日一回 URLは資源を書け、動作はMethodで表現しろの舞
    .then((response) => {
      return response.json();
    }).then((responseJSON) => {
      return responseJSON;
    }).catch((error) => {
      console.error(error);
    });
}

const makeCommentElm = (json, hasReply = false, checkSimilarComment = false) => {
  const fragment = document.createDocumentFragment();
  let commentElm;
  if (checkSimilarComment && json.has_similar_comment) {
    commentElm = document.createElement("button");
    commentElm.type = "button";
    commentElm.addEventListener("click", (ev) => { expandSimilarComment(ev.currentTarget, json.comment_id) });
    commentElm.classList.add("has-similar-comment");
  } else {
    commentElm = document.createElement("a");
    commentElm.setAttribute("href", `/comment/${json.comment_id}`);
  }

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
  fragment.append(commentElm);

  if (checkSimilarComment && json.has_similar_comment) {
    const similarCommentArea = document.createElement("div");
    commentElm.classList.add("contracted");
    similarCommentArea.classList.add("similar-comment-area", "contracted");
    fragment.append(similarCommentArea);
  }

  return fragment;
};

const expandSimilarComment = (target, comment_id) => {
  if (target.isExpanded) {
    target.classList.remove("expanded");
    target.nextElementSibling.style.display = "none";
    target.classList.add("contracted");
    target.isExpanded = false;
    return;
  }
  if (target.alreadyFetchedSimilarComment) {
    target.classList.remove("contracted");
    target.nextElementSibling.style.display = "block";
    target.classList.add("expanded");
    target.isExpanded = true;
    return;
  }
  fetchSimilarComments(comment_id)
    .then((similarComments) => {
      const similarCommentArea = target.nextElementSibling;
      console.log(similarComments);
      for (similarComment of similarComments) {
        similarCommentArea.appendChild(makeCommentElm(similarComment, false, false));
      }
      target.alreadyFetchedSimilarComment = true;
      target.classList.remove("contracted");
      target.classList.add("expanded");
      target.isExpanded = true;
    });
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

fetchParents()
  .then((parents) => {
    console.log(parents);
    for (parent of parents) {
      commentTree.prepend(makeCommentElm(parent, true, false));
    }
  }).then(() => {
    window.scrollTo(0, document.querySelector(".comment-tree div.comment").getBoundingClientRect().top);
  });

fetchReplies()
  .then((replies) => {
    console.log(replies);
    for (reply of replies.agree) {
      agreeReplies.appendChild(makeCommentElm(reply, false, true));
    }
    for (reply of replies.disagree) {
      disagreeReplies.appendChild(makeCommentElm(reply, false, true));
    }
    for (reply of replies.neutral) {
      neutralReplies.appendChild(makeCommentElm(reply, false, true));
    }
  });
