/* eslint qunit/no-conditional-assertions: "warn" */
import {
  click,
  findAll,
  fillIn,
  settled,
  visit,
  triggerEvent,
  triggerKeyEvent,
  find,
  waitUntil,
} from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import authPage from 'vault/tests/pages/auth';
import logout from 'vault/tests/pages/logout';
import enablePage from 'vault/tests/pages/settings/auth/enable';
import { supportedAuthBackends } from 'vault/helpers/supported-auth-backends';
import { supportedManagedAuthBackends } from 'vault/helpers/supported-managed-auth-backends';

module('Acceptance | auth backend list', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    return authPage.login();
  });

  hooks.afterEach(function () {
    return logout.visit();
  });

  test('userpass secret backend', async function (assert) {
    let n = Math.random();
    const path1 = `userpass-${++n}`;
    const path2 = `userpass-${++n}`;
    const user1 = 'user1';
    const user2 = 'user2';

    // enable the first userpass method with one username
    await enablePage.enable('userpass', path1);
    await settled();
    await click('[data-test-save-config="true"]');

    await visit(`/vault/access/${path1}/item/user/create`);
    await waitUntil(() => find('[data-test-input="username"]') && find('[data-test-textarea]'));
    await fillIn('[data-test-input="username"]', user1);
    await triggerKeyEvent('[data-test-input="username"]', 'keyup', 65);
    await fillIn('[data-test-textarea]', user1);
    await triggerKeyEvent('[data-test-textarea]', 'keyup', 65);
    await click('[data-test-save-config="true"]');

    // enable the first userpass method with one username
    await visit(`/vault/settings/auth/enable`);

    await click('[data-test-mount-type="userpass"]');

    await click('[data-test-mount-next]');

    await fillIn('[data-test-input="path"]', path2);

    await click('[data-test-mount-submit="true"]');

    await click('[data-test-save-config="true"]');

    await click(`[data-test-auth-backend-link="${path2}"]`);

    await click('[data-test-entity-create-link="user"]');

    await fillIn('[data-test-input="username"]', user2);
    await triggerKeyEvent('[data-test-input="username"]', 'keyup', 65);
    await fillIn('[data-test-textarea]', user2);
    await triggerKeyEvent('[data-test-textarea]', 'keyup', 65);
    // test for modified helpText on generated token policies
    await click('[data-test-toggle-group="Tokens"]');
    const policyFormField = document.querySelector('[data-test-input="tokenPolicies"]');
    const tooltipTrigger = policyFormField.querySelector('[data-test-tool-tip-trigger]');
    await triggerEvent(tooltipTrigger, 'mouseenter');
    assert
      .dom('[data-test-info-tooltip-content]')
      .hasText(
        'Add policies that will apply to the generated token for this user. One policy per row.',
        'Overwritten tooltip text displays in token form field.'
      );

    await click('[data-test-save-config="true"]');

    //confirming that the user was created.  There was a bug where the apiPath was not being updated when toggling between auth routes
    assert
      .dom('[data-test-list-item-content]')
      .hasText(user2, 'user just created shows in current auth list');

    //confirm that the auth method 1 shows the user1.  There was a bug where it was not updated the list when toggling between auth routes
    await visit(`/vault/access/${path1}/item/user`);

    assert
      .dom('[data-test-list-item-content]')
      .hasText(user1, 'first user created shows in current auth list');
  });

  test('auth methods are linkable and link to correct view', async function (assert) {
    assert.expect(16);

    await visit('/vault/access');

    const supportManaged = supportedManagedAuthBackends();
    const backends = supportedAuthBackends();

    for (const backend of backends) {
      const { type } = backend;

      if (type !== 'token') {
        await enablePage.enable(type, type);
      }
      await settled();
      await visit('/vault/access');

      // all auth methods should be linkable
      await click(`[data-test-auth-backend-link="${type}"]`);

      if (!supportManaged.includes(type)) {
        assert.dom('[data-test-auth-section-tab]').exists({ count: 1 });
        assert
          .dom('[data-test-auth-section-tab]')
          .hasText('Configuration', `only shows configuration tab for ${type} auth method`);
        assert.dom('[data-test-doc-link] .doc-link').exists(`includes doc link for ${type} auth method`);
      } else {
        // managed auth methods should have more than 1 tab
        assert.notEqual(
          findAll('[data-test-auth-section-tab]').length,
          1,
          `has management tabs for ${type} auth method`
        );
      }
    }
  });
});
