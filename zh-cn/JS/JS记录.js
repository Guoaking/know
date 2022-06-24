// 0~
const index = Math.floor(MMath.random()*arr.length);

//2~5
2+Math.floor(Math.random()*(arr.length-2)); 

confirm("是否确认关闭直播？")

// 日期格式化
function dateFormat(date,format="YYYY-MM-DD HH:mm:ss"){

    const config={
        YYYY: date.getFullYear(),
        MM: date.getMonth(),
        DD:date.getDate(),
        HH: date.getHours(),
        mm: date.getMinutes(),
        ss: date.getSeconds()
    };
    for (const key in config) {
        format = format.replace(key,config[key])
    }

    return format
}

// 数组元素移动
function moveArr(array,from ,to){
    if(from<0||to>= array.length){
        console.error("参数错误")
        return
    }
    const newArray = [...array]
    let item = newArray.splice(from,1);
    newArray.splice(to,0,...item);
    return newArray;
}

// 图片转下载而不是打开   涉及进度条变更 以及终端
function blobDownload (filepath, fileName) {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', filepath, true)
    xhr.responseType = 'arraybuffer'
    if (!fileName) {
      var qmIndex = filepath.indexOf('?');
      if (qmIndex !== -1) {
        filepath = filepath.substring(0, qmIndex);
      }
      var index = filepath.lastIndexOf('/');
      fileName = filepath.substring(index + 1);
    }
    $('#Cmivm76bcsaw229s00').click(function(){
      console.log('终止下载')
      $('#Cnvag4a5dpoc2tbk00').css({display: 'none'})
           $('#Czyxfv1qgfm9ssg00').css({display: 'none'})
           $('#Cmivm76bcsaw229s00').css({display: 'none'})
      xhr.abort()
    })
    xhr.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        var percentComplete = event.loaded / event.total * 100;
        percentComplete = Math.ceil(percentComplete)
        $('#Cdppp9e68uu8vdg00').css({
          width: percentComplete + '%'
        })
        $('#Czyxfv1qgfm9ssg00 .meta__text').text(percentComplete + '%')
        if (percentComplete === 100) {
           $('#Cnvag4a5dpoc2tbk00').css({display: 'none'})
           $('#Czyxfv1qgfm9ssg00').css({display: 'none'})
           $('#Cmivm76bcsaw229s00').css({display: 'none'})
        } else {
           $('#Cnvag4a5dpoc2tbk00').css({display: 'block'})
           $('#Czyxfv1qgfm9ssg00').css({display: 'block'})
           $('#Cmivm76bcsaw229s00').css({display: 'block'})
        }
        
        console.log(percentComplete);    
      }
    })
    xhr.onload = function() {
        if (this.status === 200) {
          let type = xhr.getResponseHeader('Content-Type')
 
          let blob = new Blob([this.response], {type: type})
          if (typeof window.navigator.msSaveBlob !== 'undefined') {
            /*
             * IE workaround for "HTML7007: One or more blob URLs were revoked by closing
             * the blob for which they were created. These URLs will no longer resolve as 
             * the data backing the URL has been freed." 
             */
            window.navigator.msSaveBlob(blob, fileName)
          } else {
            let URL = window.URL || window.webkitURL
            let objectUrl = URL.createObjectURL(blob)
            if (fileName) {
              var a = document.createElement('a')
              // safari doesn't support this yet
              if (typeof a.download === 'undefined') {
                window.location = objectUrl
              } else {
                a.href = objectUrl
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                a.remove()
              }
            } else {
              window.location = objectUrl
            }
          }
        }
    }
    xhr.send()
}//(#url#)


// 复制链接
function() {
  if(document.execCommand('Copy')){
    //创建input
    var inputZ = document.createElement('input');
    //添加Id,用于后续操作
    inputZ.setAttribute('id','inputCopy');
    //获取当前链接
    inputZ.value = window.location.href;
    //创建的input添加到body
    document.body.appendChild(inputZ);
    //选中input中的值
    document.getElementById('inputCopy').select();
    //把值复制下来
    document.execCommand('Copy')
    alert('复制成功！');
    //删除添加的input
    document.body.removeChild(inputZ);
  }
}//()