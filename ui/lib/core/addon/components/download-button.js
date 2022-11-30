import Component from '@ember/component';
import { computed } from '@ember/object';
import hbs from 'htmlbars-inline-precompile';

export default Component.extend({
  layout: hbs`{{#if (has-block)}} {{yield}} {{else}} {{actionText}} {{/if}}`,
  tagName: 'a',
  role: 'button',
  attributeBindings: ['role', 'download', 'href'],
  download: computed('filename', 'extension', function () {
    return `${this.filename}-${new Date().toISOString()}.${this.extension}`;
  }),

  fileLike: computed('data', 'mime', 'stringify', 'download', function () {
    let file;
    let data = this.data;
    const filename = this.download;
    const mime = this.mime;
    if (this.stringify) {
      data = JSON.stringify(data, null, 2);
    }
    if (window.navigator.msSaveOrOpenBlob) {
      file = new Blob([data], { type: mime });
      file.name = filename;
    } else {
      file = new File([data], filename, { type: mime });
    }
    return file;
  }),

  href: computed('fileLike', function () {
    return window.URL.createObjectURL(this.fileLike);
  }),

  click(event) {
    if (!window.navigator.msSaveOrOpenBlob) {
      return;
    }
    event.preventDefault();
    const file = this.fileLike;
    //lol whyyyy
    window.navigator.msSaveOrOpenBlob(file, file.name);
  },

  actionText: 'Download',
  data: null,
  filename: null,
  mime: 'text/plain',
  extension: 'txt',
  stringify: false,
});
