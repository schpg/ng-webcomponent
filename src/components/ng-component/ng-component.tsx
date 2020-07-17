import {Component, EventEmitter, Event, h, Prop, Listen} from '@stencil/core';

@Component({
  tag: 'ng-component'
})
export class NgComponent {

  @Prop() url: string;
  @Event() ngMessage: EventEmitter;
  @Event() loadingError: EventEmitter;

  private static getFilename(absolute: string) {
    if (!absolute || typeof absolute !== 'string') {
      return absolute;
    }
    let indexLastSlash = absolute.lastIndexOf('/');
    return absolute.substring(indexLastSlash !== -1 ? indexLastSlash : 0);
  }

  private loadScriptsByIndex() : Promise<HTMLCollectionOf<HTMLScriptElement>> {
    return new Promise((resolve, reject) => {
      if (!this.url) {
        reject('invalid url');
        return;
      }
      let address = !this.url.endsWith('/index.html') ? this.url + '/index.html' : this.url;
      fetch(address).then((response) => response.text()).then((html) => {
        let index = document.createElement('html');
        index.innerHTML = html;
        resolve(index.getElementsByTagName('script'));
      })
    });
  }

  private attachAngularBootstrapScripts() {
    return this.loadScriptsByIndex().then((scriptElements) => {
      let scriptArray = Array.from(scriptElements).map((element) => {
        return new Promise((resolve) => {
          let scriptElement = document.createElement('script');
          scriptElement.src = this.url + NgComponent.getFilename(element.src);
          scriptElement.onload = resolve;
          scriptElement.noModule = element.noModule;
          document.head.appendChild(scriptElement);
        })
      });
      return Promise.all(scriptArray);
    });
  }

  private static attachAngularAnker() {
    let angularDiv = document.getElementById('angularDiv');
    angularDiv.innerHTML = '<app-root></app-root>';
  }

  private attachZoneScript() {
    return new Promise((resolve) => {
      let scriptElement = document.createElement('script');
      scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/zone.js/0.10.3/zone.min.js';
      scriptElement.onload = resolve;
      document.head.appendChild(scriptElement);
    });
  }

  private initAngularApp() {
    NgComponent.attachAngularAnker();
    this.attachZoneScript().then(this.attachAngularBootstrapScripts.bind(this)).catch((error) => {
      this.loadingError.emit(error);
    });
  }

  componentDidLoad() {
    this.initAngularApp();
  }

  componentDidUpdate() {
    this.initAngularApp();
  }

  @Listen('messageToNg')
  messageToNg(data) {
    if (!window['ngHostMessageHandler']) {
      return;
    }
    window['ngHostMessageHandler'](data);
  }

  render() {
    return (
      <div id="angularDiv" />
    );
  }

}
