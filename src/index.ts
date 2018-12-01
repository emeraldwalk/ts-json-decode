/**
 * Create an Error object for when decoding fails.
 */
function error(decoderType: string, expect: string, raw: any) {
  return new Error(`${decoderType} Decoder: Expected raw value to be ${expect} but got: ${raw}.`);
}

/**
 * Configure an array decoder.
 */
function arrayConfig(config: Decode.Config) {
  /**
   * Array decoder factory. Takes a decoder for its
   * item type as a parameter.
   */
  function array<T>(decoder: Decode.Decoder<T>): Decode.Decoder<Array<T>>;
  function array<T, D>(decoder: Decode.Decoder<T>, defaultValue: D): Decode.Decoder<Array<T> | D>;
  function array<T, D>(decoder: Decode.Decoder<T>, defaultValue?: Array<T> | D) {
    const hasDefault = arguments.length === 2;
    return function decodeArray(raw: Array<any>) {
      if (!Array.isArray(raw)) {
        if(!hasDefault) {
          config.errorCallback(error('Array', 'an array', raw));
        }
        return defaultValue;
      }

      return raw.map(decoder);
    };
  };

  return array;
}

function booleanConfig(config: Decode.Config) {
  function boolean(): Decode.Decoder<boolean>;
  function boolean<D>(defaultValue: boolean | D): Decode.Decoder<boolean | D>;
  function boolean<D>(defaultValue?: boolean | D) {
    const hasDefault = arguments.length === 1;
    return function decodeBoolean(raw: any) {
      if(['true', 'false', '1', '0', 'null', 'undefined'].indexOf(String(raw)) < 0) {
        if(!hasDefault) {
          config.errorCallback(error('Boolean', 'a boolean', raw));
        }

        return defaultValue;
      }

      return raw === true || raw === 'true' || Number(raw) === 1;
    };
  }

  return boolean;
}

function dateConfig(config: Decode.Config): Decode.Decoder<Date> {
  return function date(raw = ''): Date {
    const isoDateStr = /^(\d{4})-(\d{2})-(\d{2})([ T](\d{2}:\d{2}:\d{2}Z?)?)?$/;
    const match = String(raw).match(isoDateStr);
    if(!match) {
      config.errorCallback(error('Date', 'an ISO date string', raw));
    }

    if(match) {
      return new Date(+match[1], +match[2] - 1, +match[3]);
    }

    return new Date();
  };
}

function literalOfConfig(config: Decode.Config) {
  /**
   * Decoder factory for literal types. Using a factory so we
   * can provide the expected literal / type.
   */
  return function literalOf<T extends boolean | number | string>(literal: T) {
    return (raw: any): T => {
      if(raw !== literal) {
        config.errorCallback(error('Literal', `${typeof literal}:${literal}`, `${typeof raw}:${raw}`));
      }

      return raw;
    };
  };
}

function numberConfig(config: Decode.Config): Decode.Decoder<number> {
  return function number(raw: any): number {
    if(isNaN(Number(String(raw)))) {
      config.errorCallback(error('Number', 'a number', raw));
    }

    return Number(raw);
  };
}

function objectConfig(config: Decode.Config) {
  return function object<T, K extends string>(map: { [P in keyof T]: [K, Decode.Decoder<T[P]>] }) {
    return (raw: any): T => {
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
}

function stringConfig(config: Decode.Config): Decode.Decoder<string> {
  return function string(raw: any): string {
    return String(raw);
  };
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

    config: configure,
  };
}

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
   */
  array: ReturnType<typeof arrayConfig>;

  /**
   * Boolean decoder.
   */
  boolean: ReturnType<typeof booleanConfig>;

  /**
   * Date decoder.
   */
  date: ReturnType<typeof dateConfig>;

  /**
   * Decoder factory for literal types. Using a factory so we
   * can provide the expected literal / type.
   */
  literalOf: ReturnType<typeof literalOfConfig>;

  /**
   * Number decoder.
   */
  number: ReturnType<typeof numberConfig>;

  /**
   * Object decoder.
   */
  object: ReturnType<typeof objectConfig>;

  /**
   * String decoder.
   */
  string: ReturnType<typeof stringConfig>;

  /**
   * Configure a new set of decoder functions.
   */
  config: typeof configure;
}

const Decode = configure();

export = Decode;