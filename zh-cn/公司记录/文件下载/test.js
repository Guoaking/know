let fnSwitch = function (config){
    config = config ||{}

    let colorActive = config.colorActive || "#13ce66"
    let colorInActive = config.colorInActive ||"#999"
    let defaultVal = config.default;
    let id = config.id;

    // 组件内界面初始化定义
    let $main = $(id)
    console.log($main,"main")
    $main.addClass("main_box")
    $main.html("<div class='switch_box' dom='switch_box'></div>")
    $mainbox = $main.find("[dom='switch_box']")

    // 定义函数
    let handleColor = function(){
        if($main.hasClass("control")){
            // 如果主节点激活
            $main.css({'background':colorActive})
        }else{
            $main.css({'background':colorInActive})
        }
    }

    // 事件绑定
    $main.on("click",function(){
        console.log(defaultVal,"defaultVal")
        defaultVal = !defaultVal;
        console.log(defaultVal,"defaultVal")
        $main.toggleClass("control")  // 控制背景切换
        handleColor()   // 调整背景颜色

    })

    // 立即执行
    if(defaultVal== true){
        // 默认为true 则激活
        $main.addClass("control")
    }
    handleColor()

    return{
        // 供外部获取开关值的方法
        getValue: function(){
            return $main.hasClass("control")
        },

        setValue: function(value){
            if(value){
                $main.addClass("control")
            }else{
                $main.removeClass("control")
            }
            handleColor()
        }

    }





    




}