import * as Decode from '.';

const DecodeBase = Decode;

describe('Decode', () => {
  const errorTracker = jest.fn();

  beforeEach(() => {
    errorTracker.mockClear();
  });

  [false, true].forEach((customConfig) => {
    const Decode = customConfig
      ? DecodeBase.config({
        errorCallback: error => {
          errorTracker(error.message);
          throw error;
        }
      })
      : DecodeBase;

    describe('array', () => {
      const mockItemDecoder = jest.fn<'a'>().mockReturnValue('a');
      const decode = Decode.array(mockItemDecoder);
      const decodeWithDefault = Decode.array(mockItemDecoder, undefined);

      beforeEach(() => {
        mockItemDecoder.mockClear();
      });

      it('should decode an array using given item decoder', () => {
        const given = [1, 2, 3];
        const result = decode(given);

        expect(mockItemDecoder).toHaveBeenNthCalledWith(1, 1);
        expect(result).toEqual(['a', 'a', 'a']);
      });

      it('should decode an array using given item decoder', () => {
        const given = [1, 2, 3];
        const result = decodeWithDefault(given);

        expect(mockItemDecoder).toHaveBeenNthCalledWith(1, 1);
        expect(result).toEqual(['a', 'a', 'a']);
      });

      it('should throw an error if raw is not an array', () => {
        const given = 'invalid';
        const expected = `Array Decoder: Expected raw value to be an array but got: ${given}.`;
        expect(() => decode(given)).toThrow(expected);
        if(customConfig) {
          expect(errorTracker).toHaveBeenCalledWith(expected);
        }
      });

      it('should throw an error if item decoder throws an error', () => {
        const decoder = Decode.array(Decode.number());
        const given = ['b'];
        const expected = `Array Decoder: Item '0' failed with: \"Error: Number Decoder: Expected raw value to be a number but got: ${given[0]}.\"`;
        expect(() => decoder(given)).toThrow(expected);
        if(customConfig) {
          expect(errorTracker).toHaveBeenCalledWith(expected);
        }
      });

      it('should return given default value if raw is not an array', () => {
        const given = 'invalid';
        const result = decodeWithDefault(given);
        expect(result).toBeUndefined();
      });
    });

    describe('boolean', () => {
      const decode = Decode.boolean();
      const decodeWithDefault = Decode.boolean(undefined);

      [decode, decodeWithDefault].forEach(decoder => {
        it('should decode truthy values to true', () => {
          [true, 'true', 1, '1'].forEach(raw => {
            expect(decoder(raw)).toStrictEqual(true);
          });
        });

        it('should decode non-truthy values to false', () => {
          [false, undefined, null, 0, '0'].forEach(raw => {
            expect(decoder(raw)).toStrictEqual(false);
          });
        });
      });

      it('should throw an error if raw is not a boolean', () => {
        const given = 999;
        const expected = `Boolean Decoder: Expected raw value to be a boolean but got: ${given}.`;
        expect(() => decode(given)).toThrow(expected);
        if(customConfig) {
          expect(errorTracker).toHaveBeenCalledWith(expected);
        }
      });

      it('should return given default if raw is not a boolean', () => {
        const given = 999;
        const result = decodeWithDefault(given);
        expect(result).toBeUndefined();
      });
    });

    describe('date', () => {
      const decoder: Decode.Decoder<Date> = Decode.date();
      const decoderWithDefault: Decode.Decoder<Date | undefined> = Decode.date(undefined);

      [decoder, decoderWithDefault].forEach(decode => {
        it('should decode iso date strings to Dates', () => {
          const dates = ['2018-02-15'];
          const times = [' 00:00:00', 'T00:00:00'];
          const suffixes = ['', 'Z', '.123', '.123Z'];

          for (const date of dates) {
            for (const time of times) {
              for (const suffix of suffixes) {
                const dateStr = `${date}${time}${suffix}`;
                const expected = new Date(dateStr);
                const result = decode(dateStr);
                expect(result).toEqual(expected);
              }
            }
          }
        });
      });

      it('should throw an error if raw is not an ISO date str', () => {
        [999, 'xxxx', '20180911', '2018-0911', '2018-09-111'].forEach(invalid => {
          const expected = `Date Decoder: Expected raw value to be an ISO date string but got: ${invalid}.`;
          expect(() => decoder(invalid)).toThrow(expected);
          if(customConfig) {
            expect(errorTracker).toHaveBeenCalledWith(expected);
          }
        });
      });

      it('return given default if raw is not an ISO date str', () => {
        [999, 'xxxx', '20180911', '2018-0911', '2018-09-111'].forEach(invalid => {
          const result = decoderWithDefault(invalid);
          expect(result).toBeUndefined();
        });
      });
    });

    describe('literalOf', () => {
      it('should decode a literal to itself', () => {
        [1, true, false, 'value'].forEach(literal => {
          const decoder = Decode.literalOf(literal);
          const decoderWithDefault = Decode.literalOf(literal, undefined);

          const result = decoder(literal);
          const resultWithDefault = decoderWithDefault(literal);

          expect(result).toStrictEqual(literal);
          expect(resultWithDefault).toStrictEqual(literal);
        });
      });

      it('should throw an error if raw is not the literal', () => {
        const decoder = Decode.literalOf('1');
        const invalid = 1;
        const expected = `Literal Decoder: Expected raw value to be string:1 but got: number:${invalid}.`;
        expect(() => decoder(invalid)).toThrow(expected);
        if(customConfig) {
          expect(errorTracker).toHaveBeenCalledWith(expected);
        }
      });

      it('should return given default if raw is not the literal', () => {
        const decoder = Decode.literalOf('1', undefined);
        const invalid = 1;
        const result = decoder(invalid);
        expect(result).toBeUndefined();
      });
    });

    describe('number', () => {
      const decoder: Decode.Decoder<number> = Decode.number();
      const decoderWithDefault: Decode.Decoder<number | undefined> = Decode.number(undefined);

      const valids = [1, 2, 3, '1', '2', '3'];
      const invalids = ['a', true, new Date(), {}, null, undefined];

      [decoder, decoderWithDefault].forEach(decode => {
        it('should decode numbers', () => {
          valids.forEach(raw => {
            const result = decode(raw);
            expect(result).toStrictEqual(Number(raw));
          });
        });
      });

      it('should throw an error if raw is not numeric', () => {
        invalids.forEach(invalid => {
          const expected = `Number Decoder: Expected raw value to be a number but got: ${invalid}.`;
          expect(() => decoder(invalid)).toThrow(expected);
          if(customConfig) {
            expect(errorTracker).toHaveBeenCalledWith(expected);
          }
        });
      });

      it('should return given default if raw is not numeric', () => {
        invalids.forEach(invalid => {
          const result = decoderWithDefault(invalid);
          expect(result).toBeUndefined();
        });
      });
    });

    describe('object', () => {
      const numberDecoderSpy = jest.fn<number>(Decode.number());
      const stringDecoderSpy = jest.fn<string>(Decode.string());

      const decoder = Decode.object({
        aaa: ['AAA', numberDecoderSpy],
        bbb: ['BBB', stringDecoderSpy],
      });

      const decoderWithDefault = Decode.object({
        aaa: ['AAA', numberDecoderSpy],
        bbb: ['BBB', stringDecoderSpy],
      }, undefined);

      const invalids = [1, true, 'aaa'];
      const invalidProperties = [
        { 'AAA': new Date() },
        { 'AAA': 'not a number' }
      ];

      beforeEach(() => {
        numberDecoderSpy.mockClear();
        stringDecoderSpy.mockClear();
      });

      it('should decode objects with property type decoders', () => {
        const expected = {
          aaa: 999,
          bbb: 'some string',
        };

        const raw = {
          AAA: '999',
          BBB: 'some string',
        };

        const result: {
          aaa: number;
          bbb: string;
        } = decoder(raw);

        expect(result).toEqual(expected);
        expect(numberDecoderSpy).toHaveBeenCalledWith(raw.AAA);
        expect(stringDecoderSpy).toHaveBeenCalledWith(raw.BBB);
      });

      it('should decode objects with property type decoders when given default', () => {
        const expected = {
          aaa: 999,
          bbb: 'some string',
        };

        const raw = {
          AAA: '999',
          BBB: 'some string',
        };

        const resultWithDefault: {
          aaa: number;
          bbb: string;
        } | undefined = decoderWithDefault(raw);

        expect(resultWithDefault).toEqual(expected);
        expect(numberDecoderSpy).toHaveBeenCalledWith(raw.AAA);
        expect(stringDecoderSpy).toHaveBeenCalledWith(raw.BBB);
      });

      it('should throw an error if raw is not an object', () => {
        invalids.forEach(invalid => {
          const expected = `Object Decoder: Expected raw value to be an object but got: ${invalid}.`;
          expect(() => decoder(invalid)).toThrow(expected);
          if(customConfig) {
            expect(errorTracker).toHaveBeenCalledWith(expected);
          }
        });
      });

      it('should throw an error if property decoder fails', () => {
        invalidProperties.forEach(invalid => {
          const expected = `Object Decoder: Attempted to decode property 'aaa' from raw key 'AAA' but failed with: "Error: Number Decoder: Expected raw value to be a number but got: ${invalid.AAA}."`;
          expect(() => decoder(invalid)).toThrow(expected);
          if(customConfig) {
            expect(errorTracker).toHaveBeenCalledWith(expected);
          }
        });
      });

      it('should return given default if raw is not an object', () => {
        invalids.forEach(invalid => {
          const result = decoderWithDefault(invalid);
          expect(result).toBeUndefined();
        });
      });
    });

    describe('pipe', () => {
      it('should pipe data through each decoder', () => {
        const results = [{}, {}, {}];

        const one = jest.fn<{}>().mockReturnValue(results[0]);
        const two = jest.fn<{}>().mockReturnValue(results[1]);
        const three = jest.fn<{}>().mockReturnValue(results[2]);

        const decoder = Decode.pipe(
          one,
          two,
          three
        );

        const raw = {};
        const finalResult = decoder(raw);

        expect(one).toHaveBeenCalledWith(raw);
        expect(two.mock.calls[0][0]).toBe(results[0]);
        expect(three.mock.calls[0][0]).toBe(results[1]);
        expect(finalResult).toBe(results[2]);
      });

      it('should create a decoder matching type of last decoder', () => {
        const decoder1: Decode.Decoder<number> = Decode.pipe(Decode.number());
        const decoder2: Decode.Decoder<string> = Decode.pipe(Decode.number(), Decode.string());
        const decoder3: Decode.Decoder<Date> = Decode.pipe(Decode.number(), Decode.string(), Decode.date());
        const decoder4: Decode.Decoder<10> = Decode.pipe(Decode.number(), Decode.string(), Decode.date(), Decode.literalOf(10));
        const decoder5: Decode.Decoder<RegExp> = Decode.pipe(Decode.number(), Decode.string(), Decode.date(), Decode.literalOf(10), Decode.type<RegExp>());
        const decoder6: Decode.Decoder<999> = Decode.pipe(Decode.number(), Decode.string(), Decode.date(), Decode.literalOf(10), Decode.type<RegExp>(), Decode.literalOf(999));
        const decoder7: Decode.Decoder<any> = Decode.pipe(Decode.number(), Decode.string(), Decode.date(), Decode.literalOf(10), Decode.type<RegExp>(), Decode.literalOf(999), Decode.number());
      });
    });

    describe('string', () => {
      const decoder: Decode.Decoder<string> = Decode.string();
      const decoderWithDefault: Decode.Decoder<string | undefined> = Decode.string(undefined);

      const valids = [1, 2, 3, '1', '2', '3', 'a', 'b', 'c'];
      const invalids = [new Date(), {}, null, undefined];

      [decoder, decoderWithDefault].forEach(decode => {
        it('should decode strings', () => {
          valids.forEach(raw => {
            const result = decode(raw);
            expect(result).toStrictEqual(String(raw));
          });
        });
      });

      it('should throw an error if raw is not a string', () => {
        invalids.forEach(invalid => {
          const expected = `String Decoder: Expected raw value to be a string but got: ${invalid}.`;
          expect(() => decoder(invalid)).toThrow(expected);
          if(customConfig) {
            expect(errorTracker).toHaveBeenCalledWith(expected);
          }
        });
      });

      it('should return given default if raw is not a string', () => {
        invalids.forEach(invalid => {
          const result = decoderWithDefault(invalid);
          expect(result).toBeUndefined();
        });
      });
    });

    describe('type', () => {
      type ID = string & { __label__: 'ID' };
      const decoder = Decode.type<ID>();

      it('should pass through raw value', () => {
        const raws = [1, '1', 'test', new Date()];
        raws.forEach(raw => {
          const id: ID = decoder(raw);
          expect(id).toStrictEqual(raw);
        });
      });
    });

    describe('createDecoder', () => {
      const strictNumber = Decode.createDecoder({
        errorMsg: raw => Decode.errorFmt('Custom', 'a strict number', raw),
        isValid: raw => typeof raw === 'number',
        parse: raw => Number(raw)
      });

      const decoder: Decode.Decoder<number> = strictNumber();
      const decoderWithDefault: Decode.Decoder<number | undefined> = strictNumber(undefined);

      const valids = [1, 2, 3];
      const invalids = ['1', '2', '3'];

      [decoder, decoderWithDefault].forEach(decode => {
        it('should decode numbers', () => {
          valids.forEach(raw => {
            const result = decode(raw);
            expect(result).toStrictEqual(Number(raw));
          });
        });
      });

      it('should throw an error if raw is not numeric', () => {
        invalids.forEach(invalid => {
          const expected = `Custom Decoder: Expected raw value to be a strict number but got: ${invalid}.`;
          expect(() => decoder(invalid)).toThrow(expected);
          if(customConfig) {
            expect(errorTracker).toHaveBeenCalledWith(expected);
          }
        });
      });

      it('should return given default if raw is not numeric', () => {
        invalids.forEach(invalid => {
          const result = decoderWithDefault(invalid);
          expect(result).toBeUndefined();
        });
      });
    });
  });
});