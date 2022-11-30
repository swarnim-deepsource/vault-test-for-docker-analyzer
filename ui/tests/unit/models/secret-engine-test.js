import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | secret-engine', function (hooks) {
  setupTest(hooks);

  test('modelTypeForKV is secret by default', function (assert) {
    assert.expect(1);
    let model;
    run(() => {
      model = run(() => this.owner.lookup('service:store').createRecord('secret-engine'));
      assert.strictEqual(model.get('modelTypeForKV'), 'secret');
    });
  });

  test('modelTypeForKV is secret-v2 for kv v2', function (assert) {
    assert.expect(1);
    let model;
    run(() => {
      model = run(() =>
        this.owner.lookup('service:store').createRecord('secret-engine', {
          version: 2,
          type: 'kv',
        })
      );
      assert.strictEqual(model.get('modelTypeForKV'), 'secret-v2');
    });
  });

  test('modelTypeForKV is secret-v2 for generic v2', function (assert) {
    assert.expect(1);
    let model;
    run(() => {
      model = run(() =>
        this.owner.lookup('service:store').createRecord('secret-engine', {
          version: 2,
          type: 'kv',
        })
      );
      assert.strictEqual(model.get('modelTypeForKV'), 'secret-v2');
    });
  });
});
