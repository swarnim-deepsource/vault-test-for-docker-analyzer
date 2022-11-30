import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { format, formatRFC3339, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import {
  ARRAY_OF_MONTHS,
  parseAPITimestamp,
  parseRFC3339,
  formatChartDate,
} from 'core/utils/date-formatters';

module('Integration | Util | date formatters utils', function (hooks) {
  setupTest(hooks);

  const DATE = new Date();
  const API_TIMESTAMP = formatRFC3339(DATE).split('T')[0].concat('T00:00:00Z');
  const UNIX_TIME = DATE.getTime();

  test('parseAPITimestamp: parses API timestamp string irrespective of timezone', async function (assert) {
    assert.expect(6);
    assert.strictEqual(parseAPITimestamp(UNIX_TIME), undefined, 'it returns if timestamp is not a string');

    const parsedTimestamp = parseAPITimestamp(API_TIMESTAMP);

    assert.true(parsedTimestamp instanceof Date, 'parsed timestamp is a date object');
    assert.true(isSameYear(parsedTimestamp, DATE), 'parsed timestamp is correct year');
    assert.true(isSameMonth(parsedTimestamp, DATE), 'parsed timestamp is correct month');
    assert.true(isSameDay(parsedTimestamp, DATE), 'parsed timestamp is correct day');

    const formattedTimestamp = parseAPITimestamp(API_TIMESTAMP, 'MM yyyy');
    assert.strictEqual(formattedTimestamp, format(DATE, 'MM yyyy'), 'it formats the date');
  });

  test('parseRFC3339: convert timestamp to array for widget', async function (assert) {
    assert.expect(4);
    const arrayArg = ['2021', 2];
    assert.strictEqual(parseRFC3339(arrayArg), arrayArg, 'it returns arg if already an array');
    assert.strictEqual(
      parseRFC3339(UNIX_TIME),
      null,
      'it returns null parsing a timestamp of the wrong format'
    );

    const parsedTimestamp = parseRFC3339(API_TIMESTAMP);
    assert.strictEqual(parsedTimestamp[0], format(DATE, 'yyyy'), 'first element is a string of the year');
    assert.strictEqual(
      ARRAY_OF_MONTHS[parsedTimestamp[1]],
      format(DATE, 'MMMM'),
      'second element is an integer of the month'
    );
  });

  test('formatChartDate: expand chart date to full month and year', async function (assert) {
    assert.expect(1);
    const chartDate = '03/21';
    assert.strictEqual(formatChartDate(chartDate), 'March 2021', 'it re-formats the date');
  });
});
