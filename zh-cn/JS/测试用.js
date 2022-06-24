let data = [
  {
    "sid": "1607419363483",
    "sectionname": "第一章",
    "knobblemsg": null,
    "timelength": null,
    "pid": "0",
    "handoutssid": "1607419335436",
    "cd": [],
    "n": "第一章",
    "parent_id": null,
    "id": "1607419363483",
    "open": true,
    "children": [
      {
        "sid": "1607419371317",
        "sectionname": "老虎如何表达对人类的信任",
        "knobblemsg": "/courseupload/1607419335436/1607419363483/1607419371317.mp4",
        "timelength": "0",
        "pid": "1607419363483",
        "handoutssid": "1607419335436",
        "cd": [],
        "n": "老虎如何表达对人类的信任",
        "parent_id": "/courseupload/1607419335436/1607419363483/1607419371317.mp4",
        "id": "1607419371317",
        "open": true,
        "p": "P1",
        "children": []
      }
    ]
  },
  {
    "sid": "1607419367916",
    "sectionname": "第二章",
    "knobblemsg": null,
    "timelength": null,
    "pid": "0",
    "handoutssid": "1607419335436",
    "cd": [],
    "n": "第二章",
    "parent_id": null,
    "id": "1607419367916",
    "open": true,
    "children": [
      {
        "sid": "1607419682504",
        "sectionname": "我是视频mp4",
        "knobblemsg": "/courseupload/1607419335436/1607419367916/1607419682504.mp4",
        "timelength": "0",
        "pid": "1607419367916",
        "handoutssid": "1607419335436",
        "cd": [],
        "n": "我是视频mp4",
        "parent_id": "/courseupload/1607419335436/1607419367916/1607419682504.mp4",
        "id": "1607419682504",
        "open": true,
        "p": "P1",
        "children": []
      }
    ]
  }
]

function getArray(data, name) {
  for (var i in data) {
    //console.log('i',i);
    //console.log('datai',data[i].children);
    if (data[i].n == "老虎如何表达对人类的信任") {
      data[i].active = true;
      break;
    } else {
      data[i].active = false;
      getArray(data[i].children, name);
    }
  }
}
console.log(getArray(data, '老虎如何表达对人类的信任'))
console.log(JSON.stringify(data, null, 2))



// 二元判断优化
if (chapter_url) {


  // 不同的类型不同的url赋值方法
  if (self.showType == "docx") {
    //pdf
    self.pdfurl = pdfPath + ctx + chapter_url
  } else if (self.showType == "图文") {
    self.current_chapter.knobblemsg = chapter_url
  } else {
    // 视频如果没有 第一章的第一个视频赋值
    self.videourl = ctx + chapter_url
  }
} else {
  // 不同的类型不同的url赋值方法
  if (self.showType == "docx") {
    //pdf
    if (resArr[0].children[0].knobblemsg) {
      self.pdfurl = pdfPath + ctx + resArr[0].children[0].knobblemsg
    }
  } else if (self.showType == "图文") {
    if (resArr[0].children[0].knobblemsg) {
      self.current_chapter = resArr[0].children[0]
    }
  } else {
    // 视频如果没有 第一章的第一个视频赋值
    if (resArr[0].children[0].knobblemsg) {
      self.videourl = ctx + resArr[0].children[0].knobblemsg
    }
  }

  self.current_chapter = resArr[0].children[0]

}
// ---------------拼接成字符串存到Map里-----------------------
const actions = new Map([
  ['chapter_url_pdf', ()=>{ self.pdfurl = pdfPath + ctx + chapter_url}],
  ['chapter_url_图文', ()=>{ self.current_chapter.knobblemsg = chapter_url}],
  ['chapter_url_视频', ()=>{ self.videourl = ctx + chapter_url}],
  ['else_pdf', ()=>{ self.pdfurl = pdfPath + ctx + resArr[0].children[0].knobblemsg; self.current_chapter = resArr[0].children[0]}],
  ['else_图文', ()=>{ self.current_chapter = resArr[0].children[0]; self.current_chapter = resArr[0].children[0]}],
  ['else_视频', ()=>{ self.videourl = ctx + resArr[0].children[0].knobblemsg; self.current_chapter = resArr[0].children[0]}]
  ['default', ()=>{ return "123123"}]
])


const onButtonClick = (identity,status)=>{
  let action = actions.get(`${identity}_${status}`) || actions.get('default')
  action.call(this)
}

onButtonClick("chapter_url","pdf")

// ----------------将condition存为Object存到Map里----------------------


const actions2 = new Map([
  [{identity:'chapter_url',status:"pdf"},()=>{self.pdfurl = pdfPath + ctx + chapter_url}],
  [{identity:'chapter_url',status:"图文"},()=>{self.current_chapter.knobblemsg = chapter_url}],
])


const onButtonClick2 = (identity,status)=>{
  let action = [...actions2].filter(([key,value])=>(key.identity == identity && key.status == status))
  action.forEach(([key,value])=>value.call(this))
}
onButtonClick2("chapter_url","pdf")

// -----------------将condition写作正则存到Map里---------------------

const actions = new Map([
  ['chapter_url_pdf', ()=>{ self.pdfurl = pdfPath + ctx + chapter_url}],
  ['chapter_url_图文', ()=>{ self.current_chapter.knobblemsg = chapter_url}],
  ['chapter_url_视频', ()=>{ self.videourl = ctx + chapter_url}],
  ['_pdf', ()=>{ self.pdfurl = pdfPath + ctx + resArr[0].children[0].knobblemsg; self.current_chapter = resArr[0].children[0]}],
  ['_图文', ()=>{ self.current_chapter = resArr[0].children[0]; self.current_chapter = resArr[0].children[0]}],
  ['_视频', ()=>{ self.videourl = ctx + resArr[0].children[0].knobblemsg; self.current_chapter = resArr[0].children[0]}]
  ['default', ()=>{  "123123"}]
])

const actions3 = ()=>{
  const functionA = ()=>{self.current_chapter = resArr[0].children[0]}
  return new Map([
    [/^chapter_url_docx$/,()=>{ self.pdfurl = pdfPath + ctx + chapter_url}],
    [/^chapter_url_图文$/,()=>{ self.current_chapter.knobblemsg = chapter_url}],
    [/^chapter_url_视频$/,()=>{ self.videourl = ctx + chapter_url}],
    [/^_pdf$/, ()=>{ self.pdfurl = pdfPath + ctx + resArr[0].children[0].knobblemsg; }],
    [/^_图文$/, ()=>{ self.current_chapter = resArr[0].children[0]; }],
    [/^_视频$/, ()=>{ self.videourl = ctx + resArr[0].children[0].knobblemsg; }]
    [/^_.*$/,functionA]
    ['default', ()=>{  "123123"}]
  ])
}
const onButtonClick3 = (identity,status)=>{
  let action = [...actions3()].filter(([key,value])=>(key.test(`${identity}_${status}`)))
  action.forEach(([key,value])=>value.call(this))
}

// -----------------将condition写作正则存到Ojbect里---------------------
const actions = {
  'chapter_url_pdf':(self)=>{self.pdfurl = pdfPath + ctx + chapter_url},
  'chapter_url_图文':(self)=>{self.current_chapter.knobblemsg = chapter_url},
  'chapter_url_视频':(self)=>{ self.videourl = ctx + chapter_url},
  '_pdf':(self)=>{self.pdfurl = pdfPath + ctx + resArr[0].children[0].knobblemsg; self.current_chapter = resArr[0].children[0]},
  '_图文':(self)=>{self.current_chapter = resArr[0].children[0]; self.current_chapter = resArr[0].children[0]},
  '_视频':(self)=>{self.videourl = ctx + resArr[0].children[0].knobblemsg; self.current_chapter = resArr[0].children[0]},
  'default': ()=>{  "123123"}
}
 
const onButtonClick = (identity,status)=>{
  let action = actions[`${identity}_${status}`] || actions['default']
  action.call(this)
}



function formatSeconds(value) {
  let result = parseInt(value)
  let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600);
  let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
  let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));

  let res = '';
  if(h !== '00') res += `${h}h`;
  if(m !== '00') res += `${m}min`;
  res += `${s}s`;
  return res;
}