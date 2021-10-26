const replyComment = document.querySelector(".comment.reply");
const newCommentForm = document.querySelector("form.new-comment-form");
const newCommentFormSubmitButton = document.querySelector("button.new-comment-form-submit-button");

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
  console.log(requestData);
  fetch(`${location.pathname}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(requestData)
  }).then((response) => {
    return response.json();
  }).then((responseJSON) => {
    console.log(responseJSON);
  }).catch((error) => {
    console.error(error);
  });
});
