// 定义 RegisterDbltouchEvent 类
class RegisterDbltouchEvent {
    el = null;
    callback = null;
    timer = null;
    prevPosition = {
        pageX: 0,
        pageY: 0
    };
    isWaiting = false;
    constructor(el, callback) {
        this.el = el;
        this.callback = callback;
        this.timer = null;
        this.prevPosition = {
            pageX: 0,
            pageY: 0
        };
        this.isWaiting = false;

        // 注册 click 事件
        this.el.addEventListener("click", this.handleClick.bind(this), true);
    }

    handleClick(evt) {
        const { pageX, pageY } = evt;

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (!evt.isTrusted) {
            return;
        }

        if (this.isWaiting) {
            this.isWaiting = false;
            const diffX = Math.abs(pageX - this.prevPosition.pageX);
            const diffY = Math.abs(pageY - this.prevPosition.pageY);

            // 如果满足位移小于10，则是双击
            if (diffX <= 10 && diffY <= 10) {
                // 取消当前事件传递，并派发一个自定义双击事件
                evt.stopPropagation();
                evt.target.dispatchEvent(
                    new PointerEvent("dbltouch", {
                        cancelable: false,
                        bubbles: true
                    })
                );
                // 执行回调函数
                this.callback && this.callback(evt);
            }
        } else {
            this.prevPosition = { pageX, pageY };
            // 开始等待第2次点击
            this.isWaiting = true;
            // 设置倒计时，之后重新派发当前事件
            this.timer = setTimeout(() => {
                this.isWaiting = false;
                evt.target.dispatchEvent(evt);
            }, 500);
        }
    }

    destroy() {
        // 清理事件监听器
        this.el.removeEventListener("click", this.handleClick.bind(this), true);
    }
}

// 自定义 vDbltouch 指令
const vDbltouch = {
    beforeMount(el, binding) {
        // 创建 RegisterDbltouchEvent 实例
        el._dbltouch = new RegisterDbltouchEvent(el, binding.value);
    },
    unmounted(el) {
        // 销毁实例以清理事件监听器
        if (el._dbltouch) {
            el._dbltouch.destroy();
            delete el._dbltouch;
        }
    }
};

export default vDbltouch;
