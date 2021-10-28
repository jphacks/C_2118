const replyComment = document.querySelector(".comment.post");
const newCommentForm = document.querySelector("form.new-comment-form");
const newCommentFormSubmitButton = document.querySelector("button.new-comment-form-submit-button");

newCommentForm.addEventListener("input", () => {
  const formData = new FormData(newCommentForm);
  if (formData.get("title") === "" || formData.get("body") === "" || formData.get("position") === "") {
    newCommentFormSubmitButton.disabled = true;
  } else {
    newCommentFormSubmitButton.disabled = false;
  }
});

newCommentForm.addEventListener("change", () => {
  const formData = new FormData(newCommentForm);

  replyComment.classList.remove("agree");
  replyComment.classList.remove("neutral");
  replyComment.classList.remove("disagree");

  replyComment.classList.add(formData.get("position"));
});

newCommentFormSubmitButton.addEventListener("click", () => {
  let formData = new FormData(newCommentForm);
  let requestData = {};
  requestData.parent_comment_id = 0;
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
  fetch("/comment", {
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
