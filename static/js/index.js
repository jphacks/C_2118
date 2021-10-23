const newTopicFormSubmitButton = document.querySelector("button.new-topic-form-submit-button");

newTopicFormSubmitButton.addEventListener("click", () => {
  const newTopicForm = document.querySelector("form.new-topic-form");
  let formData = new FormData(newTopicForm);
  let requestData = {};
  requestData.parent_comment_id = 0;
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
