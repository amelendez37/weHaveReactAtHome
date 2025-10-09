"use strict";

/** @jsx createElement */
function createElement(type, props, children) {
  if (props === null) props = {};
  return {
    type: type,
    props: props,
    children: children
  };
}
function render(vdom) {
  var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var node = document.createElement(vdom.type);
  if (typeof vdom.children === "string") {
    node.innerText = vdom.children;
  } else if (typeof vdom.children === "boolean") {
    node.children = null;
  }
  parent ? parent.appendChild(node) : document.append(node);
}
render(createElement("p", null, true), document.getElementById("root"));