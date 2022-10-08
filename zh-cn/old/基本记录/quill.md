## quill 富文本

```javascript

// 初始化事件
var a = $(dllparams.formobj).find("#editor")[0]
quill = new Quill("#editor", {
    theme: "snow",
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }, "bold", "italic", "underline", , "image"],
            [{ list: "ordered" }, { list: "bullet" }, { align: [] }, { color: [] }, { background: [] }, "link", "clean"],
        ],
    },
    placeholder: "我的笔记 ...",
});
```