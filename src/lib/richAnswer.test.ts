// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { htmlToMarkdown, htmlToPlainText, plainToHtml, sanitizeAnswerHtml } from './richAnswer';

const html =
  '<div>Pressure is caused by <b>collisions</b> with the <i>walls</i>.</div>' +
  '<ul><li>Particles move <u>randomly</u></li><li>Higher temperature</li></ul>' +
  '<ol><li>First</li><li>Second</li></ol><div>Done<br>here</div>';

describe('rich answers', () => {
  it('converts to plain text for AI export, keeping list structure', () => {
    expect(htmlToPlainText(html)).toBe(
      'Pressure is caused by collisions with the walls.\n- Particles move randomly\n- Higher temperature\n1. First\n2. Second\nDone\nhere',
    );
  });
  it('converts to Markdown', () => {
    expect(htmlToMarkdown(html)).toBe(
      'Pressure is caused by **collisions** with the *walls*.\n- Particles move <u>randomly</u>\n- Higher temperature\n1. First\n2. Second\nDone\nhere',
    );
  });
  it('strips anything but basic formatting', () => {
    expect(sanitizeAnswerHtml('<b style="color:red" onclick="x()">a</b><script>1</script><span>b</span>')).toBe('<b>a</b>b');
  });
  it('round-trips old plain answers', () => {
    expect(htmlToPlainText(plainToHtml('a < b\nnext'))).toBe('a < b\nnext');
  });
});

describe('browser-shaped HTML', () => {
  it('does not add blank lines between text and a following list', () => {
    expect(htmlToPlainText('Intro.<div><ul><li>One</li><li><u>Two</u> more</li></ul></div>')).toBe('Intro.\n- One\n- Two more');
  });
});
