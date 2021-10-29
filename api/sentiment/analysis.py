import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AdapterType


model = AutoModelForSequenceClassification.from_pretrained(
    "cl-tohoku/bert-base-japanese-whole-word-masking"
)
tokenizer = AutoTokenizer.from_pretrained(
    "cl-tohoku/bert-base-japanese-whole-word-masking"
)
model.load_adapter("./adapter/sst-2/")


def predict(sentence):
    token_ids = tokenizer.convert_tokens_to_ids(tokenizer.tokenize(sentence))
    input_tensor = torch.tensor([token_ids])
    outputs = model(input_tensor, adapter_names=["sst-2"])
    result = torch.argmax(outputs[0]).item()

    return result
