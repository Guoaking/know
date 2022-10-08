var fileList;
var allFile = [];
//FormData对象初始化
debugger
var form = $("#upload-forma")[0];
var formData = new FormData(form);
$("#uploadform-excelfiles").on('change', function (e) {

    var fileError = 0;
    fileList = e.currentTarget.files;
    $.each(fileList, function (index, item) {
        var fileName = item.name;
        console.log(item, "item")
        var fileEnd = fileName.substring(fileName.indexOf("."));

        allFile.push(item);
        $('#files').append('<tr style="padding-top: 7px;">' +
            '<td>' + fileName + '</td>' +
            '<td style="display: none" value=""></td>' +
            '<td>' + (item.size / 1024).toFixed(2) + 'K</td>' +
            '<td><label class="btn btn-danger delete" >删除</label></td>' +

            '</tr>');
        //追加文件
        formData.append('UploadForm[excelFiles][]', item);
        var groupsid = $("#uploadfile_").val();
        console.log(groupsid, "groupsid");
        extracted2(groupsid);
    });
    if (fileError > 0) {
        alert("只能上传 “.xlsx” 格式的文件!");
        document.getElementById("upload-form").reset();
        return;
    }

    var fileCount = $('#files').find('tr').length;
    $('#fileName').html('共上传 ' + fileCount + ' 个文件');

});

$('#files').on('click', '.delete', function (e) {
    var saveFile = [];
    console.log(e, "e")
    var deleteName = e.target.parentNode.previousElementSibling.previousElementSibling.textContent;
    var delete_sid = e.target.parentNode.previousElementSibling.previousElementSibling.getAttribute('value');
    var deleteIndex;
    //将不删除的放入数组中
    $.each(allFile, function (index, item) {
        console.log(item.sid, "item.sid")
        if (item.sid === delete_sid) {
            deleteIndex = index;
        } else {
            saveFile.push(item);
        }
    });
    $.ajax({
        url: ctx + '/upload/delfile.vot?sid=' + delete_sid + '&enablepermanent=true&uploadtimeid=' + $.getNewsid(),
        type: 'POST',
        cache: false,
    }).done(function (res) {
        var groupsid = $("#uploadfile_").val();
        getuploadedfileinfos(groupsid);
    }).fail(function (res) {
        alert("删除失败:" + res.msg);
    });

    allFile.splice(deleteIndex, 1);
    //表单数据重置
    /*  formData.delete('UploadForm[excelFiles][]'); */
    //将不删除的数组追加的formData中
    /* 	       $.each(saveFile, function (index, item) {
                    formData.append('UploadForm[excelFiles][]', item);
                }); */

    if (isIE() || isIE11()) {
        e.target.parentNode.parentNode.removeNode(true);
    } else {
        e.target.parentNode.parentNode.remove();
    }
    var fileCount = $('#files').find('tr').length;
    $('#fileName').html('共上传 ' + fileCount + ' 个文件');

});



// 进度条
function progressBar(evt) {
    var loaded = evt.loaded; //已经上传大小情况
    console.log(loaded, "loaded")
    var tot = evt.total; //附件总大小
    var per = Math.floor(100 * loaded / tot); //已经上传的百分比
    console.log("已经上传了：" + per);
    $(".progress").css("display", "block");
    if (per === 100) {
        per = "文件上传成功!";
        $("#uploadFile_rate").html(per);
        $("#uploadFile_progressBar").width(100 + "%");
        return;
    }
    $("#uploadFile_rate").html(per + "%");
    $("#uploadFile_progressBar").width(per + "%");
}

// 刷新表格
function getuploadedfileinfos(groupsid, isDelete = true) {
    $.ajax({
        url: ctx + '/upload/getuploadedfileinfos.vot?filegroupsid=' + groupsid,
        type: 'POST',
        cache: false,
    }).done(function (res) {
        res = JSON.parse(res);
        allFile = res;
        $('#files').empty();
        $.each(res, function (index, item) {
            if (isDelete) {
                $('#files').append(' <!--startprint--> <tr style="padding-top: 7px;">' +
                    '<td>' + item.filename + '</td>' +
                    '<td style="display: none" value="' + item.sid + '">' + fileName + '</td>' +
                    '<td>' + (item.filesize / 1024).toFixed(2) + 'K</td>' +
                    '<td><label class="btn btn-danger delete" >删除</label></td>' +
                    '<td><a type="button"  class="btn btn-success pull-right" id="fileDown" >文件下载</a></td>' +
                    '</tr> <!--endprint--> ');

            } else {
                $('#file').css({ 'display': 'none' });
                $('#files').append(' <!--startprint--> <tr style="padding-top: 7px;">' +
                    '<td>' + item.filename + '</td>' +
                    '<td style="display: none" value="' + item.sid + '"></td>' +
                    '<td></td>' +
                    '<td><label class="" ></label></td>' +
                    '<td><a type="button"  class="btn btn-success pull-right" id="fileDown" >文件下载</a></td>' +
                    '</tr> <!--endprint--> ');
            }

        })

        $('#fileDown').on('click', function (e) {
            /*  文件下载 */
            console.log(e, "e")
            var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
            $.postIframe(ctx + '/custom/downloadUploadedFile.vot?sid=' + sid);
            var groupsid = $("#uploadfile_").val();
            getuploadedfileinfos(groupsid, isDelete);
        });

        $('#custom_print').on('click', function (e) {
            var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
            if ("" == "pdf") {
                previewChannel(sid);
            } else {
                // 图片
                window.open(ctx + '/custom/ViewFile.vot?sid=' + sid);
            }

        });


    }).fail(function (res) {
        alert("获取文件组失败:" + res.msg);
    });

};

//formdata方式 不兼容ie8
function extracted() {
    var len = 1;
    if (len > 0) {
        var deleteBtn = $(".delete");

        //通过ajax进行上传
        $.ajax({
            url: ctx + '/custom/upload/uploadfiles.vot?uploadtimeid=' + $.getNewsid() + "&filegroupsid=" + groupsid + "&enablePermanent=false",
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener("progress", progressBar, false);
                }
                return xhr;
            }
        }).done(function (res) {
            res = JSON.parse(res);
            if (res.code === 'ok') {
                var timer2 = setTimeout(function () {
                    $(".progress").css("display", "none");
                }, 2000);

            }
            var groupsid = $("#uploadfile_").val();
            getuploadedfileinfos(groupsid);
            //表单数据重置
            formData.delete('UploadForm[excelFiles][]');

        }).fail(function (res) {
            alert("文件上传失败:" + res.msg);
        });
    } else {
        alert("请选择需要上传的文件！");
    }
}

// iframe方式
function extracted2(groupsid) {
    /*
        参数说明:
        opt.id : 页面里file控件的ID;
        opt.frameName : iframe的name值;
        opt.url : 文件要提交到的地址;
        opt.format : 文件格式，以数组的形式传递，如['jpg','png','gif','bmp'];
        opt.callBack : 上传成功后回调;
    */

    ajaxUpload({
        id: 'uploadform-excelfiles',
        frameName: 'frameName',
        url: ctx + '/custom/upload/uploadfiles.vot?uploadtimeid=' + $.getNewsid() + "&filegroupsid=" + groupsid + "&enablePermanent=false",
        format: ['jpg', 'png', 'gif', 'bmp'],
        callBack: function (data) {
            data = JSON.parse(data);
            if (data.code === 'ok') {
                var timer2 = setTimeout(function () {
                    $(".progress").css("display", "none");
                }, 2000);

            }
            var groupsid = $("#uploadfile_").val();
            getuploadedfileinfos(groupsid);
        }
    })
}


// iframe子实现
function ajaxUpload(opt) {

    var iName = opt.frameName; // 太长了，变短点
    var iframe, form, file, fileParent;
    // 创建iframe和form表单
    iframe = $('<iframe name="' + iName + '" style="display: none;" />');
    form = $('<form method="post" style="display:n1one;" target="' + iName + '" action="' + opt.url + '"  name="form_' + iName + '" enctype="multipart/form-data" />');
    file = $('#' + opt.id); // 通过id获取flie控件
    fileParent = file.parent(); // 存父级
    file.appendTo(form);
    // 插入body
    $(document.body).append(iframe).append(form);

    // 取得所选文件的扩展名
    /* var fileFormat=/\.[a-zA-Z]+$/.exec(file.val())[0].substring(1);
    if(opt.format.join('-').indexOf(fileFormat)!=-1){
        
    }else{
        file.appendTo(fileParent); // 将file控件放回到页面
        iframe.remove();
        form.remove();
        alert('文件格式错误，请重新选择！');
    }; */
    form.submit();// 格式通过验证后提交表单;

    // 文件提交完后
    iframe.load(function () {
        var data = $(this).contents().find('body').html();
        file.appendTo(fileParent);
        iframe.remove();
        form.remove();
        opt.callBack(data);
    })
}

/**
 * 判断是否是IE
 */
function isIE() {
    if (!!window.ActiveXobject || "ActiveXObject" in window) {
        return true;
    } else {
        return false;
    }
}
/**
 * 判断是否是IE11
 */
function isIE11() {
    if ((/Trident\/7\./).test(navigator.userAgent)) {
        return true;
    } else {
        return false;
    }
}

//退出初始化
function clearFileCompont() {
    $('#files').empty();
    $('#fileName').empty();
    allFile = [];
}

// pdf文件预览
function previewChannel(sid) {
    // console.log('test-id',id);
    let url = ctx + '/custom/downloadUploadedFile.vot?sid=' + sid;
    const ele = document.createElement('a');
    ele.setAttribute('href', url); //预览文件的url地址
    ele.setAttribute('target', "_blank"); //预览文件的url地址
    ele.click();
}





// $.widget( "custom.progressbar", {
//     options: {
//         value: 0
//     },
//     _create: function() {
//         this.options.value = this._constrain(this.options.value);
//         this.element.addClass( "progressbar" );
//         this.refresh();
//     },
//     _setOption: function( key, value ) {
//         if ( key === "value" ) {
//             value = this._constrain( value );
//         }
//         this._super( key, value );
//     },
//     _setOptions: function( options ) {
//         this._super( options );
//         this.refresh();
//     },
//     refresh: function() {
//         var progress = this.options.value + "%";
//         this.element.text( progress );
//         if ( this.options.value == 100 ) {
//             this._trigger( "complete", null, { value: 100 } );
//         }
//     },
//     _constrain: function( value ) {
//         if ( value > 100 ) {
//             value = 100;
//         }
//         if ( value < 0 ) {
//             value = 0;
//         }
//         return value;
//     },
//     _destroy: function() {
//         this.element
//             .removeClass( "progressbar" )
//             .text( "" );
//     }
// });

// var bar = $( "<div></div>" )
//     .appendTo( "body" )
//     .progressbar({
//         complete: function( event, data ) {
//             alert( "Callbacks are great!" );
//         }
//     })
//     .bind( "progressbarcomplete", function( event, data ) {
//         alert( "Events bubble and support many handlers for extreme flexibility." );
//         alert( "The progress bar value is " + data.value );
//     });
 
// bar.progressbar( "option", "value", 100 );      

