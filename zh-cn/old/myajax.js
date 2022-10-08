class ParamError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'ParamError';
    }
}

class HttpError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'HttpError';
    }
}

function ajax(url, type = "GET") {
    return new Promise((resolve, reject) => {
        loading.style.display = 'block'
        if (!/^http/.test(url)) {
            throw new ParamError("请求地址格式错误！")
        }
        let xhr = new XMLHttpRequest();
        xhr.open(type, url);
        xhr.send();
        xhr.onload = function () {
            if (this.status == 200) {
                resolve(JSON.parse(this.response))
            } else if (this.status == 404) {
                reject(new HttpError("请求找不到404"))
            } else {
                reject("加载失败")
            }
        },
            xhr.onerror = function () {
                reject(this)
            }
    })
}


ajax("url").then(
    value => {
        console.log(value)
        ajax("url")
    },
    reason => {
        console.log(reason + "abc")
    }
).then(
    value => {
        console.log(value)
    },
    reason => {
        console.log(reason + "abc")
    }
)

ajax("url")
    .then(
        value => ajax("url")
    ).then(
        value => console.log(value)
    )

ajax("url")
    .then(
        value => ajax("url")
    ).catch(error => {
        if (error instanceof ParamError) {
            console.log(error.message)
        }
        if (error instanceof HttpError) {
            alert(error.message)
        }


    }).finally(()=>{
        loading.style.display = 'none'
    })