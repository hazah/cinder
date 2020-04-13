/* jshint esversion: 7 */

function intializeModelComponent(modelName) {
  customElements.define(modelName, class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      let self = this;
      self.loadModel(`models/${modelName.substring(modelName.indexOf("-") + 1)}.html`).then(() => {
        self.loadTemplate("templates/application.html").then(() => {
          let directory = "templates/";
          
          return Promise.all(
            window.location.pathname.substring(1).split("/").map((part) => {
              let file;
              if (part == "") {
                file = "index.html";
              } else {
                file = `${part}.html`;
              }
              return self.loadTemplate(`${directory}${file}`);
            })
          );
        }).then(() => {
          this.attachShadow({ mode: "open" })
              .appendChild(this.yield.content.cloneNode(true));
        });
      });
    }

    templateProcessor(dom) {
      const body = dom.body;
      
      const template = document.createElement("template");
      while (body.firstChild) {
        template.content.appendChild(body.firstChild);
      }
      
      if (template.content.querySelector("slot")) {
        if (!this.layouts) {
          this.layouts = [];
        }
        this.layouts.push(template);
      } else {
        this.yield = template;
      }
    }
  
    loadTemplate(url) {
      return this.loadApplicationComponent(url, this.templateProcessor);
    }
    
    modelProcesor(dom) {
      const body = dom.body;
      
      const template = document.createElement("template");
      while (body.firstChild) {
        template.content.appendChild(body.firstChild);
      }
      this.model = template;
    }
  
    loadModel(url) {
      return this.loadApplicationComponent(url, this.modelProcesor);
    }

    getResponseHtmlContent(response) {
      return response.text();
    }
  
    getHtmlDOM(html) {
      const parser = new DOMParser();
      return parser.parseFromString(html, "text/html");
    }
  
    process(processor) {
      let self = this;
      return function (dom) {
        return processor.call(self, dom);
      };
    }
  
    loadApplicationComponent(url, processor) {
      return fetch(url)
        .then(this.getResponseHtmlContent)
        .then(this.getHtmlDOM)
        .then(this.process(processor));
    }

    hydrate(data) {
      let self = this;
      let model = new Promise((resolve, reject) => {
        setTimeout(function check() {
          if (self.model) {
            resolve(self.model)
          } else {
            setTimeout(check);
          }
        });
      });
      model.then((model) => {
        model.content.querySelectorAll("model-field").forEach((field) => {
          customElements.define(`${modelName.substring(modelName.indexOf("-") + 1)}-${field.getAttribute("slot")}`, class extends HTMLElement {
            constructor() {
              super();

              let slot = document.createElement("slot");
              slot.setAttribute("name", field.getAttribute("slot"));

              let template = document.createElement("template");
              template.content.appendChild(slot);
              this.attachShadow({ mode: "open" })
                .appendChild(template.content.cloneNode(true));

              let fieldElement = model.content.querySelector(`[slot='${field.getAttribute("slot")}']`).cloneNode(true);
              fieldElement.appendChild(document.createTextNode(data[field.getAttribute("slot")]));
              this.appendChild(fieldElement);
            }
          });
        });
      });
    }
  });
}

function notCoreComponent(name) {
  return name != "model-first";
}

document.querySelectorAll("*").forEach((element) => {
  if (element.localName.startsWith("model-")) {
    
    if (notCoreComponent(element.localName)) {
      intializeModelComponent(element.localName);

    } else {

    }
  }
});

customElements.define("app-model", class extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const layouts = this.parentNode.host.layouts.slice().reverse();
    layouts.forEach((layout) => {
      this.attachShadow({ mode: "open" })
          .appendChild(layout.content.cloneNode(true));
    });
  }
});

customElements.define("model-first", class extends HTMLElement {
  constructor() {
    super();
    // Faked, this is where the magic data needs to appear.
    this.modelData = {
      title: "Hello World!",
      content: "How are you today?"
    };
  }

  connectedCallback() {
    this.parentElement.hydrate(this.modelData);
  }
});
