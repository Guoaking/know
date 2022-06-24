define(function(require, exports, module) {
	
	require("uicombobox");
	require("uicolorpicker");
	var uibase = require("uibase");
	
	var currentFormStack = [];
	
	var topdefstack = [];
	
	var dialogstack = [];
	
	var isShowingCollectView = false;
	
	var editor = null;
	
	function topcurrform() {
		return currentFormStack[currentFormStack.length - 1];
	}
	
	function topcurrdeflistname () {
		return topdefstack[topdefstack.length - 1];
	}
	
	function topdialog () {
		return dialogstack[dialogstack.length - 1];
	}
	
	exports.topdialog = function () {
		return dialogstack[dialogstack.length - 1];
	}
	
	exports.setOryxEditor = function (teditor) {
		editor = teditor;
	}
	
	$(document.body).off("mousedown.collectedit");
  	$(document.body).off("mouseleave.collectedit");
  	$(document.body).off("blur.collectedit");
	$(document.body).off("click.collectedit");
	
	$(document.body).on("mousedown.collectedit", ".listform label", function(){
  		saveLastEdit();
	});
	
	// 流程环节动作常用动作自动添加
	window['flowactionadd'] = function() {
		addlistformview([{"sid":"1548291414031","action_desc":"提交","action_name":"提交","action_type":"1","display_index":"0","table_sys_flow_action_field":"[]","table_sys_flow_action_field_collect":"{\"table\":\"sys_flow_action_field\",\"formjs\":\"wfactionfield.js\",\"pidfield\":\"action_id\",\"namefield\":\"field_name\"}","if_import_excel_file":"0"},{"sid":"1548291414034","action_desc":"协办","action_name":"协办","action_type":"18","display_index":"1","table_sys_flow_action_field":"[]","table_sys_flow_action_field_collect":"{\"table\":\"sys_flow_action_field\",\"formjs\":\"wfactionfield.js\",\"pidfield\":\"action_id\",\"namefield\":\"field_name\"}","if_import_excel_file":"0"},{"sid":"1548291414036","action_desc":"转办","action_name":"转办","action_type":"22","display_index":"2","table_sys_flow_action_field":"[]","table_sys_flow_action_field_collect":"{\"table\":\"sys_flow_action_field\",\"formjs\":\"wfactionfield.js\",\"pidfield\":\"action_id\",\"namefield\":\"field_name\"}","if_import_excel_file":"0"},{"sid":"1548291414039","action_desc":"点到点驳回","action_name":"点到点驳回","action_type":"20","display_index":"3","table_sys_flow_action_field":"[]","table_sys_flow_action_field_collect":"{\"table\":\"sys_flow_action_field\",\"formjs\":\"wfactionfield.js\",\"pidfield\":\"action_id\",\"namefield\":\"field_name\"}","if_import_excel_file":"0"},{"sid":"1548291414041","action_desc":"驳回","action_name":"驳回","action_type":"21","display_index":"4","table_sys_flow_action_field":"[]","table_sys_flow_action_field_collect":"{\"table\":\"sys_flow_action_field\",\"formjs\":\"wfactionfield.js\",\"pidfield\":\"action_id\",\"namefield\":\"field_name\"}","if_import_excel_file":"0"}]);
	}
	
	// 自动添加
	window['autoAddExtraline'] = function(tablename, refpropvals) {
		if (!tablename)
			tablename = "";
		var tbarr = tablename.split("|");
		
		var isout = "0";
		if (tbarr.length > 1) {
			isout = tbarr[1];
		}
		tablename = tbarr[0];
		
		var querytype = $(".funcmanage [name=query_type]").val();
		var query_obj_name = $(".funcmanage [name=query_obj_name]").val();
		var op_type = "";
		if (dialogstack.length - 2 >= 0) {
			op_type = dialogstack[dialogstack.length - 2].find("[name=op_type]").val();
		}
		
		var secdialog = dialogstack[dialogstack.length - 2];
		
		if (secdialog) {
    		var objtype = secdialog.find("[name=object_type]");
    		var objname = secdialog.find("[name=object_name]");
    		if (objtype.length) {
    			querytype = objtype.val();
    			query_obj_name = objname.val();
    		}
    		
    		// 工作流处理人特殊处理
    		var procedurenamefield = secdialog.find("[name=procedure_name]");
    		if (procedurenamefield.length) {
    			querytype = "2";
    			query_obj_name = procedurenamefield.val();
    		} 
		}
		if (refpropvals) {// 动态界面特殊处理
		// StoredProcedure
		// DataSourceType,DataSource
			query_obj_name = refpropvals['DataSource'];
			
			if ("StoredProcedure" == refpropvals['DataSourceType']) {
				querytype = "2";
			} else {
				querytype = "1";
				if ("SqlStatement" != refpropvals['DataSourceType'])// 当为sql的时候tablename不是查询对象。
					tablename = query_obj_name;
			}
			
			if (!query_obj_name) {
				uibase.alert("请选择数据源对象");
			}
			
			isout = refpropvals.out
		}
		
		$.post(ctx + "/gz/commonsearch/CommonSearchController/getAutoAdd.vot", "isout=" + (isout||'') + "&op_type=" + op_type + "&tbname=" + tablename + "&query_type=" + querytype + "&query_obj_name=" + query_obj_name, function(data) {
			addlistformview(data);
		}, "json");
	}
	
	exports.openComsearchSelect = function(funcid, callback, oparams, autosearch, selectionMode, toolbarvisible, closecallback, otheropts) {
		toolbarvisible = !!toolbarvisible;
		if (!selectionMode)
			selectionMode = "singleRow";
		
		var dialogtitle = "对象编辑";
		
		if (otheropts && otheropts.dialogtitle) {
			dialogtitle = otheropts.dialogtitle;
		}

		var dialogclassName = "";
		
		if (otheropts && otheropts.dialogclassName) {
			dialogclassName = " " + otheropts.dialogclassName;
		}
		
		var funcptcontainer = $("<div funcid='" + funcid + "' style='height:100%; overflow'></div>");
		dialogstack.push($(funcptcontainer).submitDialog({
			showConfirm: false,
			resizable: otheropts && otheropts.resizable,
			className: "select_by_common_search" + dialogclassName,
			animate:false,
			appeareffect: otheropts && otheropts.appeareffect,
			title: dialogtitle,
			callback: function(closediag) {
				var selecteditems = topdialog().find(".maindatagrid").datagrid("option", "selectedItems");
				if ($.isFunction(callback)) {
					return callback(selecteditems);
				}
			},
			close: function() {
				dialogstack.pop();
				if (closecallback) {
					closecallback();
				}
			}
		}));
		
		funcptcontainer.comsearch({
			"funcid": funcid,
			oparams:oparams,
			autoquery:autosearch,
			selectionMode: selectionMode,
			visibles: {toolbar: toolbarvisible, buttons: false}
		});
	}
	
	exports.openDropDownSelect = function(digtitle, opthtml, currvalue, callback, ismultiple) {
		var heightstr = '';
		if (ismultiple) {
			heightstr = " style='height:500px' ";
		}
		dialogstack.push($('<form class="form-horizontal"><select class="form-control" ' + heightstr + ' ' + (ismultiple ? "multiple" : "") + ' name="dllnames">' + opthtml + '</select></form>').find("select").val(currvalue).end().submitDialog({
			showConfirm: false,
			animate:false,
			title: digtitle,
			callback: function(closediag) {
				var formvals = topdialog().serializeArray();
				if ($.isFunction(callback)) {
					callback(formvals);
				}
			},
			close: function() {
				dialogstack.pop();
			}
		}));
	}
	
	window['choosePortal'] = function(success, fieldjson, currvalue, viewfieldval) {
		chooseProcedure2(success, fieldjson, currvalue, viewfieldval, "8");
	}
	
	window['chooseDBFunction'] = function(success, fieldjson, currvalue, viewfieldval) {
		chooseProcedure2(success, fieldjson, currvalue, viewfieldval, "9");
	}
	
	window['chooseFunction'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1000", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个功能点！");
				return false;
			} else {
				success({value:selecteditems[0].function_id, label:selecteditems[0].function_id + " - " + selecteditems[0].function_name});
			}
		});
	}
	
	window['chooseMultipleFunction'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1000", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个功能点！");
				return false;
			} else {
				
				var labelcodes = $.extractField(selecteditems,"function_id");
				var labelnames = $.extractField(selecteditems,"function_name");
				var labelarr = [];
				for (var i = 0; i < labelcodes.length; ++i) {
					labelarr.push((labelcodes[i] ||'') + " - " + (labelnames[i] ||''));
				}
				
				success({value:$.extractField(selecteditems,"function_id") + "", label:labelarr + ""});
			}
		});
	}
	
	window['chooseMultipleDepts'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("2514", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个机构！");
				return false;
			} else {
				var labelcodes = $.extractField(selecteditems,"dept_id");
				success({value:$.extractField(selecteditems,"dept_id") + ""});
			}
		});
	}
	
	
	window['chooseImportTemplate'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("2513", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个功能点！");
				return false;
			} else {
				
				var labelcodes = $.extractField(selecteditems,"template_id");
				var labelnames = $.extractField(selecteditems,"template_name");
				var labelarr = [];
				for (var i = 0; i < labelcodes.length; ++i) {
					labelarr.push(labelnames[i] ||'');
				}
				
				success({value:$.extractField(selecteditems,"template_id") + "", label:labelarr + ""});
			}
		});
	}
	
	window['chooseWorkflow'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1100", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个流程！");
				return false;
			} else {
				success({value: (selecteditems[0].model_id ||''), label: (selecteditems[0].model_code ||'') + " - " + (selecteditems[0].model_name ||'') });
			}
		});
	}
	
	window['chooseNewWorkflow'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1700", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个流程！");
				return false;
			} else {
				success({value: (selecteditems[0].model_key ||''), label: (selecteditems[0].model_key ||'') + " - " + (selecteditems[0].name ||'') });
			}
		});
	}
	
	window['chooseCustomPortalLib'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("2514", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个自定义portal！");
				return false;
			} else {
				success({value: (selecteditems[0].sid ||''), label: (selecteditems[0].sid ||'') + " - " + (selecteditems[0].name ||'') });
			}
		});
	}
	
	window['chooseWorkflowNode'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1109", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请至少选择一个流程节点！");
				return false;
			} else {
				var nodeids = $.extractField(selecteditems, "node_id");
				var nodenames = $.extractField(selecteditems, "node_name");
				
				success({value: nodeids, label: nodenames});
			}
		}, {model_id:topdialog().find("[name=audit_workflow_id]").val()}, true, "multipleRows");
	}
	
	window['chooseDynamicUI'] = function(success, fieldjson, currvalue, viewfieldval, closecallback) {
		exports.openComsearchSelect("1200", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个动态界面！");
				return false;
			} else {
				success({value: (selecteditems[0].id ||''), label: (selecteditems[0].ui_code ||'') + " - " + (selecteditems[0].ui_name ||'') });
			}
		}, null, null, null, null, closecallback);
	}
	
	window['choosePlexus'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1846", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个拓扑图！");
				return false;
			} else {
				success({value: (selecteditems[0].model_id ||''), label: (selecteditems[0].model_name ||'') + " - " + (selecteditems[0].model_id ||'') });
			}
		}, null, null, null, null);
	}
	
	window['chooseSysOpts'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1824", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个系统选项！");
				return false;
			} else {
				success({value: (selecteditems[0].sid ||''), label: (selecteditems[0].name ||'')});
			}
		}, null, null, null, null);
	}
	
	window['chooseImage'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1847", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个图片！");
				return false;
			} else {
				success({value: (selecteditems[0].sid ||''), label: (selecteditems[0].res_name ||'') + " - " + (selecteditems[0].sid ||'') });
			}
		}, null, true, null, true);
	}
	
	
	window['chooseMultipleDynamicUI'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("1200", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("请选择一个动态界面！");
				return false;
			} else {
				var labelcodes = $.extractField(selecteditems,"ui_code");
				var labelnames = $.extractField(selecteditems,"ui_name");
				var labelarr = [];
				for (var i = 0; i < labelcodes.length; ++i) {
					labelarr.push((labelcodes[i] ||'') + " - " + (labelnames[i] ||''));
				}
				
				success({value: $.extractField(selecteditems,"id") + "", label: labelarr + "" });
			}
		});
	}
	
	// 选择原来dll
	window['chooseDllCounterparts'] = function(success, fieldjson, currvalue, viewfieldval, eventtarget){
		
		var ftype = topdialog() && topdialog().find("[name=forward_type]").val();
		if (!ftype) {// 非附属功能及扩展功能
			ftype = topdialog() && topdialog().find("[name=ext_type]").val();
			
			if (!ftype) { // 若均未找到，则默认走动态界面选择
				ftype = "2";
			}
			
			// 扩展功能动态界面对应
			switch(ftype) {
			case "1": // 通用查询
				break;
			case "2":  // 动态界面
				ftype = "4";
				break;
			case "3": //  dll
				break;
			case "4": // 图表 尚未实现
//				ftype = "4";
				break;
			case "5": // 动态界面内图表选动态界面即可
				ftype = "4";
				break;
			case "6": // 动态界面内图表选动态界面即可
				ftype = "12";
				break;
			}
			
		}
		
		/** 菜单配置相关 begin */
		
		
		var system_display_type = 0;
		if (eventtarget) {
			var displaytype = $(eventtarget).closest("form").find("[name=system_display_type]");
			var menuidformitem = $(eventtarget).closest("form").find("[name=menu_id]");
			if (displaytype.length && menuidformitem.length) {
				system_display_type = displaytype.val();
				if (system_display_type == 3) {
					ftype = 4;
				} else {
					ftype = 1;
				}
			}
		}
		/** 菜单配置相关 end */
		

		
//		 5 | 可执行程序 
//		 6 | 网址 
		if (ftype == 5 || ftype == 6) {
			showBigTextArea(success, fieldjson, currvalue, viewfieldval);
			return;
		}
		
//		7 | 存储过程 8 |存储过程及流程 | 11 慢存储过程执行
		if (ftype == 7 || ftype == 8 || ftype == 11) {
			chooseProcedure(success, fieldjson, currvalue);
			return;
		}
		
//		 1 | 功能点 4 动态界面
		if (ftype == 1 || ftype == 4 || ftype == 12) {
			if (ftype == 4) {
				chooseDynamicUI(success, fieldjson, currvalue, viewfieldval);
			} else if (ftype == 12) {
				choosePlexus(success, fieldjson, currvalue, viewfieldval);
			} else {
				chooseFunction(success, fieldjson, currvalue, viewfieldval);
			}
			
			return;
		}
		
//		 3 | DLL  //   		 2 | 流程 
		$.getJSON(ctx + "/gz/funcmanage/FuncManageController/getDllCounterPartsInfos.vot?ftype=" + ftype, function(data){
			
			if (ftype == 3 || ftype == 2) { // dll
				
				var opthtml = "";
				var digtitle = "";
				
				
				if (ftype == 3) {
					$(data.dllnames).each(function(){
						opthtml += "<option value='" + this + "'>" + this + "</option>";
					});
					digtitle = "对象编辑";
				} else if (ftype == 2) {
					// {"flowTemplateId":"15a40a3c1972e9928c544834dc4a4090","flowTemplateName":"test","categoryId":"159cfb4fbbd2ee5311593b1499d983b4","formUrl":"http://www.baidu.com?sysId=test1&templateFormId=%E8%A1%A8%E5%8D%95%E6%A8%A1%E6%9D%BFid&flowTemplateId=15a40a3c1972e9928c544834dc4a4090&modelId=1"}
					$(data.flows).each(function(){
						opthtml += "<option value='" + this.flowTemplateId + "'>" + this.flowTemplateName + "</option>";
					});
					digtitle = "选择流程";
				}
				
				exports.openDropDownSelect(digtitle, opthtml, currvalue, function(formvals){
					if (ftype == 3) {
						success({value:formvals[0].value, label:"[Dll]" + formvals[0].value});
					} else if (ftype == 2) {
						var selectedtexts = [];
						var selectedvals = [];
						$(formvals).each(function(){
							var selectedtext = topdialog().find("option[value=" + this.value + "]").text();
							selectedtexts.push(selectedtext);
							selectedvals.push(this.value);
						});
						success({value:selectedvals + "", label:"[流程]" + selectedtexts});
					}
				}, ftype == 2);
			}
			
			
		});
		
	}
	
	window['chooseTableOrView'] = function(success, fieldjson, currvalue) {
		chooseProcedure2(success, fieldjson, currvalue, "", 1)
	}
	
	// 选择存储过程，默认选择存储过程，其他情况根据传入querytype判断 
	window['chooseProcedure2'] = function(success, fieldjson, currvalue, viewfielvval, querytype){
		if (!querytype || querytype.innerHTML)
			querytype = 2;
		
		$.get(ctx + "/gz/procedurepicker.jsp?action=getProcedurePickerData&querytype=" + querytype + "&currvalue=" + currvalue, function(html) {
			dialogstack.push($("<div/>").html(html).submitDialog({
				showConfirm: false,
				title: "选择" + ['','表或视图', '存储过程', 'web服务', '存储过程及流程', '', '', '', 'portal', '函数'][querytype],
				callback: function(closediag) {
					if (querytype == 8) {
						var portalname = topdialog().find("[name=portalname]").val();
						if (!portalname) {
							uibase.alert("请选择portal界面！");
						} else {
							success({value:portalname, label:portalname});
						}
						return;
					}
					var pdbsrc = topdialog().find("[name=dbsrc]").val();
					var puser = topdialog().find("[name=procedureusername]").val();
					var pproce = topdialog().find("[name=procedurename]").val();
					
					if (!puser) {
						uibase.alert("请选择数据库用户！");
						return false;
					}
					if (!pproce) {
						uibase.alert("请选择" + ['','表或视图', '存储过程', 'web服务', '存储过程及流程'][querytype] + "！");
						return false;
					}
					if (querytype == 4) {
						var flowid = topdialog().find("[name=flowname]").val();	
						if (!flowid) {
    						uibase.alert("请选择流程！");
    						return false;
    					}
						
						var flowname = topdialog().find("[name=flowname]").find("option[value=" + flowid + "]").text();
						success({value:puser + "." + pproce + ";" + flowid, label:puser + "." + pproce + ";" + flowname});
						return;
					}
					
					if (pdbsrc && pdbsrc != '当前系统') {
						pdbsrc = "dtsrc." + pdbsrc + ":";
					} else {
						pdbsrc = '';
					}
					success({value:pdbsrc + puser + "." + pproce, label:pdbsrc + puser + "." + pproce});
				},
				close: function() {
					dialogstack.pop();
				}
			}));
		});
	}
  	
	window['chooseProcedure'] = function(success, fieldjson, currvalue){
		var querytype = $(".funcmanage [name=query_type]").val();
		
		// 附属功能类型
		var isredirectfunc = false;
		if (topdialog() && topdialog().find("[name=forward_type]").length) {
			var fortype = topdialog().find("[name=forward_type]").val();
			if (fortype == '7'|| fortype == '11') {
				querytype = 2;
			}
			// 存储过程及流程
			if (fortype == '8')  {
				querytype = 4;
			}
			
			// 存储过程及流程
			if (fortype == '9')  {
				querytype = 4;
			}
			
			isredirectfunc = true;
		}
		
		if (topdialog() && topdialog().find("[name=object_type]").length) {
			querytype = topdialog().find("[name=object_type]").val();
		}
		
		// 非附属功能类型，查询类型为http请求、纯sql时也打开大编辑框，
		if (querytype == 9 || querytype == 3 || !isredirectfunc && querytype == 4) {
			showBigTextArea(success, fieldjson, currvalue);
			return;
		}
		
		chooseProcedure2(success, fieldjson, currvalue, "", querytype);
		
	}
	
  	 // 保存上次编辑
  	function saveLastEdit() {
  		var currformdata = getCurrListFormData();
  		var onelistlabel = topdialog().find(".listform label.active");
  		topdialog().find(".listform label.active").data("formdata", currformdata);
  	}
    
  	var begininitoneitem = false;
  	$(document.body).on("click.collectedit", ".listform label", function(){
  		begininitoneitem = true;
  		
  		repatchdropdownlist(null, $(this).data('formdata'));
  		
  		topdialog().find(".listformright").resetForm($(this).data('formdata'));
  		showWhen.call(topdialog());
  		begininitoneitem = false;
  		topdialog().find(".cccontentright").show();
	});
  	
  	// 根据条件判断部分界面显示状态
  	function showWhen(e) {
  		
  		whenInner("showwhen", $(this), function(whenformgroup, ispassedbool){
  			if (ispassedbool) {
  				$(whenformgroup).show();
  			} else {
  				$(whenformgroup).hide();
  			}
  			// 当为用户手动更改属性导致的扩展属性变更的情况，需要将扩展属性表单值进行清空处理
  			if (!begininitoneitem && e && e.type == 'change' &&　$(whenformgroup).attr("inputtype") == 'editExtProperty') {
  				$(whenformgroup).find("[name=" + $(whenformgroup).attr("fmname") + "]").val('');
  			}
  		});
  		
  		whenInner("readonlywhen", $(this), function(whenformgroup, ispassedbool){
  			$(whenformgroup).find(":input").prop("readonly", !ispassedbool);
  		});
  	}
  	
  	// 根据条件判断部分界面的禁用启用状态
  	function enablewhen() {
  		whenInner("enablewhen", $(this), function(whenformgroup, ispassedbool){
  			$(whenformgroup).find(":input").prop("disabled", !ispassedbool);
  		});
  	}
  	
  	// 多表单域条件判断
  	function whenInner(whenattr, dialog, callback) {
  		var query_typev = $(".funcmanage [name=query_type]").val();
  		dialog.find("[" + whenattr + "]").each(function(){
  			var showwhenstr = $(this).attr(whenattr);
  			var showwhenarr = JSON.parse(showwhenstr);
  			var thisFormgroup = this;
  			
  			var finalcanshow = false;
  			$(showwhenarr).each(function() {
  				var canshow = true;
  				for (var key in this) {
  					if (key == 'query_type') {
  						canshow = canshow && (query_typev == this[key]);
  					} else {
  						canshow = canshow && (dialog.find("[name=" + key + "]").val() == this[key]);
  					}
  				}
  				finalcanshow = finalcanshow || canshow;
  			});
  			callback(thisFormgroup, finalcanshow);
  		});
  	}

  	$(document.body).on('mouseleave.collectedit blur.collectedit click.collectedit', ".listformright :input", function(){
  		
  		if (isShowingCollectView) {
  			return;
  		}
  		
  		var thisObj = this;
  		var data = {};
  		var tpdialog = topdialog();
  		tpdialog && topdialog().find(".listformright :input").each(function(){
  			data[$(this).attr("name")] = $(this).val();
  		});
  		
  		if (topdialog()) {
      		var onelistlabel = topdialog().find(".listform label.active span");
      		var labeltext = getLeftListItemLabel(data);
      		
      		if (onelistlabel.length)
      			onelistlabel[0].innerHTML = "<div style='text-overflow:ellipsis;overflow:hidden;'>" + labeltext + "</div>"; 
      		
      		saveLastEdit();
  		}
  	});
  	
  	// 根据右侧数据设置左侧列表label
  	function getLeftListItemLabel(data) {
  		
  		
  		var finallabeltext = topcurrform().namefield;
  		topdialog().find(".listformright :input").each(function(){
  			var selectform = $(this);
  			var labeltext = "";
  			if (selectform.is('select')) {
    			var selectopts = selectform.find("option");
    			for (var i = 0; i < selectopts.length; ++i) {
    				if ($(selectopts[i]).prop("value") == data[selectform.attr("name")]) {
    					labeltext = $(selectopts[i]).text();
    					break;
    				}
    			}
    			
    			if (!labeltext) {
    				labeltext = data[selectform.attr("name")];
    			}
    			
    		} else {
    			labeltext = data[selectform.attr("name")];
    		}
  			
  			finallabeltext = finallabeltext.replace(selectform.attr("name"), labeltext||'');
  			
  			
  		});
  		
  		// 拼接字符串含有可选区域，决定替换
  		var change = /\([^\|]*\|[^\|]*\)/.exec(finallabeltext);
  		if (change) {
  			var finalttoreplacechange = "";
  			var chparts = (change + "").split("|");
  			chparts[0] = chparts[0].replace("(","");
  			chparts[1] = chparts[1].replace(")","");
  			if (chparts[0] == '{$}' || !chparts[0]) {
  				finalttoreplacechange = chparts[1];
  			} else {
  				finalttoreplacechange = chparts[0];
  			}
  			finallabeltext = finallabeltext.replace(change, finalttoreplacechange);
  		}
  		
  		if (!finallabeltext || finallabeltext.indexOf("[") != -1 && finallabeltext.length <= 2) {
  			finallabeltext = topcurrdeflistname();
		}
  		// 补充列标识
  		if (topcurrform().nameflagcols) {
  			$(topcurrform().nameflagcols).each(function(){
  				if (data[this.field] == "1") {
  					finallabeltext = "[" + this.label + "]" + finallabeltext;
  				}
  			});
  		}
  		
  		return finallabeltext;
  	}
  	
  	// 获取当前表单右侧数据
  	function getCurrListFormData() {
		var listformright = topdialog().find(".listformright");
		
		if (!listformright.closest("form").length) {
			listformright.wrap("<form></form>");
		}
		
		var outerform = listformright.closest("form");
		var keynameserialize = outerform.serializeArray();
		
		var jsobj = {};
		for (var i = 0; i < keynameserialize.length; ++i) {
			jsobj[keynameserialize[i].name] = keynameserialize[i].value;	
		}
		
		return jsobj;
  	}

  	function getRgbColorVal(currvalue) {
  		var hexval = parseInt(currvalue >>> 0).toString(16);
		hexval = hexval.substring(hexval.length - 6);
		currselectedcolor = parseInt(hexval, 16);
  		return currselectedcolor;
  	}
	
	// 实现颜色选择框
	window['showColorPicker'] = function(success,  fieldjson, currvalue){
		
		var currselectedcolor = null;
		
		if (currvalue) {
			currselectedcolor = getRgbColorVal(currvalue);
		} else {
			currselectedcolor = "0";
		}
		
		currselectedcolor = parseInt(currselectedcolor, 10).toString(16);
		while (currselectedcolor.length < 6) {
			currselectedcolor = "0" + currselectedcolor;
		}
		
		dialogstack.push($('<form class="form-horizontal" style="height:272px;"></form>').dialog({
			showConfirm: false,
			animate:false,
			title: "颜色选择",
			className:"colorpickerdialog",
			buttons:{},
			callback: function(closediag) {
			},
			close: function() {
				dialogstack.pop();
			}
		}).ColorPicker({selectedColor:"#" + currselectedcolor, callback: function(){
			var currcolor = topdialog().ColorPicker("option", "selectedColor") + "";
			currcolor = parseInt(currcolor.replace("#", ''), 16);
			currcolor = parseInt(currcolor, 10) << 0;
			
			var rgbval = getRgbColorVal(currcolor);
			var color = rgbval.toString(16);
			while (color.length < 6) {
				color = "0" + color;
			}
			var viewfield = success({value:currcolor, label:"#" + color});
			viewfield.css('borderLeft', "33px solid #" + color);
			dialogstack.pop().dialog("close");
		}}));
	}
	
	window['colorPickerVal'] = function(originColor, originThisObj) {
		originColor = parseInt(originColor.replace("#", ''), 16);
		originColor = parseInt(originColor, 10) << 0;
		
		var rgbval = getRgbColorVal(originColor);
		var color = rgbval.toString(16);
		while (color.length < 6) {
			color = "0" + color;
		}
		$(originThisObj).css('borderLeft', "33px solid #" + color);
		return originColor;
	} 
	
	// 实现图片资源单选
	window['showSingleImagePicker'] = function(success,  fieldjson, currvalue) {
		showMutipleImagePicker(success,  fieldjson, currvalue, true);
	}
	
	
	// 实现图片资源多选
	window['showMutipleImagePicker'] = function(success,  fieldjson, currvalue, issingle) {
		var treeid = 'a' + Math.round(Math.random() * 10000000);
		$.get(ctx + "/gz/common/imageselect.jsp?resourcetreeid=" + treeid, function(html) {
			dialogstack.push($('<form class="form-horizontal" style="height:100%;"></form>').html(html).submitDialog({
				showConfirm: false,
				animate:false,
				className: 'imageselect',
				title: "图标选择",
				callback: function(closediag) {
					var iconids = [];
					topdialog().find("#chooseddataimg label").each(function(){
						iconids.push($(this).data("formdata").sid);
					});
					success({value:iconids + ""})
				},
				close: function() {
					dialogstack.pop();
				}
			}));
			
			topdialog().layout({
			    fxName : 'none',
			    resizerClass : "myresizerc",
			    closable : false,
			    north : {
					size : 25,
					resizable : false
			    },
			    west : {
					size : 150
			    },
			    east : {
					size : 170
			    },
			    west__children : {
					resizerClass : "myresizerc",
					    closable : false,
					north : {
					    size : 40
					}
			    },
			    east__children : {
					resizerClass : "myresizerc",
					    closable : false,
					west:{
					    size: 100
					}
			    }
			});
			
			// 加载资源分类树
			$.getJSON(ctx + "/gz/sysdatasource/SysDataSourceController/getAllCollectTreeData.vot?datasourceid=sysdatasource4", function(data) {
				var setting = {
    					expandSpeed : "",
    					showLine : true,
    					data: {
    						key: {
    							children: "cd",
    							name:'n'
    						}
    					},
    					callback : {
    						onClick: function(e, treeId, treenode){
    							
    							inittilegrid(treenode);
    							
		    					}
    					}
    				};
				
				
				$.fn.zTree3.destroy(treeid);
				$.fn.zTree3.init($("#" + treeid), setting, data.treedatas);
				
				
				var ztreobj = $.fn.zTree3.getZTreeObj(treeid);
				ztreobj.selectNode(ztreobj.getNodes()[0]);
				
				inittilegrid(data.treedatas[0]);
				function inittilegrid(treenode) {
					$(".tilegridcontainer").tilegrid({
			    		dataProvider:ctx + "/gz/resourcemanage/ResourceManageController/getSingleGridList.vot?treenode_sid=" + treenode.sid,
			    		numPerPage: 20,
			    		tileRenderer: function(gridinfo) {
			    			return '<div class="iconimagediv" iconname="' + this.name + '" iconsid="' + this.sid + '" style="width:105px; float:left; padding-top: 30px; text-align:center;">\
				    				<img style="width:85px; height:85px;" src="' + ctx + '/gz/resourcemanage/ResourceManageController/getSingleImageData.vot?imagesid=' + this.sid + '"/>\
				    				<div style="font-size:14px; padding-top:10px; width:85px; overflow:hidden; text-overflow:ellipsis;">' + this.name + '</div>\
			    				</div>';
			    		}
			    	});
					
					$(".tilegridcontainer").off("click").on("click", ".iconimagediv", function(){
						addOneChoseImg({resource_name:$(this).attr("iconname"), sid:$(this).attr("iconsid")});
					});
				}
				
			});
			
			// 已选图标恢复
			if (currvalue) {
				var imgsids = currvalue.split(",");
				$.getJSON(ctx + "/gz/resourcemanage/ResourceManageController/getSingleGridList.vot?imgsids=" + currvalue, function(imgdata){
					$(imgdata).each(function(){
						addOneChoseImg(this);
					});
				});
			}
			
			function addOneChoseImg(data) {
				
				if (issingle) {
					topdialog().find("#chooseddataimg").empty();
				}
				
				$('<label class="btn btn-default form-control" style="overflow:hidden; text-overflow:ellipsis; text-align:left;"> \
						<img style="width:23px; height:23px;" src="' + ctx + '/gz/resourcemanage/ResourceManageController/getSingleImageData.vot?imagesid=' + data.sid + '"/>\
						<input type="radio" name="options" id="option1" autocomplete="off"><span><b>(' + (topdialog().find("#chooseddataimg label").length) + ") </b>" + data.resource_name + '</span>\
				</label>').data("formdata", data).appendTo(topdialog().find("#chooseddataimg"));
			}
			
			// 已选图标功能区域
			$(".imgbtnarea").off().on("click", "button", function(){
				
				if (topdialog().find("#chooseddataimg input:checked").length == 0) {
					uibase.alert("请选择要删除的资源图片");
					return;
				}
				
				if ($(this).is(".del")) {
					topdialog().find("#chooseddataimg input:checked").closest("label").remove();
					resortidxnum();
					return;
				}
				
				
				var porn = $(this).is(".up")?"prev":"next";
				var aorb = $(this).is(".up")?"after":"before";
				
				var curractivelabel = topdialog().find("#chooseddataimg input:checked").closest("label");
				var thchange = curractivelabel[porn]();
				
				if (!thchange.length)
					return;
				
				curractivelabel[aorb](thchange);
				
				resortidxnum();
				
				function resortidxnum() {
					topdialog().find("#chooseddataimg label").each(function(idx){
						$(this).find("b").text("(" + idx + ") ");
					});
				}
			});
			
		});
		
	}
	
	// 实现大编辑框
	window['showBigTextArea'] = function(success,  fieldjson, currvalue, viewfieldval){
		if (viewfieldval) {
			currvalue = viewfieldval;
		}
		
		dialogstack.push($('<form class="form-horizontal" style="height:100%;"><textarea class="form-control" name="bigformtextarea" style="height:100%;"></textarea></form>').find("textarea").val(currvalue).end().submitDialog({
			showConfirm: false,
			animate:false,
			showFullScreenBtn:true,
			resizable:true,
			title: "对象编辑",
			callback: function(closediag) {
				var formvals = topdialog().serializeArray();
				success({value:formvals[0].value, label:formvals[0].value});
			},
			close: function() {
				dialogstack.pop();
			}
		}));
		topdialog().closest(".modal-body").css("height", 150);
	}
	
	// 根据不同条件寻找不同属性界面
	window['findformjsFromformjsObj'] = function(formjs, initdata) {
		if (/^{/.test(formjs)) {
			var formjs = JSON.parse(formjs);
			var finalformjs = null;
			for (var key in formjs) {
				try {
					$(formjs[key]).each(function() {
	      				var passed = true;
	      				for (var key2 in this) {
	      					if (initdata) {// 若为初始化，则直接走初始化数据做判断依据
	      						passed = passed && (initdata[key2] == this[key2]);
	      					} else {
	      						passed = passed && (topdialog().find("[name=" + key2 + "]").val() == this[key2]);
	      					}
	      				}
	      				if (passed) {
	      					finalformjs = key;
	      					return false;
	      				}
	      			});
				} catch(e){
				}
			}
			
			formjs = finalformjs;
		}
		
		
		return formjs;
	}
	
	// 实现扩展属性编辑
	window['editExtProperty'] = function(success,  fieldjson, currvalue){

		var formjs = findformjsFromformjsObj(fieldjson.formjs);
		
		// 根据有限条件确认为输入条件中的存储过程配置 
		var isfrominputcond = false;
		if (fieldjson.formjs == 'wfprocedure.js' && fieldjson.usetextarea && (fieldjson.name == 'data_source'||fieldjson.name == 'dynamic_data_source')) {
			isfrominputcond = true;
		}
		
		// DEV.SP_ZC01_BUSILINE_SHOW(#OUT,{$CURRENT_USER},#OUT,#OUT)(0,1,1,2)
		// procedure_name=dev.aassdd;
		// table_procedureparams=[{"sid":"1502084702240","param_name":"can1","param_type":"0","param_direction":"2","sendinvalue":"0"},
		// {"sid":"1502084702243","param_name":"can2","param_type":"1","param_direction":"1","sendinvalue":"2"},
		// {"sid":"1502084702245","param_name":"can3","param_type":"2","param_direction":"1","sendinvalue":"5"}];
		// table_procedureparams_collect={"autoadd":true,"table":"procedureparams","formjs":"wfprocedureparams.js","namefield":"param_name"}
		
		var procparams = [];
		
		function getProcedureParamsInfos(procedurenamept) {
			procparams = [];
			var procedureparams = [];
			$.ajaxSettings.async = false;
			$.getJSON(ctx + "/gz/funcmanage/FuncManageController/getProcedureParamsInfo.vot?procedure=" + procedurenamept, function(pdata){
			// [{"data_type2":"0","in_out_flag":2,"data_type":"REF CURSOR","argument_name":"RT_CURSOR"},
//				{"data_type2":"1","in_out_flag":1,"data_type":"VARCHAR2","argument_name":"I_USER_CODE"},
//				{"data_type2":"1","in_out_flag":2,"data_type":"VARCHAR2","argument_name":"O_RETURN_MSG"},
//				{"data_type2":"2","in_out_flag":2,"data_type":"NUMBER","argument_name":"O_RETURN_CODE"}]	
				var sendinvaluearr = [];
				if (currvalue.split("(").length > 1) {
					sendinvaluearr = currvalue.split("(")[1].substring(0, currvalue.split("(")[1].length - 1).split(",");
				}
				$(pdata).each(function(indx){
					var sendinvalu = "";
					if (sendinvaluearr.length > indx) {
						sendinvalu = sendinvaluearr[indx]; 
					}
					procparams.push({
						param_name: this.argument_name,
						param_direction: this.in_out_flag,
						param_type: this.data_type2,
						sendinvalue: this.in_out_flag == 1? sendinvalu:""
					});
				});

				procedureparams.push("procedure_name=" + procedurenamept);
				procedureparams.push("table_procedureparams=" + JSON.stringify(procparams));
			});
			$.ajaxSettings.async = true;
			
			return procedureparams;
		}
		
		if (isfrominputcond && currvalue) {// 为存储过程字符串，则需要从后台获取存储过程参数信息
			currvalue = getProcedureParamsInfos(currvalue.split("(")[0]).join(";");
		}
		
		$.get(ctx + "/gz/common/formcontent.jsp?formjs=" + formjs, function(html){
			dialogstack.push($('<form class="form-horizontal"></form>').html(html).submitDialog({
    			showConfirm: false,
    			animate:false,
				title: "对象编辑",
				callback: function(closediag) {
					var formvals = topdialog().serializeArray();
					var resultarr = [];
					if (fieldjson.separator == 'json') {
						resultarr = {};
					}
					for (var i = 0; i < formvals.length; ++i) {
						if (formvals[i].name != 'sid' && formvals[i].value) {
							if (fieldjson.separator == 'json') {
								resultarr[formvals[i].name] = formvals[i].value;
							} else {
								resultarr.push(formvals[i].name + "=" + formvals[i].value);
							}
						}
					}
					
					if (isfrominputcond) {// 存储过程参数特殊处理
						
						var tbprocname = null;
						var tbprocparams = null;
						for (var i = 0; i < formvals.length; ++i) {
							if (formvals[i].name == 'procedure_name') {
								tbprocname = formvals[i].value; 
							}
							if (formvals[i].name == 'table_procedureparams') {
								tbprocparams = formvals[i].value; 
							}
						}
						
						for (var i = 0; i < procparams.length; ++i) {
							if (procparams[i].param_direction == 2) {
								procparams[i].sendinvalue = "#OUT";
							} else {
								procparams[i].sendinvalue = JSON.parse(tbprocparams)[i].sendinvalue;
							}
						}
						
						var finalproceduredesc = tbprocname + "(" + $.extractField(procparams, "sendinvalue") + ")(" + $.extractField(procparams, "param_type") + ")";
						success({value:finalproceduredesc});
					} else {
						if (fieldjson.separator) {
							if (fieldjson.separator == 'json') {
								success({value:JSON.stringify(resultarr)});
							} else {
								success({value:resultarr.join(fieldjson.separator)});
							}
						} else {
							success({value:resultarr.join(",")});
						}
					}
					
					
				},
				close: function() {
					dialogstack.pop();
				}
			}));
			
			if (isfrominputcond) {
				topdialog().find("[name=procedure_name]").on("change", function(){
					var procedureparams = getProcedureParamsInfos(this.value);
					topdialog().find("[name=table_procedureparams]").val(procedureparams[1].split("=")[1]);
				});
			}
			
			if (fieldjson.separator == 'json') {
				var currvalarr = JSON.parse(currvalue);
			} else {
				var currvalarr = currvalue.split(fieldjson.separator);
			}
			var currvalobj = {};
			
			if (fieldjson.separator == 'json') {
				currvalobj = currvalarr;
			} else {
				for (var i = 0; i < currvalarr.length; ++i) {
					currvalobj[currvalarr[i].split("=")[0]] = currvalarr[i].substring(currvalarr[i].split("=")[0].length + 1); 
				}
			}
			
			repatchdropdownlist(null, currvalobj);
			
			// 适配颜色显示形式
			topdialog().find("[name$=_Color]").each(function(){
				var fieldname = $(this).attr("name").replace("_Color", "");
				var currval = currvalobj[fieldname];
				var rgbval = getRgbColorVal(currval);
				var color = rgbval.toString(16);
				while (color.length < 6) {
					color = "0" + color;
				}
				currvalobj[fieldname + "_Color"] = "#" + color;
				$(this).css("borderLeft", "33px solid #" + color);
			});
			
			topdialog().resetForm(currvalobj);
			enablewhen.call(topdialog());
			showWhen.call(topdialog());
			topdialog().on("change", enablewhen);
			topdialog().on("change", showWhen);
			
		});
		
	}
	
	// 补充非系统dict下拉
	function repatchdropdownlist(e, initdata) {
		// 如果在初始化数据，则不响应字段变化情况
		if (e && begininitoneitem)
			return;
		
		topdialog().find("[paramdict]").each(function(){
			var thisparamdictObj = this;
			if (e && e.target == this) {
				return;
			}
			
			var pdctstr = $(this).attr("paramdict");
			var finalpdict = pdctstr;
			
			if (/^{/.test(pdctstr)) {
				finalpdict = findformjsFromformjsObj(pdctstr, initdata);
			}
			
			if (finalpdict == null) {
				$(this).find("[ad=true]").remove();
				return;
			}
			
			// 可能为多列表合并情况
			var finalpdictarr = finalpdict.split(",");
			
			var opthtml = "";
			
			var dictparamnames = {};
			
			var comboboxdatasrcdata = [];// 当为combobox时
			$(finalpdictarr).each(function() {
				
				if (/^\d+$/.test(this))
					return;
				
				finalpdict = this;
				var paramdictarr = finalpdict.split(".");
				var paramfieldvals = $("[name=" + paramdictarr[0] + "]").val();
				
				if (!paramfieldvals)
					return;
				
				var paramfieldjson = JSON.parse(paramfieldvals);
				
				
				// 获取左侧所有列表，用以判断某属性已经被选中过
				var listformlabels = topdialog().find(".listform label");
				var returnarr = [];
				listformlabels.each(function(){
					
					// 如果当前值为激活左侧项所携带，则忽略
					if (e && $(this).is(".active"))
						return;
					
					
					var labelparamdictval = $(this).data('formdata')[$(thisparamdictObj).attr("name")];
					
					// 若为初始化右侧表单，并且初始化的值与左侧任意列表表单数据值一致，则忽略
					if (initdata && initdata[$(thisparamdictObj).attr("name")] == labelparamdictval)
						return;
					
					returnarr.push(labelparamdictval);
				});
				
				
				$(paramfieldjson).each(function(){
					// 左侧选择过的数值就不允许再次选择了(20170908修改，此处打开允许再次选择)
					var opval = paramdictarr[1];
					var oplabel = paramdictarr[1];
					if (paramdictarr.length > 2) {
						opval = paramdictarr[2];
					}
					
					var isselected = -1;

					if ($(thisparamdictObj).is(".combobox")) {
						comboboxdatasrcdata.push({dict_text: "{$" + this[oplabel] + "}"});
					} else {
						if (isselected == -1 && !dictparamnames[this[opval]]) {
							dictparamnames[this[opval]] = true;
							opthtml += "<option ad='true' value='" + this[opval] + "'>" + this[oplabel] + "</option>";
						}
					}
					
				});
				
				
			});

			
			var oldval = $(this).val();
			$(this).find("[ad=true]").remove();
			if ($(this).is(".combobox")) {
				var srcdatasrcdata = $(this).attr("datasrcdata");
				var srcdatasrcdatajson = [];
				if (srcdatasrcdata && srcdatasrcdata.length && srcdatasrcdata[0] == '[') {
					srcdatasrcdatajson = JSON.parse(srcdatasrcdata);
				}
				$(comboboxdatasrcdata).each(function(){
					srcdatasrcdatajson.push(this);
				});
				
				// 去重 begin
				var textmap = {};
				for (var i = 0; i < srcdatasrcdatajson.length;) {
					if (textmap[srcdatasrcdatajson[i].dict_text]) {
						srcdatasrcdatajson.splice(i, 1);
						continue;
					} else {
						textmap[srcdatasrcdatajson[i].dict_text] = true;
						++i;
					}
				}
				// 去重   end
				
				
				$(this).attr("datasrcdata", JSON.stringify(srcdatasrcdatajson));
				if ($(this).data("uiCombobox"))
					$(this).combobox("option", "dataProvider", srcdatasrcdatajson);
			} else {
				$(this).append(opthtml);
			}
			$(this).val(oldval);
			
		});
	}
	
	
	function addlistformview(listformdatas) {
		$(listformdatas).each(function(){
			addOneExtraline(this);
		});
		
		var listformlabels = topdialog().find(".listform label:first");
		
		if (listformlabels.length) {
			listformlabels.click();
		} else {
			var listformright = topdialog().find(".listformright");
    		listformright.resetForm();
		}
		
	}
	
	function addOneExtraline(data) {
		
		var label = getLeftListItemLabel(data);
		
		var listform = topdialog().find(".listform");
			$('<label class="btn btn-default form-control">   \
		    <input type="radio" name="options" id="option1" autocomplete="off"><span>' + "<div style='text-overflow:ellipsis;overflow:hidden;'>" + label + "</div>" + '</span>\
		  </label>').data("formdata", data).appendTo(listform);
			
	}
	
	// 实现集合编辑
	window['showCollectView'] = function(success,  fieldjson, currvalue){
		isShowingCollectView = true;
		if (!currvalue)
			currvalue = "[]";
		
		if ($.isPlainObject(fieldjson.collect)) {
			currentFormStack.push(fieldjson.collect);
		} else {
			currentFormStack.push(JSON.parse(fieldjson.collect));
		}
		
		topdefstack.push(fieldjson.label);
		
		var splittoken = null;
		if ($.isPlainObject(fieldjson.collect)) {
			splittoken = fieldjson.collect.backsplittoken;
		} else {
			splittoken = JSON.parse(fieldjson.collect).backsplittoken;
		}
		
		var finaltopcurrform = topcurrform();
		if ($.isPlainObject(topcurrform().formjs)) {
			var formjs = findformjsFromformjsObj(JSON.stringify(finaltopcurrform.formjs));
			finaltopcurrform = JSON.parse(JSON.stringify(finaltopcurrform));
			finaltopcurrform.formjs = formjs;
		}
		
		$.get(ctx + "/gz/common/collectcontent.jsp?collectjson=" + encodeURIComponent(encodeURIComponent(JSON.stringify(finaltopcurrform))) + "&refpropvals=" + encodeURIComponent(JSON.stringify(fieldjson.currrefpropvalue||'')), function(html) {
			dialogstack.push($("<div/>").html(html).submitDialog({
    			showConfirm: false,
    			className:"collectform",
    			animate:false,
				title: topcurrdeflistname() + "-列表编辑",
				callback: function(closediag) {
					saveLastEdit();
					var listformlabels = topdialog().find(".listform label");
					var returnarr = [];
					listformlabels.each(function(){
						returnarr.push($(this).data('formdata'));
					});
					
					var retvalue = null;
					// 以逗号分割 splittoken 间隔参数
					if (splittoken) {
						retvalue = "";
						var retvaluearr = [];
						$(returnarr).each(function(){
							retvaluearr.push(this.param_name + ":" + this.param_value + ":" + this.pass_way);
						});
						retvalue = retvaluearr.join(",");
					} else {
						retvalue = JSON.stringify(returnarr);
					}
					success({value:retvalue});
				},
				close:function() {
					dialogstack.pop();
					currentFormStack.pop();
					topdefstack.pop();
					
					success(null);
				}
			}));
			
			var listform = topdialog().find(".listform");
    		
    		listform.empty();
    		
    		var collectvals = null; 
    		// 以特殊字符分隔的情况
    		if (splittoken) {
    			collectvals = [];
    			if (currvalue) {
    				var paramsstrarr = currvalue.split(",");
    				$(paramsstrarr).each(function(){
    					var oneparamsstrarr = this.split(splittoken);
    					collectvals.push({param_name:oneparamsstrarr[0], param_value:oneparamsstrarr[1], pass_way:oneparamsstrarr[2]});
    				});
    			}
    		} else {
    			collectvals = JSON.parse(currvalue); 
    		} 
    		
    		if (topcurrform().orderfield) {
    			collectvals = collectvals.sort(function(a, b){
        			return parseInt(a[topcurrform().orderfield]) - parseInt(b[topcurrform().orderfield]);
        		});
    		}
    		
    		addlistformview(collectvals);
			
			
			// 上移下移实现 
			if (topcurrform().orderfield) {
				topdialog().find(".glyphicon-arrow-up,.glyphicon-arrow-down").show();
    			topdialog().find(".glyphicon-arrow-up,.glyphicon-arrow-down").on("click", function(){
    				var porn = $(this).is(".glyphicon-arrow-up")?"prev":"next";
    				var aorb = $(this).is(".glyphicon-arrow-up")?"after":"before";
    				
    				var curractivelabel = topdialog().find(".listform label.active");
    				var thchange = curractivelabel[porn]();
    				
    				if (!thchange.length)
    					return;
    				
    				var curractiveordernum = $.inArray(curractivelabel[0], topdialog().find(".listform").find("label"));
    				var thchangeordernum = $.inArray(thchange[0], topdialog().find(".listform").find("label"));
    				
    				if (curractiveordernum == thchangeordernum)
    					return;
    				
    				var curractiveformdata = curractivelabel.data("formdata");
    				curractiveformdata[topcurrform().orderfield] = thchangeordernum;
    				var thchangeformdata = thchange.data("formdata"); 
    				thchangeformdata[topcurrform().orderfield] = curractiveordernum;
    				curractivelabel.data("formdata", curractiveformdata);
    				thchange.data("formdata", thchangeformdata);
    				$(".listformright").find("[name=" + topcurrform().orderfield + "]").val(thchangeordernum);
    				
    				curractivelabel[aorb](thchange);
    				
    				// 全体整理order字段
    				topdialog().find(".listform label").each(function(idx){
    					$(this).data("formdata")[topcurrform().orderfield] = idx;
    				});
    			});
			}
			
			$(".listformright").on("change", function(){showWhen.call(topdialog())});
			$(".listformright").on("change", repatchdropdownlist);
			
			// 刷新所有使用当前字段为默认数值的表单
			$(".listformright").on("change", function(e){
	      		var thisObj = e.target;
	      		topdialog().find(".listformright :input").each(function(){
	      			var defsrcfield = $(this).attr("defsrcfield");
	      			
	      			var valfunc = "val";
	      			if (!defsrcfield)
	      				return;
	      			
	      			defsrcfieldarr = defsrcfield.split(".");
	      			if (defsrcfieldarr.length > 1) {
	      				valfunc = 'text';
	      			}
	      			defsrcfield = defsrcfieldarr[0];
	      			
	      			if (defsrcfield == $(thisObj).attr("name")) {
	      				if (valfunc == 'text') {
	      					$(this).val($(thisObj).find("option[value=" + $(thisObj).val() + "]")[valfunc]());
	      				} else {
	      					$(this).val($(thisObj)[valfunc]());
	      				}
	      				
	      			}
	      		});
			});
			
			
			// 初始化combobox 
        	topdialog().find(".combobox").each(function(){
//        		[{"sid":"10830","dict_code":1083,"dict_value":"1","dict_text":"{$CURRENT_USER}","is_readonly":0,"order_no":null,"remark":null,"relatedid":null},{"sid":"10831","dict_code":1083,"dict_value":"2","dict_text":"{$CURRENT_USER_ID}","is_readonly":0,"order_no":null,"remark":null,"relatedid":null},{"sid":"10832","dict_code":1083,"dict_value":"3","dict_text":"{$CURRENT_TIME}","is_readonly":0,"order_no":null,"remark":null,"relatedid":null},{"sid":"10833","dict_code":1083,"dict_value":"4","dict_text":"{$CURRENT_DATE}","is_readonly":0,"order_no":null,"remark":null,"relatedid":null},{"sid":"10834","dict_code":1083,"dict_value":"5","dict_text":"{$CURRENT_DEPT}","is_readonly":0,"order_no":null,"remark":null,"relatedid":null}]
        		$(this).combobox({dataProvider:JSON.parse($(this).attr("datasrcdata")), labelfield:"dict_text"});
        	});
        	
        	isShowingCollectView = false;
		});
		
		/** 复制或添加新行 */
		var copyOrNewExtraline = function(iscopy) {
			saveLastEdit();
    		var listformright = topdialog().find(".listformright");
    		!iscopy && listformright.resetForm();
    		var lastdata = getCurrListFormData();
    		iscopy && (lastdata.sid = $.Guid.New().replace(/-/g,''));
    		addOneExtraline(lastdata);
    		topdialog().find(".listform").find("label:last").click();
    		
    		// 顺序字段补充 
    		if (topcurrform().orderfield) {
    			listformright.find("[name=" + topcurrform().orderfield + "]").val(topdialog().find(".listform").find("label").length - 1);
    		}
		}
		
		window['addNewExtraline'] = function() {
			copyOrNewExtraline(false);
    	}

		window['copyToNewExtraline'] = function() {
			copyOrNewExtraline(true);
    	}
    	
    	window['removeCurrSelect'] = function() {
    		topdialog().find(".listform").find("label.active").remove();
    		var lastlabel = topdialog().find(".listform").find("label:last");
    		lastlabel.click();
    		if (!lastlabel.length) {
    			var listformright = topdialog().find(".listformright");
	    		listformright.resetForm();
    		}
    		if (lastlabel.length == 0)
    			topdialog().find(".cccontentright").hide();
    		
    	}
    	
    	
    	
    	
    	
    	window['selectFlowHandler'] = function(success, fieldjson, currvalue){
        	var handler_type = exports.topdialog().find("[name=handler_type]").val();
        	//  "1":"人员"  1110, "2":"角色" 1111, "4":"流程相关", "6":"自定义"
        	if (handler_type == 1 || handler_type == 2) {// 功能点选择
        		var nfuncid = "1110";
        		if (handler_type == 2) {
        			nfuncid = "1111";
        		}
        		
        		exports.openComsearchSelect(nfuncid, function(selecteditems) {
        			if (!selecteditems.length) {
    					uibase.alert("请选择！");
    					return false;
    				} else {
//    					{"ui_code":"KEY_RISK_INDT_CHECK","ui_name":"综合限额指标数据填报复核","ui_type":"动态界面","ui_desc":"综合限额指标数据填报复核","remark":"综合限额指标数据填报复核","creator":"admin","create_time":"2014-04-11 19:14:04","last_upd_user":"admin","last_upd_time":"2014-04-20 17:30:49","tree_id":"F6228FD925184E3EE0430100007FF259","tree_parent_id":"E923B69CC0702EB7E040160A66062E40","is_ui":1,"ui_category_id":"E923B69CC0702EB7E040160A66062E40","is_system":"0","ico_index":"2","level":1,"isLeaf":true,"expanded":false,"_id_":"F6228FD925184E3EE0430100007FF259","sid":"F6228FD925184E3EE0430100007FF259"}
    					if (nfuncid == '1110') {
    						success({value:selecteditems[0].user_code, label:selecteditems[0].user_name});
    					} else if (nfuncid == '1111') {
    						success({value: (selecteditems[0].role_id||''), label: (selecteditems[0].role_name||'') });
    					}
    					
    				}
        		});
        	}
        	
        	if (handler_type == 4) {// 流程相关下拉选择
        		
        		var opthtml = "";
        		var json = editor.getJSON();
        		$(json.childShapes).each(function() {
        			var shapethat = this;
        			if (shapethat.stencil.id == 'UserTask')	{
        				opthtml += "<option value='" + shapethat.resourceId + "'>" + (shapethat.properties.node_name || shapethat.properties.name) + "</option>";
        			}
        		});
        		
        		exports.openDropDownSelect("选择流程节点", opthtml, currvalue, function(formvals){
    				success({value:formvals[0].value, label: formvals[0].value});
    			});
        	}
        	
        	if (handler_type == 6) {// 自定义
        		editExtProperty(success, {formjs:"wfprocedure.js", separator:";"}, currvalue);
        	}
        	
    	};
    	
    }
    
    window['chooseSuper'] = function(success, fieldjson, currvalue, viewfieldval) {
		exports.openComsearchSelect("7758001", function (selecteditems) {
			if (!selecteditems.length) {
				uibase.alert("错误!请重试!");
				return false;
			} else {
                console.log("select>>>>>>>",selecteditems);
				var labelcodes = $.extractField(selecteditems,"dept_id");
				success({value:$.extractField(selecteditems,"dept_id") + ""});
			}
		});
	}
	
});




{
	"output":"test:1.0;test1:1;test3:2;",
	"timestamp":"16:15:47.994"
}


{
	"timestamp":"16:15:47.994",
	"test":"1",
	"test1":"2",
	"test2":"4"
}
{
	"timestamp":"16:15:47.994",
	"test":"1",
	"test1":"2",
	"test2":"4"
}

{"test":1,"test1":"1","test3":"2","output":"test:1.0;test1:1;test3:2;","timestamp":"16:42:47.745"}