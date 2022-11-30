import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

module('Integration | Component | ttl picker', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.changeSpy = sinon.spy();
    this.set('onChange', this.changeSpy);
  });

  test('it renders error on non-number input', async function (assert) {
    await render(hbs`<TtlPicker @onChange={{this.onChange}} />`);

    const callCount = this.changeSpy.callCount;
    await fillIn('[data-test-ttl-value]', 'foo');
    assert.strictEqual(this.changeSpy.callCount, callCount, "it didn't call onChange again");
    assert.dom('[data-test-ttl-error]').includesText('Error', 'renders the error box');
    await fillIn('[data-test-ttl-value]', '33');
    assert.dom('[data-test-ttl-error]').doesNotExist('removes the error box');
  });

  test('it shows 30s for invalid duration initialValue input', async function (assert) {
    await render(hbs`<TtlPicker @onChange={{this.onChange}} @initialValue="invalid" />`);
    assert.dom('[data-test-ttl-value]').hasValue('30', 'sets 30 as the default');
  });
});
