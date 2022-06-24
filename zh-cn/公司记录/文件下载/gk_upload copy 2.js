function fn_upload(config) {
	// 参数定义-===================================START
	config = config || {}
	var randMath = Math.round(Math.random() * 100000)
	var main_id = config.main_id;
	var uploadform_excelfiles_id = config.uploadform_excelfiles || "uploadform-excelfiles" + randMath;
	var uploadfile_id = config.uploadfile_id || "uploadfile_";
	var file_id = config.file_id || "file" + randMath
	var tbody_id = config.tbody_id || "files" + randMath;
	var fileName = config.fileName || "fileName" + randMath;
	var uploadfile_name = config.uploadfile_name || "uploadfile";

	var fileList;
	var allFile = [];
	var inputFils = null;
	var form = $("#upload-forma")[0];
	/*var formData = new FormData(form);*/
	// 参数定义-===================================END

	// 界面初始化定义-===================================START
	var _main = $(main_id);
	_main.html('<div style="width: 100%">' +
    '<div class="rowa" style="margin-top: 10px;">' +
        '<div class="form-group col-md-5" id="'+ file_id + '">' +
                '<div class="field-uploadform-excelfiles">'+
                    '<label class="control-label btn btn-primary" for="'+ uploadform_excelfiles_id + '">选择文件</label> '+
                    '<label id="'+ fileName + '"></label> '+
                    '<input type="file" id="'+ uploadform_excelfiles_id + '" name="UploadForm[excelFiles][]" multiple'+
                        'class="attachment-upload" style="display: none">'+
                    '<input type="hidden" name="'+ uploadfile_name + '" id="' + uploadfile_id + '" /> '+
                    '<div class="help-block"></div> '+
                '</div> '+
        '</div>'+
    '</div>'+
    '<table role="presentation" class="table">'+
        '<tbody id="'+ tbody_id + '"></tbody>'+
    '</table>'+
    '</div>');
	// 界面初始化定义-===================================END

	// 定义函数===================================START
	// 统计上传了几个文件
	handleCountHtml = function() {
		$("#" + fileName).empty();
		var fileCount = $("#" + tbody_id).find('tr').length;
		if (fileCount == 0) return;
		$("#" + fileName).html('已上传 ' + fileCount + ' 个文件');
	}

	// 文件组sid
	handleGroupSid = function() {
		return groupsid = $("#" + uploadfile_id).val();
	}

	//获得随机sid
	handleNewsid = function() {
		return $.getNewsid()
	}

	//获得随机数
	handleRandMath = function() {
		return Math.round(Math.random() * 100000)
	}

	// 清空tbogy 内容
	clearFileComponta = function() {
		$("#" + tbody_id).empty();
		$("#" + fileName).empty();
		allFile = [];
	}


	// 需要绑定的文件下载事件
	fileDown = function(e) {
		/*  文件下载 */
		/*console.log(e, "e")*/
		var sid = e.target.parentNode.previousElementSibling.previousElementSibling.previousElementSibling.getAttribute('value');
		$.postIframe(ctx + '/custom/downloadUploadedFile.vot?sid=' + sid);
		// getuploadedfileinfos(handleGroupSid(), isDelete);
	}

	// 刷新表格
	getuploadedfileinfos = function(groupsid, isDeletea, tbody_id_val, file_id_val) {
		var isDelete = isDeletea == false ? isDeletea : true;
		/*console.log(isDelete, "来了")*/
		// if(groupsid==""||groupsid==null) return;
		$.ajax({
			url: ctx + '/upload/getuploadedfileinfos.vot?filegroupsid=' + groupsid + "&stopcache=" + Math.random(),
			type: 'POST',
			cache: false,
			changeOrigin: true
		}).done(function(res) {
			res = JSON.parse(res);
			allFile = res;
			var tbody_ele = tbody_id_val && $("#" + tbody_id_val) || $("#" + tbody_id)
			/*console.log(file_id_val, "file_id_val=======")*/
			var file_ele = file_id_val && $("#" + file_id_val) || $("#" + file_id)
			/*console.log(file_ele, "file_ele")*/
			tbody_ele.empty();
			if (!isDelete) {
				//查看
				file_ele.css({ 'display': 'none' });
			} else {
				file_ele.css({ 'display': 'block' });
			}
			$.each(res, function(index, item) {

				if (isDelete) {
					tbody_ele.append('<tr style="padding-top: 7px;">' +
						'<td>' + item.filename + '</td>' +
						'<td style="display: none" value="' + item.sid + '">' + fileName + '</td>' +
						'<td>' + (item.filesize / 1024).toFixed(2) + 'K</td>' +
						'<td><label class="btn btn-danger delete" >删除</label></td>' +
						'<td style="display: flex; flex-direction: row-reverse;"><a type="button"  class="btn btn-success fileDown" >文件下载</a></td>' +
						'</tr>');

				} else {
					tbody_ele.append(' <tr style="padding-top: 7px;">' +
						'<td>' + item.filename + '</td>' +
						'<td style="display: none" value="' + item.sid + '"></td>' +
						'<td></td>' +
						'<td><label class="" ></label></td>' +
						'<td style="display: flex; flex-direction: row-reverse;"><a type="button"  class="btn btn-success fileDown">文件下载</a></td>' +
						'</tr> ');
				}
				tbody_ele.on('click', ".fileDown", function(e) {
					fileDown(e)
				});
			})

			handleCountHtml();
		}).fail(function(res) {
			console.log("获取文件组失败:" + res.msg);
		});

	};


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
			id: uploadform_excelfiles_id,
			frameName: 'frameName',
			url: ctx + '/custom/upload/uploadfiles.vot?uploadtimeid=' + handleNewsid() + "&filegroupsid=" + groupsid + "&enablePermanent=false",
			format: ['jpg', 'png', 'gif', 'bmp'],
			callBack: function(data) {
				data = JSON.parse(data);
				if (data.code === 'ok') {
					var timer2 = setTimeout(function() {
						$(".progress").css("display", "none");
					}, 2000);

				}
				debugger
				getuploadedfileinfos(handleGroupSid());
			},

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
		iframe.load(function() {
			var data = $(this).contents().find('body').html();
			file.appendTo(fileParent);
			iframe.remove();
			form.remove();
			opt.callBack(data);
		})
	}
	// 定义函数===================================END

	// 事件绑定===================================START
	// 触发上传
	$("#" + uploadform_excelfiles_id).on('change', function(e) {
		var fileError = 0;
		fileList = e.currentTarget.files;
		inputFils = e;
		$.each(fileList, function(index, item) {
			// var fileName = item.name;
			//var fileEnd = fileName.substring(fileName.indexOf("."));
			allFile.push(item);

		/*	formData.append('UploadForm[excelFiles][]', item);*/
			extracted2(handleGroupSid());
		});
		if (fileError > 0) {
			alert("只能上传 “.xlsx” 格式的文件!");
			document.getElementById("upload-form").reset();
			return;
		}
	});

	// 触发删除
	$("#" + tbody_id).on('click', '.delete', function(e) {
		var saveFile = [];
		var delete_sid = e.target.parentNode.previousElementSibling.previousElementSibling.getAttribute('value');
		var deleteIndex;
		$.ajax({
			url: ctx + '/upload/delfile.vot?sid=' + delete_sid + '&enablepermanent=true&uploadtimeid=' + handleNewsid(),
			type: 'POST',
			cache: false,
		}).done(function() {
			//将不删除的放入数组中
			$.each(allFile, function(index, item) {
				/*console.log(item.sid, "item.sid")*/
				if (item.sid === delete_sid) {
					deleteIndex = index;
				} else {
					saveFile.push(item);
				}
			});
			allFile.splice(deleteIndex, 1);
			if (isIE() || isIE11()) {
				e.target.parentNode.parentNode.removeNode(true);
			} else {
				e.target.parentNode.parentNode.remove();
			}
			debugger
			getuploadedfileinfos(handleGroupSid());
			var filecontrol = fileList
			inputFils.target.value = '';
		}).fail(function(res) {
			alert("删除失败:" + res.msg);
		});

	});

	// 事件绑定===================================END


	return {
		// 提供外部操作方法  预览
		getView: function(groupsid, isDelete, tbody_id_val, file_id_val) {
			debugger
			getuploadedfileinfos(groupsid, isDelete, tbody_id_val, file_id_val)
		},
		showDownload: function() {
			$("#" + file_id).css({ 'display': 'block' });
		},

		//清空
		clearFileCompont: function() {
			clearFileComponta();
		},
		getTbodyId: function() {
			return tbody_id;
		},
		getUploadfile_id: function() {
			return uploadfile_id;
		},
		getfile_id: function() {
			return file_id;
		}
	}
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








