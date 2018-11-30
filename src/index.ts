interface Decoder<T> {
	(raw: any): T;
}

interface Config {
	errorCallback: (error: Error) => void;
}

/**
 * Configure an array decoder.
 */
function arrayConfig(config: Config) {
	/**
	 * Array decoder.
	 */
	return function array<T>(
		decoder: Decoder<T>
	) {
		return (raw: Array<any>): Array<T> => {
			return raw.map(decoder);
		};
	}
}

function booleanConfig(config: Config): Decoder<boolean> {
	return function boolean(
		raw: any
	): boolean {
		return raw === true || raw === 'true' || Number(raw) === 1;
	}
}

function dateConfig(config: Config): Decoder<Date> {
	return function date(
		raw = ''
	): Date {
		const [year, month, day] = String(raw).substr(0, 10).split('-');
		return new Date(+year, +month + 1, +day);
	}
}

function literalOfConfig(config: Config) {
	/**
	 * Decoder factory for literal types. Using a factory so we
	 * can provide the expected literal / type.
	 */
	return function literalOf<T extends boolean | number | string>(
		literal: T
	) {
		return (raw: any): T => {
			return raw;
		}
	}
}

function numberConfig(config: Config): Decoder<number> {
	return function number(
		raw: any
	): number {
		return Number(raw);
	}
}

function objectConfig(config: Config) {
	return function object<T, K extends string>(
		map: { [P in keyof T]: [K, Decoder<T[P]>] }
	) {
		return (raw: any): T => {
			return Object.keys(map).reduce((acc: any, key: string) => {
				const [rawKey, decoder] = map[key as keyof T];
				return {
					...acc,
					[key]: decoder(raw[rawKey])
				}
			}, {} as T);
		};
	}
}

function stringConfig(config: Config): Decoder<string> {
	return function string(
		raw: any
	): string {
		return String(raw);
	}
}

interface Decode {
	/**
	 * Array decoder.
	 */
	array: ReturnType<typeof arrayConfig>,

	/**
	 * Boolean decoder.
	 */
	boolean: ReturnType<typeof booleanConfig>,

	/**
	 * Date decoder.
	 */
	date: ReturnType<typeof dateConfig>,

	/**
	 * Decoder factory for literal types. Using a factory so we
	 * can provide the expected literal / type.
	 */
	literalOf: ReturnType<typeof literalOfConfig>,

	/**
	 * Number decoder.
	 */
	number: ReturnType<typeof numberConfig>,

	/**
	 * Object decoder.
	 */
	object: ReturnType<typeof objectConfig>,

	/**
	 * String decoder.
	 */
	string: ReturnType<typeof stringConfig>,

	/**
	 * Configure a new set of decoder functions.
	 */
	config: typeof configure
}

/**
 * Configures a set of decoders.
 */
function configure(config: Config = {
	errorCallback: error => console.log(error)
}): Decode {
	return {
		array: arrayConfig(config),
		boolean: booleanConfig(config),
		date: dateConfig(config),
		literalOf: literalOfConfig(config),
		number: numberConfig(config),
		object: objectConfig(config),
		string: stringConfig(config),

		config: configure
	};
};

const Decode = configure();

export = Decode;

// const person = object(
// 	{
// 		firstName: ['FIRSTNAME', string],
// 		age: ['AGE', number],
// 		child: ['CHILD', object({
// 			name: ['NAME', string]
// 		})],
// 		children: ['CHILDREN', array(number)]
// 	}
// );