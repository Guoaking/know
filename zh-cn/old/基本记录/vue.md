## vue 搜集

```javascript
// 使用
<div class="tree" style="z-index:9">
<child-component  :list='chapter' v-on:give-advice="showAdvice"></child-component>
</div>

var child = {
//.videoplay .icon-leaf .list-item
template: "<ul><li class='list-item' v-for='(item, index) in list' :key='index'><span @click='giveAdvice(item,$event)'  :class=\"item.active==true? 'active11':'active33'\"> <i :class=\"item.active==true? 'active22':'active33'\"></i>{{item.p}}  {{item.n}} <div class='chapter_time'>{{item.timelength}}</div> <a href=''>考试</a></span>  <ul v-if='item.children' class='icon-leaf'><list :list='item.children' @childEvent = 'childEvent($event)'></list></ul> </li></ul>",
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
    let parent = this.$parent;

    while (parent && !parent.isTreeRoot) {
        parent = parent.$parent;
    }
    this.tree = parent
},
mounted() {

},
watch: {
    list(n, old) { //n为新值,o为旧值;
        this.list = n;
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
        }

    },
    childEvent(data) {
        this.$emit('give-advice', data)
    },
    getParentDate() {
        var self = this;
        let current_chapter = self.$parent.$parent.current_chapter
        if (current_chapter.active) {

        }
    }
},
name: "List",
}


//  父组件 调用
showAdvice(current_chapter) {
    

}

// 对应的点击事件
initTree() {
    let parent;

    parent = $('.tree li:has(ul)').addClass('parent_li');
    parent.find(' > span').attr('title', 'Collapse this branch');

    // this.$nextTick(() => {
    //     /* debugger;*/
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
}
```