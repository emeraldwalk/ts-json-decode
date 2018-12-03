/**
 * Default error string formatter.
 * @param decoderType
 * @param expected
 * @param raw
 */
function errorFmt(decoderType: string, expected: string, raw: any) {
  return `${decoderType} Decoder: Expected raw value to be ${expected} but got: ${raw}.`;
}

/**
 * Configure an array decoder.
 */
function arrayConfig(config: Decode.Config) {
  /**
   * Array decoder.
   *
   * Decodes an array of raw values running a given item decoder against every item.
   *
   * @param decoder - json decoder that will be run on each item.
   * @param defaultValue - optional default value if parse fails.
   */
  function array<T>(decoder: Decode.Decoder<T>): Decode.Decoder<Array<T>>;
  function array<T, D>(decoder: Decode.Decoder<T>, defaultValue: D): Decode.Decoder<Array<T> | D>;
  function array<T, D>(decoder: Decode.Decoder<T>, defaultValue?: Array<T> | D) {
    const hasDefault = arguments.length === 2;
    return function decodeArray(raw: Array<any>) {
      if (!Array.isArray(raw)) {
        if (!hasDefault) {
          config.errorCallback(new Error(errorFmt('Array', 'an array', raw)));
        }
        return defaultValue;
      }

      return raw.map(decoder);
    };
  }

  return array;
}

function createDecoderConfig(config: Decode.Config) {
  /**
   * Create a decoder using existing config.
   */
  return function createDecoder<T>({
    errorMsg,
    isValid,
    parse,
  }: {
    errorMsg: (raw: any) => string;
    isValid: (raw: any) => boolean;
    parse: (raw: any) => T;
  }) {
    function decoder(): Decode.Decoder<T>;
    function decoder<D>(defaultValue: T | D): Decode.Decoder<T | D>;
    function decoder<D>(defaultValue?: T | D) {
      const hasDefault = arguments.length === 1;
      return function decode(raw: any) {
        if (!isValid(raw)) {
          if (!hasDefault) {
            config.errorCallback(new Error(errorMsg(raw)));
          }

          return defaultValue;
        }

        return parse(raw);
      };
    }

    return decoder;
  };
}

/** Configure a boolean decoder.s */
function booleanConfig(config: Decode.Config) {
  return createDecoderConfig(config)({
    errorMsg: raw => errorFmt('Boolean', 'a boolean', raw),
    isValid: raw => ['true', 'false', '1', '0', 'null', 'undefined'].indexOf(String(raw)) > -1,
    parse: raw => raw === true || raw === 'true' || Number(raw) === 1,
  });
}

function dateConfig(config: Decode.Config) {
  const isoDateStr = /^(\d{4})-(\d{2})-(\d{2})([ T](\d{2}:\d{2}:\d{2}Z?)?)?$/;
  return createDecoderConfig(config)({
    errorMsg: raw => errorFmt('Date', 'an ISO date string', raw),
    isValid: raw => isoDateStr.test(raw),
    parse: raw => {
      const match = String(raw).match(isoDateStr);

      if (match) {
        return new Date(+match[1], +match[2] - 1, +match[3]);
      }

      return new Date();
    },
  });
}

function literalOfConfig(config: Decode.Config) {
  /**
   * Literal value decoder.
   *
   * Decodes a literal value from a raw value.
   * Valid types can be boolean, number, or string.
   *
   * @param literalValue - literal value.
   * @param defaultValue - optional default value if parse fails.
   */
  function literal<T extends boolean | number | string>(literalValue: T): Decode.Decoder<T>;
  function literal<T extends boolean | number | string, D>(literalValue: T, defaultValue: D): Decode.Decoder<T | D>;
  function literal<T extends boolean | number | string, D>(literalValue: T, defaultValue?: T | D) {
    const hasDefault = arguments.length === 2;
    return function decodeLiteral(raw: any) {
      if (raw !== literalValue) {
        if (!hasDefault) {
          config.errorCallback(new Error(errorFmt('Literal', `${typeof literalValue}:${literalValue}`, `${typeof raw}:${raw}`)));
        }
        return defaultValue;
      }

      return raw;
    };
  }

  return literal;
}

function numberConfig(config: Decode.Config) {
  return createDecoderConfig(config)({
    errorMsg: raw => errorFmt('Number', 'a number', raw),
    isValid: raw => !isNaN(Number(String(raw))),
    parse: raw => Number(raw),
  });
}

function objectConfig(config: Decode.Config) {
  function object<T, K extends string>(map: { [P in keyof T]: [K, Decode.Decoder<T[P]>] }): Decode.Decoder<T>;
  function object<T, K extends string, D>(map: { [P in keyof T]: [K, Decode.Decoder<T[P]>] }, defaultValue: D): Decode.Decoder<T | D>;
  function object<T, K extends string, D>(map: { [P in keyof T]: [K, Decode.Decoder<T[P]>] }, defaultValue?: D) {
    const hasDefault = arguments.length === 2;
    return function decodeObject(raw: any) {
      if (typeof raw !== 'object') {
        if (!hasDefault) {
          config.errorCallback(new Error(errorFmt('Object', 'an object', raw)));
        }
        return defaultValue;
      }

      return Object.keys(map).reduce(
        (acc: any, key: string) => {
          const [rawKey, decoder] = map[key as keyof T];
          return {
            ...acc,
            [key]: decoder(raw[rawKey]),
          };
        },
        {} as T,
      );
    };
  };

  return object;
}

/**
 * Creates a pipeline of decoders.
 * @param decoder first decoder
 * @param decoders additional decoders
 */
function pipe<
  D1 extends Decode.Decoder<any>,
  DN extends Array<Decode.Decoder<any>>,
  R extends
    DN extends [] ? D1 :
    DN extends [any] ? DN[0] :
    DN extends [any, any] ? DN[1] :
    DN extends [any, any, any] ? DN[2] :
    DN extends [any, any, any, any] ? DN[3] :
    DN extends [any, any, any, any, any] ? DN[4] :
    Decode.Decoder<any> // Doubtful we'd ever want to pipe this many decoders, but in the off chance someone does, fallback to an any decoder
>(decoder: D1, ...decoders: DN): R {
  const allDecoders = [decoder, ...decoders];
  return function decode(raw: any) {
    return allDecoders.reduce((memo, decoder) => decoder(memo), raw);
  } as R
}

function stringConfig(config: Decode.Config) {
  return createDecoderConfig(config)({
    errorMsg: raw => errorFmt('String', 'a string', raw),
    isValid: raw => ['boolean', 'number', 'string'].indexOf(typeof raw) > -1,
    parse: raw => String(raw),
  });
}

/**
 * Pass through decoder that only sets the type without
 * changing the raw value. Useful for nominal typing scenarios.
 *
 * e.g.
 * type ID = string & { __tag__: 'ID' }; // nominal type
 * const idDecoder = type<ID>();
 *
 * const result = idDecoder('999'); // typed as ID
 */
function type<T>() {
  return function decoder(raw: any): T {
    return raw;
  }
}

/**
 * Configures a set of decoders.
 */
function configure(
  config: Decode.Config = {
    errorCallback: error => {
      throw error;
    },
  },
): Decode {
  return {
    array: arrayConfig(config),
    boolean: booleanConfig(config),
    date: dateConfig(config),
    literalOf: literalOfConfig(config),
    number: numberConfig(config),
    object: objectConfig(config),
    string: stringConfig(config),
    type,

    config: configure,
    createDecoder: createDecoderConfig(config),
    pipe
  };
}

// Namespace to allow exporting public types.
namespace Decode {
  export interface Decoder<T> {
    (raw: any): T;
  }

  export interface Config {
    errorCallback: (error: Error) => void;
  }
}

interface Decode {
  /**
   * Array decoder.
   *
   * Decodes an array of raw values running a given item decoder against every item.
   *
   * @param decoder - json decoder that will be run on each item.
   * @param defaultValue - optional default value if parse fails.
   */
  array: ReturnType<typeof arrayConfig>;

  /**
   * Boolean decoder.
   *
   * Valid raw values that will be converted to boolean values:
   *
   * truthy: true, false, 1, 'true', 'false', '1'
   *
   * falsy: 0, null, undefined, '0', 'null', 'undefined'
   *
   * @param defaultValue - optional default value if parse fails.
   */
  boolean: ReturnType<typeof booleanConfig>;

  /**
   * Date decoder.
   *
   * Convert an ISO date string to a date.
   *
   * @param defaultValue - optional default value if parse fails.
   */
  date: ReturnType<typeof dateConfig>;

  /**
   * Literal value decoder.
   *
   * Decodes a literal value from a raw value.
   * Valid types can be boolean, number, or string.
   *
   * @param literalValue - literal value.
   * @param defaultValue - optional default value if parse fails.
   */
  literalOf: ReturnType<typeof literalOfConfig>;

  /**
   * Number decoder.
   *
   * Decodes number and numeric strings to number values.
   *
   * @param defaultValue - optional default value if parse fails.
   */
  number: ReturnType<typeof numberConfig>;

  /**
   * Object decoder.
   */
  object: ReturnType<typeof objectConfig>;

  /**
   * String decoder.
   *
   * Decodes raw values into strings. Valid raw data types
   * that will be considered strings are boolean, number, and string.
   *
   * @param defaultValue - optional default value if parse fails.
   */
  string: ReturnType<typeof stringConfig>;

  /**
   * Pass through decoder that only sets the type without
   * changing the raw value. Useful for nominal typing scenarios.
   *
   * e.g.
   * type ID = string & { __tag__: 'ID' }; // nominal type
   * const idDecoder = type<ID>();
   *
   * const result = idDecoder('999'); // typed as ID
   */
  type: typeof type;

  /**
   * Configure a new set of decoder functions.
   *
   * @param config - configuration for new decoder set.
   * @returns new decoder set.
   */
  config: typeof configure;

  /**
   * Create a new decoder.
   */
  createDecoder: ReturnType<typeof createDecoderConfig>;

  /**
   * Creates a pipeline of decoders.
   * @param decoder first decoder
   * @param decoders additional decoders
   */
  pipe: typeof pipe;
}

/**
 * JSON decoders.
 */
const Decode = configure();

export = Decode;
