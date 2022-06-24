// 自定义上传控件逻辑

var fileList;
var allFile = [];
var form = $("#upload-forma")[0];
var formData = new FormData(form);
var inputFils = null;
$("#uploadform-excelfiles").on('change', function (e) {
  debugger

  var fileError = 0;
  inputFils = e;
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
    debugger
    var groupsid = $("#uploadfile_").val();
    getuploadedfileinfos(groupsid);
    var filecontrol = fileList
    inputFils.target.value = '';
  }).fail(function (res) {
    alert("删除失败:" + res.msg);
  });

  allFile.splice(deleteIndex, 1);


  if (isIE() || isIE11()) {
    e.target.parentNode.parentNode.removeNode(true);
  } else {
    e.target.parentNode.parentNode.remove();
  }
  var fileCount = $('#files').find('tr').length;
  $('#fileName').html('共上传 ' + fileCount + ' 个文件');

});




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

// 需要绑定的文件下载事件
fileDown = function(e) {
  /*  文件下载 */
  /*console.log(e, "e")*/
  var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
  $.postIframe(ctx + '/custom/downloadUploadedFile.vot?sid=' + sid);
  // getuploadedfileinfos(handleGroupSid(), isDelete);
}

function getuploadedfileinfos(groupsid, isDeletea) {
  console.log(isDeletea, "isDeletea")
  var isDelete = isDeletea == false ? isDeletea : true;
  console.log(isDelete, "isDelete")
  $.ajax({
    url: ctx + '/upload/getuploadedfileinfos.vot?filegroupsid=' + groupsid,
    type: 'POST',
    cache: false,
    changeOrigin: true
  }).done(function (res) {
    res = JSON.parse(res);
    $('#file')[0].style.display = "none";
    allFile = res;
    $('#files').empty();
    // 如果为空不遍历
    if (isDelete == true) {
      $('#file')[0].style.display = "block";
    } else {
      $('#file')[0].style.display = "none";
    }
    $.each(res, function (index, item) {
      if (isDelete == true) {
        $('#files').append('<tr style="padding-top: 7px;">' +
          '<td>' + item.filename + '</td>' +
          '<td style="display: none" value="' + item.sid + '">' + fileName + '</td>' +
          '<td>' + (item.filesize / 1024).toFixed(2) + 'K</td>' +
          '<td><label class="btn btn-danger delete" >删除</label></td>' +
          '<td><a type="button"  class="btn btn-success pull-right" id="fileDown" >文件下载</a></td>' +
          /*    '<td><a type="button"  class="btn btn-success" id="custom_print" onclick="doPrint()" >预览打印</a></td>' +  */
          '</tr>');

      } else {
        $('#files').append('<tr style="padding-top: 7px;">' +
          '<td>' + item.filename + '</td>' +
          '<td style="display: none" value="' + item.sid + '"></td>' +
          '<td></td>' +
          '<td><label class="" ></label></td>' +
          '<td><a type="button"  class="btn btn-success fileDown" >文件下载</a></td>' +
          '</tr>');
      }

      $('#files').on('click', ".fileDown", function (e) {
        var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
        $.postIframe(ctx + '/custom/downloadUploadedFile.vot?sid=' + sid);
      });

    })

    // $('#fileDown').on('click', function (e) {
    //   /*  文件下载 */
    //   console.log(e, "e")
    //   var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
    //   $.postIframe(ctx + '/custom/downloadUploadedFile.vot?sid=' + sid);
    //   var groupsid = $("#uploadfile_").val();
    //   getuploadedfileinfos(groupsid, isDelete);
    // });

    $('#custom_print').on('click', function (e) {
      var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
      if ("" == "pdf") {
        /*  previewChannel(sid);*/
      } else {
        // 图片
        window.open(ctx + '/custom/ViewFile.vot?sid=' + sid);
      }

    });


  }).fail(function (res) {
    alert("获取文件组失败:" + res.msg);
  });

};


function extracted2(groupsid) {

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

function clearFileCompont() {
  $('#files').empty();
  $('#fileName').empty();
  allFile = [];
}

/*    function previewChannel(sid) {
     // console.log('test-id',id);
     let url = ctx + '/custom/downloadUploadedFile.vot?sid=' + sid;
     const ele = document.createElement('a');
     ele.setAttribute('href', url); //预览文件的url地址
     ele.setAttribute('target', "_blank"); //预览文件的url地址
     ele.click();
 }*/