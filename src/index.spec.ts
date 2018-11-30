import * as Decode from ".";

describe('boolean', () => {
  it('should decode truthy values to true', () => {
    [true, 'true', 1, '1'].forEach(raw => {
      expect(Decode.boolean(raw)).toStrictEqual(true);
    });
  });

  it('should decode non-truthy values to false', () => {
    [false, undefined, null, 0, '0'].forEach(raw => {
      expect(Decode.boolean(raw)).toStrictEqual(false);
    });
  });
});

describe('literalOf', () => {
  it('blah', () => {
    const x = Decode.literalOf('test')
  });
});