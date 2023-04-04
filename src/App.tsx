import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { createEditor } from "./editor";

export function useRete(create: (el: HTMLElement) => Promise<() => void>) {
  const [container, setContainer] = useState(null);
  const editorRef = useRef<Awaited<ReturnType<typeof create>>>(null);

  useEffect(() => {
    if (container) {
      create(container).then((value) => {
        (editorRef).current = value;
      });
    }
  }, [container]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current();
      }
    };
  }, []);

  return [setContainer];
}

export default function App() {
  const [messageApi, contextHolder] = message.useMessage();

  const [setContainer] = useRete((el) => {
    return createEditor(el, messageApi.info);
  });
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref.current]);

  return (
      <div className="App">
        {contextHolder}
        <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>
      </div>
  );
}
