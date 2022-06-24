define(function (require, exports, module) {

	require("uiutils");
	require("chosen");
	require('common/js/vue.js');
	require('common/js/moment.min.js');
	moment.locale('zh-cn'); //设置语言 
	Vue.prototype.$moment = moment;//赋值使用
	require('pdfviewer/generic/build/pdf.js');


	var uibase = require('uibase');
	var paramsdll;
	var pdfPath = ctx + "/pdfviewer/generic/web/viewer.html?file="
	var startPageTime;

	exports.init = function (opts, dllparams) {
		paramsdll = dllparams.params;
		console.log("🚀 ~ file: temp copy 4.js ~ line 14 ~ dllparams", dllparams)
		console.log("🚀 <<<<<<<<<<<<<<<<<<<<<<<<<<params", paramsdll)
		//课程id
		var course_id = paramsdll.course_id || 0;
		//小节id 模拟
		var chapter_id = paramsdll.item && paramsdll.item.sid || 0
		//小节url
		var chapter_url = paramsdll.item && paramsdll.item.knobblemsg || 0
		//var app = $(dllparams.formobj).find(".videoplay")[0]
		//console.log($(dllparams.formobj), "23423")
		//
		var child = {

			//.videoplay .icon-leaf .list-item
			//template: "<ul><li class='list-item' v-for='(item, index) in list' :key='index'><span @click='giveAdvice(item,$event)'  :class=\"item.active===true? 'active11':'active33'\"> <i :class=\"item.active==true? 'active22':'active33'\"></i><p>{{item.p}}  {{item.n}} </p><div class='chapter_time'>{{item.fmttime}}</div> <a href=''>考试</a></span>  <ul v-if='item.children' class='icon-leaf'><list :list='item.children' @childEvent = 'childEvent($event)'></list></ul> </li></ul>",
			template: "<ul><li class='list-item' v-for='(item, index) in list' :key='index'><span @click='giveAdvice(item,$event)'  :class=\"item.active==true? 'active11':'active33'\"> <i :class=\"item.active==true? 'active22':'active33'\"></i><p>{{item.p}}  {{item.n}} </p><div class='chapter_time'>{{item.fmttime}}</div></span>  <ul v-if='item.children' class='icon-leaf'><list :list='item.children' @childEvent = 'childEvent($event)'></list></ul> </li></ul>",
			data: function () {
				return {
					chapter: [],
					current_chapter: null,
					tree: null,
				}
			},
			props: {
				list: {
					type: Array,
					default: () => []
				},
				currentChapter: {
					type: Object,
					default: function () {
						return {}
					}
				}
			},
			created() {
				//console.log("子初始化")
				let parent = this.$parent;

				while (parent && !parent.isTreeRoot) {
					parent = parent.$parent;
				}
				this.tree = parent
			},
			mounted() {

			},
			watch: {
				list: {
					handler(newValue, oldValue) {
						for (let i = 0; i < newValue.length; i++) {
							if (oldValue[i] != newValue[i]) {
								//console.log(newValue)
							}
						}
					},
					deep: true
				}
			},
			methods: {
				// 递归给父亲传值
				giveAdvice(item) {
					if (!item) {
						return

					}
					if (item.pid === "0") {

					} else {
						this.current_chapter = item
						this.$emit('childEvent', this.current_chapter)
						// console.log("递归给父亲传值");
						let curretntElm = event.target
						let span = $(curretntElm).parent('span')
						let ii = $(span).find('i')
						console.log(span, "《《《《《《")
						$('.videoplay .tree li span').removeClass("active11");
						$('.videoplay .tree li span i').removeClass("active22");
						var isorginactive = $(span).is(".active11");
						if (isorginactive) {
							$(span).removeClass("active11");
							$(ii).removeClass("active22");
						} else {
							$(span).addClass("active11");
							$(ii).addClass("active22");
						}



					}

				},
				childEvent(data) {
					this.$emit('give-advice', data)
					console.log(JSON.stringify(data) + "<<<<<<<<<<<<<<<<<<<<")
				},
				getParentDate() {
					var self = this;
					let current_chapter = self.$parent.$parent.current_chapter
					if (current_chapter.active) {
						console.log("有")
					}
					console.log(self.$parent.$parent.current_chapter, "mounted")
				}
			},
			name: "List",
		}

		new Vue({
			el: $(dllparams.formobj).find(".videoplay")[0],
			data: function () {
				return {
					//---------------------
					arr_dur_time: [],
					startPage_time: new Date().getTime(), //用户首次进入时间
					new_current_time: null,      // 当前时间 记录页面时间用
					// 用户超时定时器
					timeout_dur_time: null,
					Interval_new_current_time: null,
					//视频  start end 
					v_play_flag: null,
					v_start: null,
					v_end: null,
					arr_v_dur_time: [],
					oldScrollTop: 0, //记录上一次滚动结束后的滚动距离
					scrollTop: 0, // 记录当前的滚动距离
					asyncArray: null,
					//---------------------


					switchNoteing: false,
					//video 的src
					videourl: '',
					//pdf的url iframe的src
					pdfurl: '',
					showNote: false,
					// 编辑笔记的sid
					noteSid: 0,
					// 随机的富文本class
					teditor: 0,
					//展示的组件 图文、视频、pdf
					showType: '视频',
					//查看更多笔记按钮
					ShowMoreNote: false,
					currentPage: 1,
					pageSize: 5,
					notelist: [],
					info: {},
					chapter: [],
					current_chapter: {
						"sid": "1",
						"sectionname": "",
						"knobblemsg": null,
						"timelength": "",
						"pid": "0",
						"handoutssid": "1",
						"cd": [],
						"n": "loading",
						"parent_id": null,
						"id": "1",
						"open": true
					},
					actions: {
						'chapter_url_pdf': (self, resArr, chapter_url) => {
							if (self) {
								console.log("执行了赋值")
								self.pdfurl = pdfPath + ctx + chapter_url
							}
						},
						'chapter_url_图文': (self, resArr, chapter_url) => {
							if (self) {
								self.current_chapter.knobblemsg = chapter_url
							}
						},
						'chapter_url_视频': (self, resArr, chapter_url) => {
							if (self) {
								self.videourl = ctx + chapter_url
							}
						},
						'_pdf': async (self, resArr) => {
							if (resArr && resArr.children) {
								self.pdfurl = pdfPath + ctx + resArr.children[0].knobblemsg;
								self.current_chapter = resArr.children[0];
							}
						},
						'_图文': (self, resArr) => {
							if (resArr && resArr.children) {
								self.current_chapter = resArr.children[0];
							}
						},
						'_视频': (self, resArr) => {
							if (resArr && resArr.children) {
								self.videourl = ctx + resArr.children[0].knobblemsg;
								self.current_chapter = resArr.children[0];
							}
						},
						'default': () => { "123123" },
					}

				}
			},
			components: {
				"child-component": child
			},
			created() {
				var self = this;
				if (paramsdll.type === "pdf") {
					self.showType = "pdf"
				} else if (paramsdll.type === "图文") {
					self.showType = "图文"
				} else {
					self.showType = "视频"
				}

				// 获取视频和章节信息
				self.$options.methods.getCourseAndChapter(self);
				//  当前打开的章节 直接点击小节过来的
				if (paramsdll.item) {
					console.log("当前打开的章节 直接点击小节过来的");
					self.current_chapter = paramsdll.item
				}


				console.log(self.showType)
			},
			mounted() {
				var self = this;

				// 放监听器
				self.wclickHandler = self.wclickHandler.bind(self);
				self.beforeunloadHandler = self.beforeunloadHandler.bind(self);
				self.unloadHandler = self.unloadHandler.bind(self);
				window.addEventListener('beforeunload', self.beforeunloadHandler)
				window.addEventListener('unload', self.unloadHandler)
				window.addEventListener('click', self.wclickHandler)
				if (self.showType != "视频") {
					self.moveEvent = self.moveEvent.bind(self);
					window.addEventListener('keyup', self.moveEvent)
					self.moveEvent = self.moveEvent.bind(self);
					window.addEventListener('mousemove', self.moveEvent)
				} else {
					console.log("视频")
				}

				// window.addEventListener('scroll',this.handleScroll)


				self.teditor = self.getRandomId();
				self.teditorId = self.getRandomId();

				self.getNoteList(self);
				let div = $(".tab-pane.fade-transform-enter-active")
				div.css({ "overflow": "hidden", "overflow-y": "auto" })
				

				//尝试统计页面时间

				var endPageTIme;
				var visit_time = 0;
				self.startPage_time
				setTimeout(() => {
					console.log("🚀  进入时间：", self.startPage_time)
				}, 1000)

				
				
				self.$nextTick(() => {

					// 关闭页签
					var closebtn = $("#moduletab>li.active [label='学习'] .closeicon")
					console.log(closebtn)
					closebtn.unbind('click').click(e=>self.endEvent(e,self));


					//初始化富文本
					let app = $(dllparams.formobj).find(".videoplay")[0]
					$(dllparams.formobj).find("textarea[name=" + self.teditor + "]").attr("id", self.teditorId);
					
					seajs.use(["ueditor"], function () {
						debugger
						if ($(app).find("textarea[name=" + self.teditor + "]").data("uiUeditor")) {
						}
						$(app).find("textarea[name=" + self.teditor + "]").ueditor();
					});

				})

				
				



			},
			watch: {
				scrollTop(newValue, oldValue) {
					setTimeout(() => {
						if (newValue == window.scrollY) { //延时执行后当newValue等于window.scrollY，代表滚动结束
							console.log('滚动结束');
							this.oldScrollTop = newValue; //每次滚动结束后都要给oldScrollTop赋值
						};
					}, 20); //必须使用延时器，否则每次newValue和window.scrollY都相等，无法判断，20ms刚好大于watch的侦听周期，故延时20ms
					if (this.oldScrollTop == oldValue) { //每次滚动开始时oldScrollTop与oldValue相等
						console.log('滚动开始');
					}
				}
			},
			destroyed() {
				// 再次移除监听器
				window.removeEventListener('keyup', this.moveEvent)
				window.removeEventListener('mousemove', this.moveEvent)
				window.removeEventListener('beforeunload', e => this.beforeunloadHandler(e))
				window.removeEventListener('unload', e => this.unloadHandler(e))
				window.removeEventListener('click', e => this.wclickHandler(e))
			},

			methods: {
				endEvent (event,self) {
					console.log("进来了")
					if (event) {
						// debugger
						console.log(self)
						console.log(" event", event)
						console.log("执行了页面内关闭")

						endPageTIme = new Date(); //用户退出时间
						console.log("🚀 ~ file: temp copy 4.js ~ line 659 ~ $ ~ 退出时间", endPageTIme)

						visit_time = endPageTIme.getTime() - self.startPage_time;
						visit_time = Math.ceil(visit_time / 1000); //取的是秒并且化整
						console.log(visit_time, "区间时间")

						self.changeTextStatus(self, visit_time)

						// 统计发送结束时间
						self.addPlayCount(self, self.current_chapter)

						// 移除监听器和定时器
						window.removeEventListener('keyup', self.moveEvent)
						window.removeEventListener('mousemove', self.moveEvent)
						window.removeEventListener('beforeunload', self.beforeunloadHandler)
						window.removeEventListener('unload',self.unloadHandler)
						window.removeEventListener('click',self.wclickHandler)
						clearInterval(self.Interval_new_current_time);
						clearTimeout(self.timeout_dur_time)
					}
				},
				sendVideoCount(self) {
					// 视频时长获取
					if(self.v_play_flag==null){
						console.log("null了")
						return;
					}
					self.v_end = new Date().getTime();
					
					// 发给后台
					let v_dur_time = self.v_end - self.v_start;
					v_dur_time = Math.ceil(v_dur_time / 1000);
					console.log(v_dur_time, "v_dur_time");
					self.arr_v_dur_time.push(v_dur_time)
					self.v_play_flag = null;
					self.addPlayCount(self,self.current_chapter);
				},
				wclickHandler(){
					console.log("点了")
					let Vpage = $("#moduletab>li.active [label='学习']").length
					clearTimeout(this.timeout_dur_time);
					if (this.Interval_new_current_time != null) clearInterval(this.Interval_new_current_time);

					if(Vpage==0){
						// 页签虽然在但不在当前页  立即停止计时
						this.stop_count_time(this)
						if(this.showType=='视频')  this.$refs.videotag && this.$refs.videotag.pause(); //暂停视频
						return 
					}
					// 重新开始计时
					// this.timeout_dur_time = setTimeout(() => {
					// 	this.stop_count_time(this);
					// }, 1000 * 30);
					if(this.showType=='视频') this.$refs.videotag&&this.$refs.videotag.play();
					
				},
				beforeunloadHandler(event){
					if (event) {
						event.returnValue = '关闭提示';
					}
					return true;
				},
				unloadHandler(){
					GKwebSocket.send("退出了")
					this.sendVideoCount(this);
					console.log("退出頁面")
					// 加一段同步代码阻塞
					let now = new Date()
					while (new Date() - now < 100) { }
					return true
				},
				moveEvent() {
					//clear旧的定时器 ,重新设置定时器
					clearTimeout(this.timeout_dur_time);
					if (this.Interval_new_current_time != null) clearInterval(this.Interval_new_current_time);

					this.timeout_dur_time = setTimeout(() => {
						this.stop_count_time(this);
					}, 1000 * 30);
				},
				/**
					一旦被触发 意味着超时了 要停止计时
					1min
				 */
				stop_count_time(self) {
					// 获取开始时间 -> current_new_time 存在则用此,不然用 startPage_time
					console.log("触发stop_count_time")
					let start_time = self.new_current_time || self.startPage_time;
					let end_time = new Date().getTime();
					let dur_time = end_time - start_time;
					// 本次离开后的时间统计 dur_time 
					dur_time = Math.ceil(dur_time / 1000); //取的是秒并且化整
					self.arr_dur_time.push(dur_time);

					self.Interval_new_current_time = setInterval(() => {
						console.log("触发new_current_time")
						// 应该不断更新 新的开始时间 直到用户重新清除定时器
						self.new_current_time = new Date().getTime();
					}, 1000);
				},

				testa() {
					var videoPlayer = document.getElementById("videotag");
					console.log("aaa");
					videoPlayer.currentTime = 26.084268;
					console.log(videoPlayer.currentTime, "<<<<<<<<<<<<<<");
				},
				addPlayCount(self, current_chapter) {
					// 记录播放信息

					var id = localStorage.getItem("id")
					var b_time = localStorage.getItem("b_time")


					// 默认新增
					var data = {
						chapter_id: current_chapter.sid,
						course_id: current_chapter.handoutssid,
						user_code: window['_current_user'],
						flag: "insert"
					};


					// 修改参数
					if (id && b_time && id != "undefined" && b_time != "undefined" && typeof (id) != "undefined" && typeof (b_time) != "undefined") {
						// 修改
						console.log("修改")
						var t = null;
						var t1 = null;
						// 获得页面统计的
						if (self.arr_dur_time != null && self.arr_dur_time.length > 0) {
							t = self.arr_dur_time.reduce(function (prev, curr) {
								return prev + curr;
							});
						}

						if (self.arr_v_dur_time != null && self.arr_v_dur_time.length > 0) {
							t1 = self.arr_v_dur_time.reduce(function (prev, curr) {
								return prev + curr;
							});
						}
						console.log("self.arr_dur_time",self.arr_dur_time)
						console.log("arr_v_dur_time",self.arr_v_dur_time)
						data = {
							id: id,
							b_time: b_time,
							user_code: window['_current_user'],
							chapter_id: current_chapter.sid,
							course_id: current_chapter.handoutssid,
							t: t,
							flag: "update"
						}
					}

					$.ajax(
						{
							url: ctx + "/video/VideoPlayController/addPlayCount2.vot",
							type: 'POST',
							data: data,
							timeout: 0,
						}
					).then(function (res) {
						// 更新播放量死循
						//console.log(res, "累计了播放量");
						//console.log(chapter_id, "chapter_id");
						//self.getCourseAndChapter(self)

						res = JSON.parse(res);
						//todo 如果是修改的成功返回则 清空存储
						if (res.flag == "update") {
							localStorage.removeItem('id');
							localStorage.removeItem('b_time');
							return;
						}
						// 接受返回来的信息 存在供结束时用
						if (res.flag == "insert") {
							localStorage.setItem("b_time", res.b_time);
							localStorage.setItem("id", res.id);
						}

					}).fail(function (data, e) {
						console.error('获取信息失败' + JSON.stringify(e) + data);
					})
				},
				changeTextStatus(self, status) { //结束
					// 修改图文pdf的状态
					if (!self.info.planname) {
						console.log("不在计划内");
						return false;
					}
					console.log("在计划内");
					var self = self;
					let current_chapter = JSON.stringify(self.current_chapter)
					$.ajax(
						{
							url: ctx + "/video/VideoPlayController/changeChapterTextStatus.vot",
							type: 'POST',
							data: {
								current_chapter: current_chapter,
								status: status,
								type: paramsdll.type
							},
							timeout: 0,
						}
					).then(function (res) {

					}).fail(function (data, e) {
						console.error('获取信息失败' + JSON.stringify(e) + data);
					})


				},
				getRandomId(length = 6) {
					return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
				},
				//duration playing pause waiting
				playingGK(e) {

					this.v_start = new Date().getTime();
					this.v_play_flag = 'start'


					//this.addPlayCount(this,this.current_chapter);

					console.log("playingGK")
					console.log(videoPlayer.currentTime, "<<<<<<<<<<<<<<");
				},
				pauseGK(e) {
					// 暂停 更新结束时间

					this.sendVideoCount(this)

					console.log("pauseGK")
					console.log(videoPlayer.currentTime, "<<<<<<<<<<<<<<");
				},
				videoLoadedmetadata(elevideo) { //加载数据
					console.log("videoLoadedmetadata")
					var self = this;
					// 修改视频状态
					if (!self.info.planname) {
						console.log("不在计划内");
						return false;
					}
					elevideo.target.duration

					let current_chapter = JSON.stringify(self.current_chapter)
					$.ajax(
						{
							url: ctx + "/video/VideoPlayController/changeChapterStatus.vot",
							type: 'POST',
							data: {
								current_chapter: current_chapter,
								status: '1'
							},
							timeout: '5000',
						}
					).then(function (res) {
						//
					}).fail(function (data, e) {
						console.error('获取信息失败' + JSON.stringify(e) + data);
					})
				},
				videoEnded() { //结束
					console.log("videoEnded")
					var self = this;
					//更改小节状态为2
					if (!self.info.planname) {
						console.log("不在计划内");
						return false;
					}

					// 当前用户 当前课程 当前小节
					let current_chapter = JSON.stringify(self.current_chapter)
					$.ajax(
						{
							url: ctx + "/video/VideoPlayController/changeChapterStatus.vot",
							type: 'POST',
							data: {
								current_chapter: current_chapter,
								status: '2'
							},
							timeout: '5000',
						}
					).then(function (res) {

					}).fail(function (data, e) {
						console.error('获取信息失败' + JSON.stringify(e) + data);
					})

					// 更换下一个视频
					//todo
				},

				showAdvice(current_chapter) {
					//当前点击的小节的数据
					var self = this;
					startPageTime = new Date();//用户进入时间
					self.current_chapter = current_chapter
					//不同的类型不同的赋值方式
					if (self.showType === "pdf") {
						//pdf
						if (current_chapter.knobblemsg) {
							self.pdfurl = pdfPath + ctx + current_chapter.knobblemsg
						} else {
							console.error("pdf地址错误", current_chapter)
						}
					} else if (self.showType === "图文") {
						if (current_chapter.knobblemsg) {

						} else {
							console.error("图文地址错误", current_chapter)
						}
					} else {
						// 视频如果没有 第一章的第一个视频赋值
						if (current_chapter.knobblemsg) {
							videoUrl = current_chapter.knobblemsg.replace("//", "/");
							self.videourl = ctx + current_chapter.knobblemsg

						} else {
							console.error("视频地址错误：", current_chapter)
						}
					}
					self.isCurrentVideoUrl(self, current_chapter)
					// 添加播放量
					//self.addPlayCount(self,current_chapter.sid)

				},
				moreNote() {
					//跳转笔记列表
					if (course_id) {
						var dllparamsvar = { course_id: course_id };
						$(".modulecontainer .mctab").tabadd({ label: "笔记" }, {}, ".modulecontainer>.tab-content", function (tabpane) {
							var tform = $("<form class='form-horizontal' onsubmit='return false;' ref = 'listform' @scroll='handleScroll'></form>");
							tabpane.append(tform);
							dllparamsvar.formobj = tabpane;
							tform.load(ctx + "/pxkh/video/notelist.jsp", function () {
								if (window['notelist']) {
									window['notelist'](dllparamsvar);
								}
							});
						});

					} else {
						console.error("course_id异常");
					}


				},
				switchNoteingMouseMove() {
					clearTimeout(timer);
					//笔记按钮的显示隐藏
					if (!this.switchNoteing) {
						this.switchNoteing = true;
					}
					var timer = setTimeout(() => {
						this.switchNoteing = false;
					}, 3000)

				},
				editClick(event, data) {
					//编辑笔记
					var self = this;
					if (data.sid) {
						self.noteSid = data.sid;
					}
					// 回显信息到富文本框
					let curretntElm = event.target
					let parent = $(curretntElm).parents('.btngrp_parent').find('div:eq(4)');
					let html = parent.html();


					let app = $(dllparams.formobj).find(".videoplay")[0]
					$(app).find("textarea[name=" + self.teditor + "]").ueditor("getUe").setContent(html);

					// 滚上来
					self.showNote = true;
					$('.notepanel').css({ 'z-index': 10 })
					self.$nextTick(() => {
						target.scrollIntoView();
					})

				},
				deleteClick(data) {
					// 删除笔记
					var self = this;
					let msg = "删除笔记后不可恢复！确认删除吗？"

					uibase.confirm(msg, function (result) {
						self.$options.methods.deleteNoteBySid(data.sid, self);
						result(true)
					});

				},
				importClick(event, data) {
					//导出方法
					console.log(data);
					data = JSON.stringify(data);
					$.postIframe(ctx + "/video/NoteController/exportNote.vot", { suggest: 'test', data: data }, function (result) {
						let msg = "下载成功！"
					});

				},
				changeStatus() {
					if (this.showNote) {
						//隐藏
						this.showNote = false
					} else {
						//展示
						this.showNote = true
						$('.notepanel').css({ 'z-index': 10 })
						// 清楚编辑留下的笔记id
						this.noteSid = 0
					}
					//清空输入框内容
					let app = $(dllparams.formobj).find(".videoplay")[0]
					$(app).find("textarea[name=" + this.teditor + "]").ueditor("getUe").setContent(' ');
				},
				submitData() {
					// 提交表单
					var self = this;
					let app = $(dllparams.formobj).find(".videoplay")[0]
					var html = $(app).find("textarea[name=" + self.teditor + "]").ueditor("getUe").getContent();

					self.current_chapter['noteSid'] = self.noteSid;
					self.current_chapter['notetext'] = html;
					let str = JSON.stringify(self.current_chapter)

					$.ajax(
						{
							url: ctx + "/video/NoteController/insertOrUpdateNote.vot",
							type: 'POST',
							data: {
								'fromdata': str,
							},
							timeout: 0,
						}
					).then(function (res) {
						//清空
						self.noteSid = 0

						res = JSON.stringify(res)
						res = JSON.parse(res)
						// 此处刷新笔记list
						self.$options.methods.getNoteList(self);
						//  清空富文本元素
						$(app).find("textarea[name=" + self.teditor + "]").ueditor("getUe").setContent(' ');

						let msg = "保存成功！"
						uibase.alert(msg, function (result) {
							console.log(result, "result");
						});
					}).fail(function (data, e) {
						console.error('初始化加载信息失败' + JSON.stringify(e) + data);
					})
				},
				initTree() {
					let parent;

					parent = $('.tree li:has(ul)').addClass('parent_li');
					parent.find(' > span').attr('title', 'Collapse this branch');

					//默认展开
					// this.$nextTick(() => {

					//     let children = $('.tree li.parent_li > span').parent('li.parent_li').find(' > ul > ul > li');
					//     children.hide('fast');
					//     $('.tree li.parent_li > span').attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign')
					//         .removeClass('icon-minus-sign');
					// })


					$('.tree li.parent_li > span').on('click', function (e) {
						var children = $(this).parent('li.parent_li').find(' > ul > ul > li');
						if (children.is(":visible")) {
							children.hide('fast');
							$(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign')
								.removeClass('icon-minus-sign');
						} else {
							children.show('fast');
							$(this).attr('title', 'Collapse this branch').find(' > i').addClass(
								'icon-minus-sign').removeClass('icon-plus-sign');
						}
						e.stopPropagation();
					});
				},
				deleteNoteBySid(sid, self) {
					var self = self;
					$.ajax(
						{
							url: ctx + "/video/NoteController/deleteNoteBySid.vot",
							type: 'POST',
							data: {
								'sid': sid,
							},
							dataType: "json",
							timeout: '1000',
						}
					).then(function () {
						self.$options.methods.getNoteList(self);
					}).fail(function () {
						console.error('请求失败');
					})
				},
				getNoteList(self) {
					var self = self;
					if (course_id) {
						$.ajax(
							{
								url: ctx + "/video/NoteController/getNoteList.vot",
								type: 'POST',
								data: {
									'page': self.currentPage,
									'numPerPage': self.pageSize,
									'course_id': course_id,
									'chapter_id': chapter_id
								},
								dataType: "json",
								timeout: 0,
							}
						).then(function (res) {
							res = JSON.stringify(res)
							res = JSON.parse(res)
							//console.log("🚀 ~ file: temp copy 2.js ~ line 561 ~ res", res)

							if (!(Array.prototype.isPrototypeOf(res.currList) && res.currList.length === 0)) {
								//todo 第一次的默认的直接覆盖。以后的拼接
								self.notelist = res.currList;
								// 图片大小
								self.$nextTick(function () {
									let img = $(".ql-editor img")
									img.css({ "width": "360px" })
								})
								if (res.count > 5) {
									self.ShowMoreNote = true;
								} else {
									self.ShowMoreNote = false;
								}

							} else {
								self.ShowMoreNote = false;
								self.notelist = [];
								console.error(res.currList + "笔记列表为空")
							}
						}).fail(function (data, e) {
							console.error('初始化加载信息失败' + JSON.stringify(e) + JSON.stringify(data));
						})
					}


				},
				getCourseAndChapter(self) {
					// 获取资源和章节信息和相关计划名称
					var self = self;
					if (course_id) {

						$.ajax(
							{
								url: ctx + "/video/VideoPlayController/getVideo.vot",
								type: 'POST',
								data: {
									'course_id': course_id,
								},
								timeout: 0,
							}
						).then(function (res) {
							res = eval('(' + res + ')');
							self.info = res[0].treedatas[0];


							//给章节树赋值
							if (!(Array.prototype.isPrototypeOf(res[1].treedatas) && res[1].treedatas.length === 0)) {

								let resArr = parentDeal(res[1].treedatas, '0')
								self.chapter = resArr

								self.$nextTick(() => {
									// 初始化章节树
									self.initTree();
								})

								let a = chapter_url ? 'chapter_url' : '';
								self.onButtonClick(a, self.showType, self, resArr[0], chapter_url)


								//添加章节选中效果
								self.isCurrentVideoUrl(self, self.current_chapter)
							} else {
								console.error(res[1].treedatas + "章节错误")
							}

						}).fail(function (data, e) {
							console.error('初始化加载信息失败' + JSON.stringify(e) + data);
						})
					} else {
						console.error("course_id异常");
					}
				},
				isCurrentVideoUrl(self, current_chapter) {
					// console.log("尝试修改样式");
					var self = self

					if (!current_chapter) {
						console.error("当前章节错误")
					}
					let chapter = self.chapter
					// 增加浏览量
					console.log(current_chapter, "<<<<<<<<<<<<<<<<<<<<<<<<<<");
					self.addPlayCount(self, current_chapter)

					self.getArray(chapter, current_chapter.sid, self)
				},
				getArray(data, sid, self) {
					for (var i in data) {
						if (data[i].sid === sid) {
							data[i].active = true;
							break;
						} else {
							data[i].active = false;
							self.getArray(data[i].children, sid, self);
						}
					}
				},
				onButtonClick(identity, status, self, resArr, chapter_url) {
					// debugger
					let action = self.actions[`${identity}_${status}`] || self.actions['default']
					// todo 当前课程的url
					action.call(action(self, resArr, chapter_url))
				}

			}
		})





		function parentDeal(data, pid) {
			//声明返回数组
			let returnArr = [];
			data.forEach((item) => {
				if (item.pid === pid) {
					//除去最高层级的数据（id === 0）
					returnArr.push(item)
					//进入递归中处理
					childrenDeal(data, item, item.sid)
				}
			})
			return returnArr;
		}

		function childrenDeal(arr, itemData, itemId) {
			//首先判断是否有子类  没有默认为空
			itemData.children = itemData.children ? itemData.children : [];
			var num = 1;
			arr.forEach((item) => {
				//递归条件
				if (item.pid === itemId) {
					//找到则追加至上层数据children中
					item.p = 'P' + num++;
					item.fmttime = formatSeconds(item.timelength)
					itemData.children.push(item)
					//不断递归查找子类直到找不到子类本次递归结束才进入parentDeal函数进行下一最高层级操作
					childrenDeal(arr, item, item.sid)
				}
			})
		}

		function formatSeconds(value) {
			let result = parseInt(value)
			if (isNaN(result) || result === 0 || !result) {
				// 没有时间返回 ""
				return ""
			}

			let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600);
			let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
			let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));

			let res = '';
			if (h !== '00') res += `${h}:`;
			if (m !== '00') res += `${m}:`;
			res += `${s}`;
			return res;
		}


		/**视频播放进度保存 */
		var videoPlayer = document.getElementById("videotag");
		if(videoPlayer){
			videoPlayer.ontimeupdate = timeUpdate();
		} 
		function timeUpdate() {
			// console.log(videoPlayer.currentTime, "<<<<<<<<<<<<<<");
			//GKwebSocket.send(videoPlayer.currentTime);

		}





		/**
		 * 视频也要判断
		 * 判断如果状态是2则不改变
		 * 打开页面变更状态进行中
		 * *累计的时间存在哪？
		 * 关闭  存时间 够就改状态不够就
		 */
		//------
	}

	var host = window.document.location.host;
	var pathName = window.document.location.pathname;
	var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
	var wsServer = "ws://" + host + projectName;
	var GKwebSocket = null;
	if ('WebSocket' in window || 'MozWebSocket' in window) {
		console.log("okkk")
		GKwebSocket = new WebSocket(wsServer + "/gkWebSocket");
	} else {
		console.log("okkk")
		GKwebSocket = new SockJS(wsServer + "/sockjs/gkWebSocket");
	}
	GKwebSocket.onopen = onOpen;
	GKwebSocket.onmessage = onMessage;
	GKwebSocket.onerror = onError;
	GKwebSocket.onclose = onClose;

	function onOpen(result) {
		console.log("连接建立时触发:" + result.data);
	}

	function onMessage(result) {
		console.log(result)
		const reader = new FileReader()
		reader.readAsArrayBuffer(event.data)
		reader.onload = e => {
			if (e.target.readyState === FileReader.DONE) {
				// 处理二进制数据
			}
		}
	}
	function onError(result) {
		console.log("通信发生错误时触发:" + result.data);
	}
	function onClose(result) {
		console.log("连接关闭时触发:" + result.data);
	}




	//窗口关闭时,将websocket连接关闭
	window.close = function () {
		websocket.onclose();
	}

	//使用连接发送数据
	window['doSend'] = function () {
		if (GKwebSocket.readyState === GKwebSocket.OPEN) {
			var msg = document.getElementById("inputMsg").value;
			GKwebSocket.send(msg);//调用后台handleTextMessage方法
			console.log("发送成功!");
		} else {
			console.log("连接失败!");
		}
	}






});