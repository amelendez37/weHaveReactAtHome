/** @jsx createElement */
function createElement(type, props, children) {
  if (props === null) props = {};
  return { type, props, children };
}

function setAttribute(dom, key, value) {
  if (typeof value === "function" && key.startsWith("on")) {
    const eventType = value.slice(2).toLowerCase();
    dom.__handlers = dom.__handlers || {};
    dom.removeEventListener(eventType, value);
    dom.__handlers[eventType] = value;
    dom.addEventListener(eventType, value);
  } else if (key === "checked" || key === "value" || key === "className") {
    dom[key] = value;
  } else if (key === "style" && typeof value === "object") {
    Object.assign(dom.style, value);
  }
}

function render(vdom, parent) {
  const mount = (el) => parent.appendChild(el);
  if (typeof vdom === "string" || typeof vdom === "number") {
    return mount(document.createTextNode(vdom.children));
  } else if (typeof vdom === "boolean" || vdom === null) {
    return mount(document.createTextNode(""));
  } else if (typeof vdom === "object" && typeof vdom.type === "function") {
    // jsx parser passes custom component object itself as vdom argument
    // Component handles the rendering in this case
    Component.render(vdom, parent);
  } else if (typeof vdom === "object" && typeof vdom.type === "string") {
    const dom = mount(document.createElement(vdom.type), parent);
    for (const child of [...vdom.children]) render(child, dom);
    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    return dom;
  } else {
    throw new Error("Invalid vdom: " + vdom);
  }
}

function patch() {}

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = null;
  }

  render(vdom, parent) {
    const props = Object.assign({}, vdom.props);
    // class components
    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom(props);
      instance.componentWillMount();
      instance.base = render(instance.render(), parent);
      instance.__instance = instance;
      instance.__key = props.key;
      instance.componentDidMount();
      return instance.base;
    } else {
      // functional components
      return render(vdom.type(props), parent);
    }
  }

  setState() {}

  componentWillMount() {}

  componentDidMount() {}
}

render(<p>{true}</p>, document.getElementById("root"));
