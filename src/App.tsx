import { useEffect, useRef, useState } from "react";  // 引入 React 相关的 hooks
import { message } from "antd";  // 引入 antd 组件库中的 message
import { createEditor } from "./editor";  // 引入自定义的编辑器模块

// 自定义 hooks，用于封装 rete 编辑器的初始化流程，返回一个设置容器的函数
export function useRete(create: (el: HTMLElement) => Promise<() => void>) {
  const [container, setContainer] = useState(null);  // 定义状态变量 container 和设置函数 setContainer，初始值为 null
  const editorRef = useRef<Awaited<ReturnType<typeof create>>>(null);  // 定义 useRef，用于存储编辑器的 ref

  useEffect(() => {  // 定义 useEffect，依赖项为 container
    if (container) {  // 如果 container 不为空，即 DOM 容器元素已渲染完毕
      create(container).then((value) => {  // 调用 create 方法初始化编辑器，将返回的销毁方法存储在 editorRef 中
        (editorRef).current = value;
      });
    }
  }, [container]);

  useEffect(() => {  // 定义 useEffect，用于组件卸载时销毁编辑器
    return () => {
      if (editorRef.current) {  // 如果上一步初始化成功，即 editorRef 不为空
        editorRef.current();  // 调用销毁方法销毁编辑器
      }
    };
  }, []);

  return [setContainer];  // 返回设置容器的函数
}

// 默认导出组件 App
export default function App() {
  const [messageApi, contextHolder] = message.useMessage();  // 使用 antd 的 message 组件

  const [setContainer] = useRete((el) => {  // 调用自定义 hooks 获取设置容器的函数，并传入自定义的 createEditor 方法
    return createEditor(el, messageApi.info);
  });
  const ref = useRef(null);  // 定义 useRef，用于存储容器元素的 ref

  useEffect(() => {  // 定义 useEffect，依赖项为 ref.current
    if (ref.current) {  // 如果 ref.current 不为空，即 DOM 容器元素已渲染完毕
      setContainer(ref.current);  // 调用设置容器的函数，将容器元素设置为 ref.current
    }
  }, [ref.current]);

  return (
      <div className="App">  // 渲染组件
        {contextHolder}  // 渲染 antd 的全局 message 组件的上下文
        <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>  // 渲染容器元素
      </div>
  );
}