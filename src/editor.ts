import { createRoot } from "react-dom/client"; // 引入 React 的 createRoot 方法，用于渲染组件
import { NodeEditor, GetSchemes, ClassicPreset } from "rete"; // 引入 rete 库，用于构建可视化编辑器
import { AreaPlugin, AreaExtensions } from "rete-area-plugin"; // 引入 rete-area-plugin 库，提供了拖拽、缩放节点区域的功能
import { ConnectionPlugin } from "rete-connection-plugin"; // 引入 rete-connection-plugin 库，提供了连接节点的功能
import {
  ReactRenderPlugin,
  Presets,
  ReactArea2D
} from "rete-react-render-plugin"; // 引入 rete-react-render-plugin 库，提供了使用 React 渲染节点的功能
import { AutoArrangePlugin } from "rete-auto-arrange-plugin"; // 引入 rete-auto-arrange-plugin 库，提供了自动排列节点的功能
import { DataflowEngine, ControlFlowEngine } from "rete-engine"; // 引入 rete-engine 库，提供了节点执行的功能
import {
  ContextMenuExtra,
  ContextMenuPlugin,
  Presets as ContextMenuPresets
} from "rete-context-menu-plugin"; // 引入 rete-context-menu-plugin 库，提供了右键菜单的功能

const socket = new ClassicPreset.Socket("socket"); // 使用 ClassicPreset.Socket 创建一个输入/输出端口

class Start extends ClassicPreset.Node<{}, { exec: ClassicPreset.Socket }, {}> { // 创建一个继承了 ClassicPreset.Node 的 Start 节点类
  width = 180; // 节点的宽度
  height = 90; // 节点的高度

  constructor() {
    super("Start"); // 调用父类的构造函数，传入节点的名称
    this.addOutput("exec", new ClassicPreset.Output(socket, "Exec")); // 添加一个输出端口
  }

  execute(_: never, forward: (output: "exec") => void) { // 节点执行的函数
    forward("exec");
  }

  data() {
    return {};
  }
}

// 继承自 ClassicPreset.Node，设置泛型参数
class Log extends ClassicPreset.Node<
    { exec: ClassicPreset.Socket; message: ClassicPreset.Socket }, // 输入的端口类型
    { exec: ClassicPreset.Socket }, // 输出的端口类型
    {} // 数据类型
> {
  width = 180; // 组件的默认宽度
  height = 150; // 组件的默认高度

  // 接收两个参数：log 和 dataflow
  constructor(
      private log: (text: string) => void, // 记录日志的函数
      private dataflow: DataflowEngine<Schemes> // 数据流引擎实例
  ) {
    super("Log");// 调用父类的构造函数
// 创建两个输入端口和一个输出端口
    this.addInput("exec", new ClassicPreset.Input(socket, "Exec", true));
    this.addInput("message", new ClassicPreset.Input(socket, "Text"));
    this.addOutput("exec", new ClassicPreset.Output(socket, "Exec"));
  }
  // 执行函数，参数为输入端口的标识符和输出函数
  async execute(input: "exec", forward: (output: "exec") => void) {
    // 获取节点的输入数据
    const inputs = (await this.dataflow.fetchInputs(this.id)) as {
      message: string[];
    };
// 记录日志
    this.log((inputs.message && inputs.message[0]) || "");
// 执行输出端口的数据流
    forward("exec");
  }
  // 返回节点的数据对象
  data() {
    return {};
  }
}
// 继承自 ClassicPreset.Node，设置泛型参数
class TextNode extends ClassicPreset.Node<
    {},// 输入的端口类型
    { value: ClassicPreset.Socket }, // 输出的端口类型
    { value: ClassicPreset.InputControl<"text"> }// 数据类型
> {
  height = 120; // 组件的默认高度
  width = 180; // 组件的默认宽度
  // 接收一个参数：initial，作为文本框的初始内容
  constructor(initial: string) {
    super("Text"); // 调用父类的构造函数
    this.addControl(
        "value",
        new ClassicPreset.InputControl("text", { initial })
    );
    this.addOutput("value", new ClassicPreset.Output(socket, "Number"));
  }
  // 执行函数，不接受任何参数
  execute() {}
// 返回节点的数据对象
  data(): { value: string } {
    return {
      value: this.controls.value.value || ""
    };
  }
}
// 继承自 ClassicPreset.Connection，用于建立节点之间的连接
class Connection<
    A extends NodeProps, // 起点节点的属性类型
    B extends NodeProps// 终点节点的属性类型
> extends ClassicPreset.Connection<A, B> {
  isLoop?: boolean;// 是否形成闭环
}

type NodeProps = Start | Log | TextNode; // 定义节点类型的联合类型
type ConnProps = Connection<Start, Log> | Connection<TextNode, Log>; // 定义连接类型的联合类型

type Schemes = GetSchemes<NodeProps, ConnProps>; // 将节点类型和连接类型传入 GetSchemes 泛型，生成该编辑器的 Schema 类型

type AreaExtra = ReactArea2D<any> | ContextMenuExtra<Schemes>; // 定义节点区域额外属性的类型
export async function createEditor(
    container: HTMLElement, // 容器元素
    log: (text: string) => void // 回调函数，用于输出日志信息
) {
  // 创建一个 NodeEditor 实例
  const editor = new NodeEditor<Schemes>();
  // 创建一个 AreaPlugin 实例，设置容器元素
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  // 创建一个 ConnectionPlugin 实例
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  // 创建一个 ReactRenderPlugin 实例
  const render = new ReactRenderPlugin<Schemes>({ createRoot });
  // 创建一个 AutoArrangePlugin 实例
  const arrange = new AutoArrangePlugin<Schemes>();
  // 创建一个 DataflowEngine 实例，用于处理节点之间的数据流
  const dataflow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      // 过滤掉输入和输出中的 "exec" 字段
      inputs: Object.keys(inputs).filter((name) => name !== "exec"),
      outputs: Object.keys(outputs).filter((name) => name !== "exec")
    };
  });
  // 创建一个 ControlFlowEngine 实例，用于处理节点之间的控制流
  const engine = new ControlFlowEngine<Schemes>(() => {
    return {
      inputs: ["exec"],
      outputs: ["exec"]
    };
  });
  // 创建一个 ContextMenuPlugin 实例，用于右键菜单
  const contextMenu = new ContextMenuPlugin<Schemes, AreaExtra>({
    items: ContextMenuPresets.classic.setup([
      ["Start", () => new Start()],
      ["Log", () => new Log(log, dataflow)],
      ["Text", () => new TextNode("")]
    ])
  });
  // 在 AreaPlugin 中使用 ContextMenuPlugin
  area.use(contextMenu);

  // 在 AreaPlugin 中使用 selectableNodes 扩展，允许选中多个节点
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });

  // 在 ReactRenderPlugin 中添加预设，以支持右键菜单
  render.addPreset(Presets.contextMenu.setup());
  // 在 ReactRenderPlugin 中添加预设，以支持基本的节点绘制、移动等操作
  render.addPreset(Presets.classic.setup({ area }));

  // 将各个插件添加到 NodeEditor 实例中
  editor.use(engine);
  editor.use(dataflow);
  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(arrange);

  // 在 AreaPlugin 中使用 simpleNodesOrder 扩展，允许节点按添加顺序排列
  AreaExtensions.simpleNodesOrder(area);
  // 在 AreaPlugin 中使用 showInputControl 扩展，显示节点输入控制
  AreaExtensions.showInputControl(area);

  // 创建一些节点，并添加到编辑器中
  const start = new Start();
  const text1 = new TextNode("log");
  const log1 = new Log(log, dataflow);
  await editor.addNode(start);
  await editor.addNode(text1);
  await editor.addNode(log1);

  // 创建一些连接，并添加到编辑器中
  const con1 = new Connection(start, "exec", log1, "exec");
  const con2 = new Connection(text1, "value", log1, "message");
  await editor.addConnection(con1);
  await editor.addConnection(con2);

  // 每隔一秒钟执行一次流程图，以模拟节点之间的数据交互
  setInterval(() => {
    dataflow.reset();
    engine.execute(start.id);
  }, 1000);

  // 对节点进行自动排列，并调整显示比例
  await arrange.layout();
  AreaExtensions.zoomAt(area, editor.getNodes());

  // 返回一个函数，用于销毁编辑器
  return () => area.destroy();
}