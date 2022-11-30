import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import waitForError from 'vault/tests/helpers/wait-for-error';

module('Integration | Component | wrap ttl', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.lastOnChangeCall = null;
    this.set('onChange', (val) => {
      this.lastOnChangeCall = val;
    });
  });

  test('it requires `onChange`', async function (assert) {
    const promise = waitForError();
    render(hbs`{{wrap-ttl}}`);
    const err = await promise;
    assert.ok(err.message.includes('`onChange` handler is a required attr in'), 'asserts without onChange');
  });

  test('it renders', async function (assert) {
    await render(hbs`{{wrap-ttl onChange=(action this.onChange)}}`);
    assert.strictEqual(this.lastOnChangeCall, '30m', 'calls onChange with 30m default on first render');
    assert.dom('label[for="toggle-Wrapresponse"] .ttl-picker-label').hasText('Wrap response');
  });

  test('it nulls out value when you uncheck wrapResponse', async function (assert) {
    await render(hbs`{{wrap-ttl onChange=(action this.onChange)}}`);
    await click('[data-test-toggle-label="Wrap response"]');
    assert.strictEqual(this.lastOnChangeCall, null, 'calls onChange with null');
  });

  test('it sends value changes to onChange handler', async function (assert) {
    await render(hbs`{{wrap-ttl onChange=(action this.onChange)}}`);
    // for testing purposes we need to input unit first because it keeps seconds value
    await fillIn('[data-test-select="ttl-unit"]', 'h');
    assert.strictEqual(this.lastOnChangeCall, '1800s', 'calls onChange correctly on time input');
    await fillIn('[data-test-ttl-value="Wrap response"]', '20');
    assert.strictEqual(this.lastOnChangeCall, '72000s', 'calls onChange correctly on unit change');
  });
});
