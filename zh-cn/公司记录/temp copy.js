function _toLaunchFuncs (operatejson, opparams, eventelem, funcUiOpenCallback) {
    var thisObj = this;
    // forward_type = 


    
     var isdynamicview = operatejson.forward_type == 4;
     
     var executeProcedure = function(isslowexe, operateurl, isfullurl) {
         var finalopurl = "toOperateProcedure";
         if (operateurl) {
             finalopurl = operateurl;
         }
         
         if (eventelem && $(eventelem).attr("type") == 'checkbox') {
             opparams['checked'] = $(eventelem).prop("checked") ? "1":"0";
         }
         
         var procedureUrl = ctx + "/gz/commonsearch/CommonSearchController/" + finalopurl + ".vot";
         if (isfullurl) {
             procedureUrl = ctx + finalopurl;
         }
         
         var postdatas = "isslowexe=" + isslowexe + "&operatejson=" + encodeURIComponent(encodeURIComponent(JSON.stringify(operatejson))) + "&params=" + encodeURIComponent(encodeURIComponent(JSON.stringify(opparams)));
         
         if (eventelem && ($(eventelem).attr("type") == 'checkbox' || thisObj._getExtPropValue(operatejson.ext_property, 'UiAlertClassic') == 'nonelistrefresh')) {// 含有免提示刷新列表模式
             $(eventelem).prop("disabled", true);
             $.post(procedureUrl, postdatas, function (data) {
                 $(eventelem).prop("disabled", false);
                 if (!data.success) {
                     uibase.alert("操作失败：" + data.msg);
                     return;
                 }
                 if (thisObj._getExtPropValue(operatejson.ext_property, 'UiAlertClassic') == 'nonelistrefresh') {// 免提示刷新列表模式
                     thisObj._datagrid[thisObj._datagridfunc]("refresh");
                 }
             }, "json");
         } else {
             uibase.confirm($.i18n('antelope.willyou') + " " + operatejson.tool_button_text + " " + $.i18n('antelope.willyousuffix') + "？", function(suc){
                 $.showBusyState();
                 $.post(procedureUrl, postdatas, function (data) {
                     $.hideBusyState();
                     if (data.success) {
                         if (data.msg) {
                             $.message({
                                 message:data.msg,
                                 type: 'success'
                             });
                         } else {
                             $.message({
                                 message:"操作成功！",
                                 type: 'success'
                             });
                         }
                         suc(true);
                         if (thisObj._getExtPropOrDefValue(operatejson.ext_property, 'ActionAfterSuccess', ',', 'def') == 'def') {// http请求操作完成后动作
                             thisObj._datagrid[thisObj._datagridfunc]("refresh");
                         } 
                     } else {
                         suc(false, "操作失败：" + data.msg);
                     }
                     
                 }, "json");
             });
         }
         
     }
     
     
     // 11 慢存储过程执行
     if (operatejson.forward_type == 11) {
         executeProcedure(true);
         return;
     }
     
     // 12 js脚本调用
     if (operatejson.forward_type == 12) {
         var forwarldfunc = eval(operatejson.forward_dll);
         forwarldfunc(thisObj.getQueryDataProvier(thisObj.options.funcid));
         $.showLoading({customClass:"loadingtext", target:null, text:"导出中"});
         setTimeout(function(){
             $.hideLoading();
         }, 5000);
         return;
     }
     
     // 13 提交后台webs
     if (operatejson.forward_type == 13) {
         executeProcedure(false, "toOperateWebS");
         return;
     }
     
     // 14 自动刷新启停
     if (operatejson.forward_type == 14) {
         if (thisObj._auto_refreshtimeoutid) {
             clearTimeout(thisObj._auto_refreshtimeoutid);
             thisObj._auto_refreshtimeoutid = null;
             thisObj._enable_auto_refresh = false;
         } else {
             thisObj._enable_auto_refresh = true;
             thisObj._auto_refresh();
         }
         return;
     }
     
     // 15 自定义导出
     if (operatejson.forward_type == 15) {
         var guid = $.Guid.New().replace(/-/g, '');
         var progressdialog = null;
         $("iframe[name=tar]").remove();
         
         if (!opparams['func_id']) {// 默认此变量可以传入
             opparams['func_id'] = this.configdatas && this.configdatas.function_id;
         }
         
         $.postIframe(ctx + operatejson.forward_dll, "asyncreqid=" + guid + "&opparams=" + encodeURIComponent(JSON.stringify(opparams)), function(data){
             if (data) {
                 data = JSON.parse(data);
                 if (data.success && progressdialog && progressdialog.data("uiDialog")) {
                     uibase.alert(data.msg, true);
                     progressdialog.dialog('destroy');
                 }
             }
         });
         var isneedprogress = thisObj._getExtPropValue(operatejson.ext_property, 'isneedprogress');
         if (isneedprogress == '1') {
             progressdialog = $("<div></div>").dialog({
                 title:"导出中...",
                 buttons:{'取消导出': function(e, closecallback) {
                     $.post(ctx + "/stopasyncrunning.vot?asyncreqid=" + guid);
                 }},
                 onClose: function() {
                     $.post(ctx + "/stopasyncrunning.vot?asyncreqid=" + guid);
                 }
             });
             var optdata = {percent:0};
             $.resubscribe("percentage", function(data){
                 if (data.asyncreqid == guid) {
                     optdata.percent = data.percentage;
                     if (optdata.percent == 100 && progressdialog && progressdialog.data("uiDialog")) {
                         progressdialog.dialog("destroy");
                     }
                 }
             });
             $.AElProgress(progressdialog[0], {
                 data: function () {
                     return optdata;
                 }
             });
         }
         
         return;
     }
     
     // 17 http请求
     if (operatejson.forward_type == 17) {
         executeProcedure(false, operatejson.forward_dll, true);
         return;
     }
     
   // 18 功能点选择控件
     if (operatejson.forward_type == 18) {
         var functionid = thisObj._getExtPropValue(operatejson.ext_property, 'functionid');
         var dialogtitle = thisObj._getExtPropValue(operatejson.ext_property, 'dialogtitle');
         var autosearch = thisObj._getExtPropValue(operatejson.ext_property, 'autosearch');
         var isUtilBarVisible = thisObj._getExtPropValue(operatejson.ext_property, 'IsUtilBarVisible');
         var field_name_condvar_map = thisObj._getExtPropValue(operatejson.ext_property, 'field_name_condvar_map');
         if (field_name_condvar_map) {
             var mapArrs = field_name_condvar_map.split(";");
             var targetForm = $(thisObj.element).closest("form");
             $(mapArrs).each(function() {
                 var inputNmVal = this.split(":");
                 opparams[inputNmVal[0]] = targetForm.find("[name=" + inputNmVal[1].toLowerCase() + "]").val();
             });
         }
         collectview.openComsearchSelect(functionid, function(selecteditems) {
               if (!selecteditems.length) {
                   uibase.alert("请选择！");
                   return false;
               } else {
                   
                   var addsize = selecteditems.length;
                   var addedComplete = function() {
                       if (addsize == 0) {
                           var saveafterconfirm = thisObj._getExtPropValue(operatejson.ext_property, 'saveafterconfirm');
                           if (saveafterconfirm == '1') {// 选择完成后即保存
                               thisObj._toLaunchModifyFunctionInner(JSON.parse(thisObj._modifyoperateobjbtn.attr("operateobj")), {});
                           } else {
                               thisObj._datagrid.closest(".commonsearch").trigger("change");	
                           }
                       }
                   }
                   
                   var replacedatafields = thisObj._getExtPropValue(operatejson.ext_property, 'replacedatafields');
                   
                   $(selecteditems).each(function(){
                       this.sid = $.Guid.New();
                       if (thisObj._addoperateobjbtn) {
                           
                           if (replacedatafields) {// 根据联合键,先删除部分记录
                               var paramsForDel = {};
                               var oneSelectedItem = this;
                               $(replacedatafields.split(";")).each(function(){
                                   paramsForDel[this] = oneSelectedItem[this];
                               });
                               thisObj._datagrid.datagrid("delRowsByParams", paramsForDel);
                           }
                           
                           thisObj._toLaunchModifyFunctionInner(JSON.parse(thisObj._addoperateobjbtn.attr("operateobj")), this, null, true, function(){
                               addsize--;
                               addedComplete();	
                           });
                       } else {
                           thisObj._datagrid.datagrid("addRowData", this.sid, this);
                           addsize--;
                       }
                   });
                   addedComplete();
                   
                   if (thisObj._getExtPropValue(operatejson.ext_property, 'closeafterconfirm') == '1') {
                       return false;
                   }
               }
           }, opparams, "1" == autosearch, null, isUtilBarVisible == '1', null, {appeareffect:thisObj._getExtPropValue(operatejson.ext_property, 'appeareffect'), dialogtitle:dialogtitle, resizable:true, dialogclassName:thisObj.getDialogClassName(operatejson)});
         return;
     }
     
   // 19 pdf模板导出
     if (operatejson.forward_type == 19) { 
         var pdfmodelid = thisObj._getExtPropValue(operatejson.ext_property, 'pdfmodelid');
         $.postIframe(ctx + "/pdfexport/pdfexportcontroller/exportpdf.vot?pdfmodelid=" + pdfmodelid, "opparams=" + encodeURIComponent(JSON.stringify(opparams)));
         return;
     }
     
     // 20 全局代理按钮
     if (operatejson.forward_type == 20) { 
         var proxybtnname = thisObj._getExtPropValue(operatejson.ext_property, 'proxybtnname');
         thisObj._globalbtnfunc([proxybtnname], operatejson.tool_button_text);
         return;
     }
     
     // 21 复制选中行
     if (operatejson.forward_type == 21) { 
         var selecteditems = thisObj._datagrid.datagrid("option", "selectedItems");
         if (selecteditems.length == 0) {
             uibase.alert("请先选中要复制的行！");
             return;
         }
         setTimeout(function(){// 延迟执行复制,用以解决正在进行行内编辑时,复制导致数据错乱的问题
             var copycountinput = thisObj._getExtPropValue(operatejson.ext_property, 'copycountinput');
             var inlineNewRowPos = thisObj._getExtPropValue(operatejson.ext_property, 'InlineNewRowPos');
             
             var correctfieldvalue = thisObj._getExtPropValue(operatejson.ext_property, 'correctfieldvalue');
             
             
             var copyfunc = function(copycount) {
                 for (var j = 0;j < copycount; ++j) {
                     for (var i = selecteditems.length - 1; i >= 0; --i) {
                         var thisselecteditem = selecteditems[i]; 
                         var newrowdata = JSON.parse(JSON.stringify(thisselecteditem)); 
                         newrowdata.sid = $.Guid.New();
                         newrowdata.id = newrowdata.sid; 
                         var addoperatejson = JSON.parse(thisObj._addoperateobjbtn.attr("operateobj"));
                         
                         if (correctfieldvalue) {// 若存在修正字段值，则进行修正
                             $(correctfieldvalue.split(";")).each(function(){
                                 newrowdata[this.split(":")[0]] = this.split(":")[1];	  
                             });
                         }
                         
                         thisObj._datagrid.datagrid("addRowData", newrowdata.sid, newrowdata, inlineNewRowPos);				  
                     }
                 }
                 
                 thisObj._doAutoHeightAdjust(); // 复制后行内编辑自适应高度调整
             }
             
             if (copycountinput == '1') {
                 var sdialog = $("<input class='form-control' name='ctsize' value='1' maxlength='3'/>").submitDialog({
                     title:"请输入复制次数",
                     className:"copysizedialog",
                     showConfirm:false,
                     callback: function(){
                         copyfunc(parseInt(sdialog.val(), 10));
                         thisObj._removeDialogTrash(sdialog);
                     }
                 })
             } else {
                 copyfunc(1);
             }
         },0);
         return;
     }
     
   // 22 自定义上传
     if (operatejson.forward_type == 22) {
         var diagform = $('<form enctype="multipart/form-data" >\
               <input name="filetoupload"  type="file"/>\
               <button type="button">上传</button>\
           </form>').dialog({buttons:{}});
         
         diagform.find("button").click(function(){
             diagform.postIframe(ctx + operatejson.forward_dll + "?opparams=" + encodeURIComponent(JSON.stringify(opparams)), function(data){
               uibase.alert("上传成功！");
               diagform.dialog("destroy");
             });
         });
         
         return;
     }
     
   // 23 过滤条件区域显示隐藏
     if (operatejson.forward_type == 23) {
         var children = this.element.data("layout").children;
         children.center.layout1.toggle("north"); 
         return;
     }
     
     // 10 | 查找功能，无界面，给提示
     if (operatejson.forward_type == 10) {
         uibase.alert("请使用浏览器组合键（ ctrl + f ）打开界面内容查找输入框");
         return;
     }
     
     // 9 | 导出功能，无界面，先做导出全部
     if (operatejson.forward_type == 9 || operatejson.forward_type == 16) {
         
         var htable = thisObj._maindatagrid.find(".ui-jqgrid-hbox").html();
         var htablejq = $(htable);
         htablejq.find(".jqg-first-row-header").remove();
         //  class="ui-jqgrid-htable ui-common-table table table-bordered"
         
         htablejq.removeAttr("style").removeAttr("role").removeAttr("aria-labelledby").removeAttr("class");
         htablejq.find("tr").removeAttr("class").removeAttr("role");
         htablejq.find("th").removeAttr("role").removeAttr("class").each(function(){
             var self = $(this);
             var idstr = self.prop("id");
             idstr = idstr.replace(/^[^_]*_/,'');
             self.prop("id", idstr);
             self.text(self.text());
             if (self.css("display") == 'none' || self.attr("id") == 'rn') {
                 self.remove();
             } else {
                 self.removeAttr("style");
             }
         });
         
         var eselected = thisObj._getExtPropValue(operatejson.ext_property, 'ExportSelected');
         
         var selitems = [];
         
         if (eselected == '1') {
             selitems = thisObj._datagrid.datagrid("option", "selectedItems");
         }
         
         /** 包含查询条件导出信息 */
         var includequerypart = thisObj._getExtPropValue(operatejson.ext_property, 'IncludeQueryPart');
         var querypart = "";
         if (includequerypart == '1') {
             var querypartinfo = {};
             thisObj._querycspan.children(".form-group:visible").each(function() {
                 querypartinfo[$(this).children("label").text()] = $(this).find(":input").val();
             });
             querypart = "querypartinfo=" + encodeURIComponent(JSON.stringify(querypartinfo)) + "&";
         }
         
         
         var qdataProvider = thisObj._datagrid.datagrid("getOriginDataProvider");
         var urlpart = qdataProvider.split("?")[0];
         var paramspart = qdataProvider.split("?")[1];
         paramspart = decodeURIComponent(paramspart);
         $.showBusyState();
         $.get(ctx + "/common/getsysprop.vot?propname=max_exportexcel_size", function(max_exportsize){
             $.postIframe(urlpart + "?_isexport=true&page=1&numPerPage=" + max_exportsize + "&eselected=" + eselected, querypart + paramspart + "&htablehtml=" + encodeURIComponent(htablejq[0].outerHTML.replace(/<tr><\/tr>|id=""|&nbsp;|<thead[^>]*>|<\/thead>/gi,'')) 
                     + "&selitems=" + encodeURIComponent(JSON.stringify(selitems)));
             setTimeout(function(){
                 $.hideBusyState();
             }, 5000);
         });
         return;
     }
     
     // 7 | 纯存储过程
     if (operatejson.forward_type == 7) {
         executeProcedure(false);
         return;
     }
    
   // 8 | 存储过程及流程，无界面
     if (operatejson.forward_type == 8) {
         $.showBusyState();
         $.post(ctx + "/gz/commonsearch/CommonSearchController/toOperateProcedureFlow.vot", "operatejson=" + encodeURIComponent(encodeURIComponent(JSON.stringify(operatejson))) + "&params=" + encodeURIComponent(encodeURIComponent(JSON.stringify(opparams))), function (data) {
             $.hideBusyState();
             if (data.success) {
                 uibase.alert("流程启动成功！");  
             } else {
                 uibase.alert("流程启动失败：" + data.msg);
             }
         }, "json");
         return;
     }
     
     var isstartflow = operatejson.forward_type == 2;
     
     var tform = $("<form class='form-horizontal' onsubmit='return false;'></form>");
     if (operatejson.forward_dll && operatejson.forward_dll.indexOf("InitOldFlow") != -1) {
         tform.css("height", "100%");
     }
     
     if (isdynamicview) { // 动态界面时，先隐藏后显示
         tform.hide();
     }
     
     tform.appendTo(document.body);
     
     var dllparamsvar = {comsearch:thisObj, operate: operatejson, forward_dll:operatejson.forward_dll, params: opparams, formobj: tform};
     
     function callbackfunc(md){
         $(eventelem).data("isopening", false);
         
         var openmsgobj = $(eventelem).data("openmsgobj");
         if (openmsgobj) {
             thisObj._close_msgobj(openmsgobj);
             $(eventelem).removeData("openmsgobj");
         }
         
         if (!md) {
             md = {};
         }
         
         if (operatejson.show_mode == '5') {// 无窗口
             tform.remove();
         }
         
         tform.css("visibility", "visible");
         
         if (operatejson.show_mode == '3') { // 浏览器顶级窗口时
             var newtabwin = open(ctx + "/common/jsp/commonsearchnewtab.jsp");
             newtabwin.dllparamsvar = dllparamsvar;
             
             function resetDllParamsvar() {// IE浏览器可能会清空属性，监测打开窗口
                 if (newtabwin.begincalltabinit) {
                     newtabwin.dllparamsvar = dllparamsvar;
                 } else {
                     setTimeout(resetDllParamsvar, 300);
                 }
             }
             resetDllParamsvar();
             tform.remove();
         }
         
         var tabshowmodeCallback = function(tabpane){// 页签模式统一回调（包括内部页签及模块页签）
             tabpane.append(tform);
             thisObj.element.data('layout').resizeAll();
             if (isdynamicview) {// 动态界面，显示表单并允许父级容器滚动
                 tform.show();
                 tabpane.css("overflow", "auto");
             }
         }
         
         if (operatejson.show_mode == '2') { // 内部页签模式
             var newtab = thisObj._innertab.show().tabadd({label:operatejson.tool_button_text}, {}, thisObj._innertabcontent, function(tabpane) {
                 tabshowmodeCallback(tabpane);
                 tform.on("titlechange", function(e, ntitle){
                     newtab.find("a").text(ntitle);
                 });
             }, null, null, true);
         }
         
         var marcoWindowTitle = thisObj._getExtPropValue(operatejson.ext_property, 'MarcoWindowTitle');
         if (marcoWindowTitle){
             operatejson.actual_window_title = thisObj._replaceAllMacro(marcoWindowTitle, opparams);
         } else {
             operatejson.actual_window_title = operatejson.tool_button_text;
         }
         operatejson.forbidTitleChange = thisObj._getExtPropValue(operatejson.ext_property, 'ForbidTitleChange');
         
         if (operatejson.show_mode == '6') { // 模块页签模式
             if ($(".modulecontainer .mctab").length) {
                 $(".modulecontainer .mctab").tabadd({label:operatejson.actual_window_title}, {}, ".modulecontainer>.tab-content", tabshowmodeCallback);
             } else {
                 uibase.alert("当前页未找到模块页签", true);
             }
         }
         
         if (operatejson.show_mode == '1' || operatejson.show_mode == '4') {// 模态对话框  非模态（暂时统一模态处理）
              thisObj.toLaunchFuncOpenDialog(md,tform,operatejson, function(){
                  var actionAfterDialogClose = thisObj._getExtPropValue(operatejson.ext_property, 'ActionAfterDialogClose');
                  if (actionAfterDialogClose == 'refreshList') {
                      thisObj._datagrid[thisObj._datagridfunc]("refresh");
                  }
              });
         }
         
         if (funcUiOpenCallback && $.isFunction(funcUiOpenCallback)) {
             funcUiOpenCallback();
         }
     }
    
     if (operatejson.forward_type == 6) {// 网址，直接打开
         if (operatejson.forward_dll && ( operatejson.forward_dll.indexOf("http://") != -1 || operatejson.forward_dll.indexOf("https://") != -1)) {
             open($.appendURLParams(operatejson.forward_dll, "opparams=" + encodeURIComponent(JSON.stringify(opparams))));
         } else {
             open(ctx + operatejson.forward_dll);
         }
     } else if (operatejson.forward_type == 1) {// 功能点
         tform.css("min-height", 320);
         tform.css("height", "100%");
         var extprops = thisObj._createProps(operatejson);
         tform.comsearch({opener_name:thisObj.configdatas.function_name, visibles:extprops.visibles, funcid:operatejson.forward_dll, oparams: opparams, autoquery: extprops.autoquery,
             complete: function(){callbackfunc({defaultFullScreen:thisObj._getDefFullScreenFunction(operatejson), buttons: function(){return {}}})}}
         );
     } else if (isstartflow) {// 含有动态界面，发起工作流
         operatejson.funcjspname = "startworkflow.jsp";
         
         var flowtemid = operatejson.forward_dll;
         if (flowtemid.indexOf(".dll") != -1) {// 老框架，使用forward_name来获取信息
             flowtemid = encodeURIComponent(encodeURIComponent(operatejson.forward_name));
         }
         var flowstochoose = flowtemid.split(",");
         
         var gotoLoadStart = function() {
             tform.appendTo(document.body).load(ctx + "/gz/startworkflow.jsp?flowtemplateid=" + flowtemid, function(){
                 if (window["startworkflow"]) {
                     window["startworkflow"]({comsearch:thisObj, operate: operatejson, forward_dll:flowtemid, params: opparams, formobj: tform}, callbackfunc);
                 }
             });
         }
         
         if (flowstochoose.length <= 1) {
             gotoLoadStart();
         } else {
             var chooseflowform = '<div data-toggle="buttons">';
             var flownamestochoose = operatejson.forward_name.replace("[流程]").split(",");
             $(flowstochoose).each(function(idx){
                 chooseflowform += ' <label class="btn btn-default form-control">\
                                       <input type="radio" name="options" autocomplete="off" value="' + this + '"> ' + flownamestochoose[idx] + '\
                                     </label>';
             });
             chooseflowform += "</div>";
             
             var chooseflowformdialog = $(chooseflowform).dialog({
                 title:"选择流程",
                 className:"chooseflowdialog",
                 callback:function(closecallback){
                     var checkedopts = chooseflowformdialog.find(":checked");
                     if (checkedopts.length == 0) {
                         uibase.alert("请选择要发起的流程！", true);
                         closecallback(false);
                     } else {
                         flowtemid = $(checkedopts[0]).attr("value");
                         gotoLoadStart();
                         closecallback(true);
                     }
             }});
         }
     } else if (isdynamicview) {// 动态界面加载组件
         if (!opparams['func_id']) {// 默认此变量可以传入
             opparams['func_id'] = this.configdatas && this.configdatas.function_id;
         }
         
         if ($(eventelem).data("isopening"))
             return;
         thisObj._setOpeningState(eventelem);
         if (operatejson.original_datagrid) {
             tform.data("original_datagrid", operatejson.original_datagrid); // 挂接原始数据表，用以后续可能存在的刷新动作
         }
         tform.dynamicview({dynamicid:operatejson.forward_dll, oparams: opparams, execEnterProc: operatejson.show_mode != '3', // 目前除了顶级窗口，其他窗口形式均执行
             dllparam:{comsearch:thisObj},
             complete: function(){
                 // 内部按钮外控
                 var diagbtn = thisObj.getDynamicOutputBtns(tform);
                 callbackfunc({defaultFullScreen:thisObj._getDefFullScreenFunction(operatejson), buttons: function(){return diagbtn}})}}
         );
     } else {
         if (operatejson.show_mode != '3') { // 浏览器顶级窗口时
             if (operatejson.show_mode == '2') { // 内部页签模式
                 tform.css("height", "100%");
             }
             
             var finaljsppath = "/gz/dllcounterparts/" + operatejson.funcjspname;
             if (operatejson.funcjspname && operatejson.funcjspname.length && operatejson.funcjspname.charAt(0) == '/') {// 可能为绝对路径
                 finaljsppath = operatejson.funcjspname;
             }
             
             if ($(eventelem).data("isopening"))
                 return;
             thisObj._setOpeningState(eventelem);
             
             tform.appendTo(document.body).load(ctx + finaljsppath, function(){
                 var hrefsub = /[^./]*\./.exec(operatejson.funcjspname) + "";
                 var jspnamepart = hrefsub.substring(0, hrefsub.length - 1);
                 if (window[jspnamepart]) {
                     window[jspnamepart](dllparamsvar, callbackfunc);
                 }
             });
         } else {
             callbackfunc();
         }
     }
}