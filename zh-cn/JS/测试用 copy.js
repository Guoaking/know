var data = [
  {
    "label": "11111111楼",
    "value": 1,
    "parentId": 0,
    "children": [
      {
        "label": "1楼儿子2",
        "value": 4,
        "parentId": 1,
        "children": [
          {
            "label": "你是谁啊",
            "value": 6,
            "parentId": 4,
            "children": [
              {
                "label": "1312",
                "value": 15,
                "parentId": 6
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "label": "2楼",
    "value": 2,
    "parentId": 0,
    "children": [
      {
        "label": "566666",
        "value": 12,
        "parentId": 2
      }
    ]
  },
  {
    "label": "33333楼",
    "value": 13,
    "parentId": 0,
    "children": [
      {
        "label": "7567566765",
        "value": 14,
        "parentId": 13
      }
    ]
  }
]


var data2 =
  [
    {
      "id": 1,
      "name": "11111111楼",
      "parentId": 0
    },
    {
      "id": 2,
      "name": "2楼",
      "parentId": 0
    },
    {
      "id": 4,
      "name": "1楼儿子2",
      "parentId": 1
    },
    {
      "id": 6,
      "name": "你是谁啊",
      "parentId": 4
    },
    {
      "id": 12,
      "name": "566666",
      "parentId": 2
    },
    {
      "id": 13,
      "name": "33333楼",
      "parentId": 0
    },
    {
      "id": 14,
      "name": "7567566765",
      "parentId": 13
    },
    {
      "id": 15,
      "name": "1312",
      "parentId": 6
    }
  ]




function generateOptions(params) {//生成Cascader级联数据
  var result = [];
  for (let param of params) {
    if (param.parentId == 0) {//判断是否为顶层节点
      var parent = {//转换成el-Cascader可以识别的数据结构
        'label': param.name,
        'value': param.id,
        'parentId': param.parentId
      }
      parent.children = getchilds(param.id, params);//获取子节点
      result.push(parent);
    }
  }
  return result;
}

function getchilds(id, array) {
  let childs = new Array();
  for (let arr of array) {//循环获取子节点
    if (arr.parentId == id) {
      childs.push({
        'label': arr.name,
        'value': arr.id,
        'parentId': arr.parentId
      });
    }
  }
  for (let child of childs) {//获取子节点的子节点
    let childscopy = getchilds(child.value, array);//递归获取子节点
    if (childscopy.length > 0) {
      child.children = childscopy;
    }
  }
  return childs;
}

function TraverseTree(data, pid = 0) {

  for (const key in data) {

      console.log("来了")
      var element = data[key];
      if(element.parentId ==pid){
        console.log("来了叫爸爸")
        element.a = "叫爸爸"
      }else{
        console.log("来了儿子")
        element.a = "儿子"
        
      }
      TraverseTree(element.children,0)
     
    }
  
}

function getArray(data, pid) {
  for (var i in data) {
      if (data[i].parentId == pid) {
        console.log("来了叫爸爸")
          data[i].active = true;
      } else {
        console.log("来了儿子")
          data[i].active = false;
          
      }
      getArray(data[i].children, pid);
  }
}





TraverseTree(data,0)
console.log(JSON.stringify(data, null, 2))
//getItem(data,0)
// setTimeout(()=>{
//   console.log(JSON.stringify(data, null, 2))
// },3000);


// console.log(JSON.stringify(generateOptions(data2), null, 2))