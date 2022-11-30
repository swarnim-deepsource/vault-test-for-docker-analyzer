/* eslint qunit/no-conditional-assertions: "warn" */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

const ARRAY_OF_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear(); // integer of year
const CURRENT_MONTH = CURRENT_DATE.getMonth(); // index of month

module('Integration | Component | date-dropdown', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders dropdown', async function (assert) {
    this.set('text', 'Save');

    await render(hbs`
      <div class="is-flex-align-baseline">
        <DateDropdown/>
      </div>
    `);
    assert.dom('[data-test-date-dropdown-submit]').hasText('Submit', 'button renders default text');
    await render(hbs`
      <div class="is-flex-align-baseline">
        <DateDropdown @submitText={{this.text}}/>
      </div>
    `);
    assert.dom('[data-test-date-dropdown-submit]').hasText('Save', 'button renders passed in text');
  });

  test('it renders dropdown and selects month and year', async function (assert) {
    assert.expect(27);
    const parentAction = (month, year) => {
      assert.strictEqual(month, 'January', 'sends correct month to parent callback');
      assert.strictEqual(year, CURRENT_YEAR, 'sends correct year to parent callback');
    };
    this.set('parentAction', parentAction);

    await render(hbs`
      <div class="is-flex-align-baseline">
      <DateDropdown 
        @handleDateSelection={{this.parentAction}} />
      </div>
    `);

    const monthDropdown = this.element.querySelector('[data-test-popup-menu-trigger="month"]');
    const yearDropdown = this.element.querySelector('[data-test-popup-menu-trigger="year"]');
    const submitButton = this.element.querySelector('[data-test-date-dropdown-submit]');

    assert.true(submitButton.disabled, 'button is disabled when no month or year selected');

    await click(monthDropdown);
    const dropdownListMonths = this.element.querySelectorAll('[data-test-month-list] button');
    assert.strictEqual(dropdownListMonths.length, 12, 'dropdown has 12 months');
    for (const [index, month] of ARRAY_OF_MONTHS.entries()) {
      assert.dom(dropdownListMonths[index]).hasText(`${month}`, `dropdown includes ${month}`);
    }

    await click(dropdownListMonths[0]);
    assert.dom(monthDropdown).hasText('January', 'dropdown selects January');
    assert.dom('.ember-basic-dropdown-content').doesNotExist('dropdown closes after selecting month');

    await click(yearDropdown);
    const dropdownListYears = this.element.querySelectorAll('[data-test-year-list] button');
    assert.strictEqual(dropdownListYears.length, 5, 'dropdown has 5 years');

    for (const [index, year] of dropdownListYears.entries()) {
      const comparisonYear = CURRENT_YEAR - index;
      assert.dom(year).hasText(`${comparisonYear}`, `dropdown includes ${comparisonYear}`);
    }

    await click(dropdownListYears[0]);
    assert.dom(yearDropdown).hasText(`${CURRENT_YEAR}`, `dropdown selects ${CURRENT_YEAR}`);
    assert.dom('.ember-basic-dropdown-content').doesNotExist('dropdown closes after selecting year');
    assert.false(submitButton.disabled, 'button enabled when month and year selected');

    await click(submitButton);
  });

  test('it disables correct years when selecting month first', async function (assert) {
    assert.expect(60);
    await render(hbs`
    <div class="is-flex-align-baseline">
      <DateDropdown/>
    </div>
    `);

    const monthDropdown = this.element.querySelector('[data-test-popup-menu-trigger="month"]');
    const yearDropdown = this.element.querySelector('[data-test-popup-menu-trigger="year"]');

    for (let i = 0; i < 12; i++) {
      await click(monthDropdown);
      const dropdownListMonths = this.element.querySelectorAll('[data-test-month-list] button');
      await click(dropdownListMonths[i]);

      await click(yearDropdown);
      const dropdownListYears = this.element.querySelectorAll('[data-test-year-list] button');

      if (i < CURRENT_MONTH) {
        for (const year of dropdownListYears) {
          assert.false(year.disabled, `${ARRAY_OF_MONTHS[i]} ${year.innerText} valid`);
        }
      } else {
        for (const [yearIndex, year] of dropdownListYears.entries()) {
          if (yearIndex === 0) {
            assert.true(year.disabled, `${ARRAY_OF_MONTHS[i]} ${year.innerText} disabled`);
          } else {
            assert.false(year.disabled, `${ARRAY_OF_MONTHS[i]} ${year.innerText} valid`);
          }
        }
      }
      await click(yearDropdown);
    }
  });

  test('it disables correct months when selecting year first', async function (assert) {
    assert.expect(60);
    await render(hbs`
    <div class="is-flex-align-baseline">
      <DateDropdown/>
    </div>
    `);

    const monthDropdown = this.element.querySelector('[data-test-popup-menu-trigger="month"]');
    const yearDropdown = this.element.querySelector('[data-test-popup-menu-trigger="year"]');

    for (let i = 0; i < 5; i++) {
      await click(yearDropdown);
      const dropdownListYears = this.element.querySelectorAll('[data-test-year-list] button');
      await click(dropdownListYears[i]);

      await click(monthDropdown);
      const dropdownListMonths = this.element.querySelectorAll('[data-test-month-list] button');

      if (i === 0) {
        for (const [monthIndex, month] of dropdownListMonths.entries()) {
          if (monthIndex < CURRENT_MONTH) {
            assert.false(
              month.disabled,
              `${ARRAY_OF_MONTHS[monthIndex]} ${dropdownListYears[i].innerText.trim()} valid`
            );
          } else {
            assert.true(
              month.disabled,
              `${ARRAY_OF_MONTHS[monthIndex]} ${dropdownListYears[i].innerText.trim()} disabled`
            );
          }
        }
      } else {
        for (const [monthIndex, month] of dropdownListMonths.entries()) {
          assert.false(
            month.disabled,
            `${ARRAY_OF_MONTHS[monthIndex]} ${dropdownListYears[i].innerText.trim()} valid`
          );
        }
      }
      await click(monthDropdown);
    }
  });
});
