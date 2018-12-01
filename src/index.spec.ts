import * as Decode from '.';

describe('array', () => {
  let mockItemDecoder: Decode.Decoder<'a'>;
  let decoder: Decode.Decoder<Array<any>>;

  beforeEach(() => {
    mockItemDecoder = jest.fn().mockReturnValue('a');
    let decoder = Decode.array(mockItemDecoder);
  });

  it('should decode an array using given item decoder', () => {
    const given = [1, 2, 3];

    const result = decoder(given);
    expect(mockItemDecoder).toHaveBeenNthCalledWith(1, 1, 0, given);
    expect(result).toEqual(['a', 'a', 'a']);
  });

  it('should throw an error if raw is not an array', () => {
    const given = 'invalid';
    const expected = `Array Decoder: Expected raw value to be an array but got: ${given}.`;
    expect(() => decoder(given)).toThrow(expected);
  });
});

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

  it('should throw an error if raw is not a boolean', () => {
    const given = 999;
    const expected = `Boolean Decoder: Expected raw value to be a boolean but got: ${given}.`;
    expect(() => Decode.boolean(given)).toThrow(expected);
  });
});

describe('date', () => {
  it('should decode iso date strings to Dates', () => {
    const dates = ['2018-02-15'];
    const times = [' 00:00:00', 'T00:00:00'];
    const suffixes = ['', 'Z'];

    const expected = new Date(2018, 1, 15);

    for(const date of dates) {
      for(const time of times) {
        for(const suffix of suffixes) {
          const dateStr = `${date}${time}${suffix}`;
          const result = Decode.date(dateStr);
          expect(result).toEqual(expected);
        }
      }
    }
  });

  it('should throw an error if raw is not an ISO date str', () => {
    [999, 'xxxx', '20180911', '2018-0911', '2018-09-111'].forEach(invalid => {
      const expected = `Date Decoder: Expected raw value to be an ISO date string but got: ${invalid}.`;
      expect(() => Decode.date(invalid)).toThrow(expected);
    });
  });
});

describe('literalOf', () => {
  it('should decode a literal to itself', () => {
    [1, true, false, 'value'].forEach(literal => {
      const decoder = Decode.literalOf(literal);
      const result = decoder(literal);
      expect(result).toStrictEqual(literal);
    });
  });

  it('should throw an error if raw is not the literal', () => {
    const decoder = Decode.literalOf('1');
    const invalid = 1;
    const expected = `Literal Decoder: Expected raw value to be string:1 but got: number:${invalid}.`;
    expect(() => decoder(invalid)).toThrow(expected);
  });
});

describe('number', () => {
  it('should decode numbers', () => {
    [1, 2, 3, '1', '2', '3'].forEach(raw => {
      const result = Decode.number(raw);
      expect(result).toStrictEqual(Number(raw));
    });
  });

  it('should throw an error if raw is not numeric', () => {
    ['a', true, new Date(), {}, null, undefined].forEach(invalid => {
      const expected = `Number Decoder: Expected raw value to be a number but got: ${invalid}`;
      expect(() => Decode.number(invalid)).toThrow(expected);
    });
  });
});

describe('object', () => {
  it('should decode objects with property type decoders', () => {
    const numberDecoderSpy: typeof Decode.number = jest.fn(Decode.number);
    const stringDecoderSpy: typeof Decode.string = jest.fn(Decode.string);

    const raw = {
      AAA: '999',
      BBB: 'some string'
    };

    const decoder = Decode.object({
      aaa: ['AAA', numberDecoderSpy],
      bbb: ['BBB', stringDecoderSpy]
    });

    const result: {
      aaa: number,
      bbb: string
    } = decoder(raw);

    expect(result).toEqual({
      aaa: 999,
      bbb: 'some string'
    });

    expect(numberDecoderSpy).toHaveBeenCalledWith(raw.AAA);
    expect(stringDecoderSpy).toHaveBeenCalledWith(raw.BBB);
  });
});