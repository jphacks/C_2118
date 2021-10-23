const form = document.getElementById("form");
const button = document.getElementById("button");

button.addEventListener("click", (event) => {
  const data = new FormData(form);
  let obj = {};
  obj.parent_comment_id = 0;
  obj.title = data.get("title");
  obj.text = data.get("text");
  obj.attribute = Number(data.get("sanpi"));
  fetch("/comment", { method: "POST", body: JSON.stringify(obj) })
    .then((res) => { return res.text(); })
    .then((data) => { console.log(data) })
    .catch((err) => { console.log(err); });
}, false);
