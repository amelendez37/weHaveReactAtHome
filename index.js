/** @jsx createElement */
function createElement(type, props, children) {
  if (props === null) props = {};
  console.log("createElement: ", { type, props, children });
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
  } else if (key === "ref") {
    key.current = dom;
  } else if (key === "key") {
    dom.__key = value;
  } else if (typeof value != "object" && typeof value != "function") {
    dom.setAttribute(key, value);
  }
}

function render(vdom, parent) {
  console.log("vdom: ", vdom);
  const mount = (el) => parent.appendChild(el);
  if (typeof vdom === "string" || typeof vdom === "number") {
    // mount strings and numbers to dom as string
    return mount(document.createTextNode(vdom));
  } else if (typeof vdom === "boolean" || vdom === null) {
    // mount booleans as empty string
    return mount(document.createTextNode(""));
  } else if (typeof vdom === "object" && typeof vdom.type === "function") {
    // jsx parser passes custom component object itself as vdom argument
    // Component handles the rendering in this case
    return Component.render(vdom, parent);
  } else if (typeof vdom === "object" && typeof vdom.type === "string") {
    // native jsx components mounted to dom as corresponding html elements
    const dom = mount(document.createElement(vdom.type), parent);
    for (const child of [].concat(vdom.children)) render(child, dom);
    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    return dom;
  } else {
    throw new Error("Invalid vdom: " + vdom);
  }
}

function patch(dom, vdom, parent = dom.parentNode) {
  const replace = (el) => parent.replaceChild(el, dom) && el;
  if (typeof vdom === "object" && vdom.type === "function") {
    // call Component patch for custom components
    return Component.patch(dom, vdom, parent);
  } else if (typeof vdom != "object" && dom instanceof Text) {
    // unmatching text content
    return dom.textContent != vdom ? replace(render(vdom, parent)) : dom;
  } else if (typeof vdom == "object" && dom instanceof Text) {
    // replace text with vdom
    return replace(render(vdom, parent));
  } else if (
    typeof vdom == "object" &&
    dom.nodeName != vdom.type.toUpperCase()
  ) {
    // replace unmatching dom node with vdom
    return replace(render(vdom, parent));
  } else if (typeof vdom == "object" && dom.nodeName == vdom.type.upperCase()) {
    // perform patch when vdom type matches current dom node
    const pool = {};
    const activeElement = document.activeElement;
    [...dom.childNodes].map((child, index) => {
      const key = child.__key || `index_${index}`;
      pool[key] = child;
    });
    [...vdom.children].map((child, index) => {
      const key = child.props.__key || `index_${index}`;
      pool[key] ? patch(pool[key], child) : render(child, parent);
      delete pool[key];
    });
    for (const key in pool) {
      const instance = pool[key].__instance;
      if (instance) instance.componentWillUnmount();
      pool[key].remove();
    }
    // remove all preexisting dom attributes and add potentially updated ones from vdom
    for (const attr of dom.attributes) dom.removeAttribute(attr.name);
    for (const prop of vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    activeElement.focus();
    return dom;
  }
}

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = null;
  }

  static render(vdom, parent) {
    const props = Object.assign({}, vdom.props);
    // class components
    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom.type(props);
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

  static patch(dom, vdom, parent = dom.parentNode) {
    // if dom is from vdom constructor
    if (dom.__instance && dom.__instance.constructor === vdom.type) {
      // assign props and patch
      const nextProps = Object.assign({}, vdom.props, vdom.children);
      this.willReceiveProps(props);
      this.props = nextProps;
      return patch(dom, vdom, parent);
    } else if (Component.isPrototypeOf(vdom)) {
      const newDom = Component.render(vdom, parent);
      return parent ? parent.replaceChild(newDom, dom) && dom : newDom;
    } else if (!Component.isPrototypeOf(vdom)) {
      return patch(dom, vdom.type(props), parent);
    }
  }

  setState(next) {
    const compatible = (nextState) =>
      typeof this.state == "object" && typeof nextState == "object";
    if (this.base && this.componentShouldUpdate()) {
      this.componentWillUpdate();
      this.state = compatible(next)
        ? Object.assign({}, this.state, next)
        : next;
      patch(this.base, this.render());
      this.componentDidUpdate();
    }
  }

  componentShouldUpdate() {
    return true;
  }

  componentWillMount() {
    return undefined;
  }

  componentDidMount() {
    return undefined;
  }

  componentWillUnmount() {
    return undefined;
  }

  componentWillReceiveProps(nextProps) {
    return undefined;
  }

  componentWillUpdate(nextProps, nextState) {
    return undefined;
  }

  componentDidUpdate(nextProps, nextState) {
    return undefined;
  }
}

class SimpleComponent extends Component() {
  render() {
    return (
      <div>
        <p>hello world 1</p>
        <p>hello world 2</p>
      </div>
    );
  }
}

render(<SimpleComponent />, document.getElementById("root"));
