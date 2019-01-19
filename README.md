# @tsutil/json-decode [![Build Status](https://travis-ci.com/emeraldwalk/tsutil-json-decode.svg?branch=master)](https://travis-ci.com/emeraldwalk/tsutil-json-decode)
TypeScript JSON decoders inspired by Elm. Provides type-safe JSON decoding and validation. Useful for enforcing data contracts coming from backend data into a front-end code base written in TypeScript.

The decoders in this library serve 2 primary purposes:

1. Validate data before it gets assigned to type-safe data models.
    ```typescript
    const numberDecoder = Decode.number();
    const data: number = numberDecoder('2'); // this will succeed
    const data2: number = numberDecoder('not a number'); // this will throw a runtime error
    ```

2. Transform data between 2 differing data models.

    ```typescript
    import * as Decode from '@tsutil/json-decode';

    // Back-end data model
    interface RawUser {
      FIRST_NAME: string,
      LAST_NAME: string,
      AGE: string
    }

    // Front-end data model
    interface User {
      first: string,
      last: string,
      age: number
    }

    // Sample backend data
    const rawUser: RawUser = {
      FIRST_NAME: 'Jane',
      LAST_NAME: 'Doe',
      AGE: '33'
    };

    // Create a decoder that can transform backend data into front-end data
    const userDecoder = Decode.object({
      first: ['FIRST_NAME', Decode.string()],
      last: ['LAST_NAME', Decode.string()],
      age: ['AGE', Decode.number()]
    });

    // user type will be inferred as User
    const user = userDecoder(rawUser);
    ```

## Installation
```bash
npm install --save @tsutil/json-decode
```

## Example Usage
### Decoders
By default decoders are strict and pass any invalid raw data to the configured error handler.

> NOTE: The default error handler will throw an Error if no [default value](#Decoders%20with%20Default%20Values) is provided, but [custom handlers](#Configuration) can be configured as well.

#### Importing Decoders
```typescript
import * as Decode from '@tsutil/json-decode';
```

#### Valid Values
```typescript
const booleanDecoder = Decode.boolean();
booleanDecoder('true'); // returns true

const dateDecoder = Decode.date();
dateDecoder('2018-06-15'); // returns Date object

const numberDecoder = Decode.number();
numberDecoder('4'); // returns 4
```

#### Invalid values
```typescript
const booleanDecoder = Decode.boolean();
booleanDecoder('invalid'); // throws an Error

const dateDecoder = Decode.date();
dateDecoder('invalid'); // throws an Error

const numberDecoder = Decode.number();
numberDecoder('invalid'); // throws an Error
```

### Decoders with Default Values
Decoders can optionally be configured with a default value. If so, the default will be returned when there is a parsing error instead of calling the errorHandler.

#### Decoders using undefined as default value
```typescript
const booleanDecoder = Decode.boolean(undefined);
booleanDecoder('invalid'); // returns undefined

const dateDecoder = Decode.date(undefined);
dateDecoder('invalid'); // returns undefined

const numberDecoder = Decode.number(undefined);
numberDecoder('invalid'); // returns undefined
```

## Configuration
The default decoder configuration will throw errors when a decoder is passed invalid raw data. This behavior can be overridden.

e.g. To log error to console instead of throwing an error:
```typescript
import * as Decode from '@tsutil/json-decode';

const decode = Decode.configure({
  errorCallback: (error: Error) => {
    console.log(error);
  }
});

const numberDecoder = decode.number();
const result = numberDecoder('not a number'); // logs error to console
```

## Core Decoders
* **array** - converts a raw array into a strong typed array. Takes an item decoder as an argument to decode each item in the array.

    ```typescript
    const decoder = Decode.array(Decode.number());
    decoder(['1', '2', '3']); // yields [1, 2, 3]
    decoder({}); // throws an error
    ```

* **boolean** - parses "booleanish" data into boolean values

    ```typescript
    const decoder = Decode.boolean();

    // these will all yield true
    decoder('true');
    decoder(true);
    decoder(1);
    decoder('1');

    // these will all yield false
    decoder('false');
    decoder(false);
    decoder(0);
    decoder('0');

    // throws an error
    decoder('not a boolean');
    ```

* **date** - converts an ISO date string into a `Date` object.
    ```typescript
    const decoder = Decode.date();

    // These will all yield Date objects
    decoder('2018-12-15');
    decoder('2018-12-15T00:00:00');
    decoder('2018-12-15 00:00:00');

    // These will throw an error
    decoder('20181215');
    decoder('Not a date');
    decoder('2018-1215');

* **literalOf** - validates that a value is an exact match for a configured liteal value. Valid types can be boolean, number, or string.

    ```typescript
    const decoder = Decode.literalOf(999);

    decoder(999); // yields 999
    decoder(888); // throws an error

* **number** - converts a numeric string to a number.
    ```typescript
    const decoder = Decode.number();

    decoder(999); // yields 999
    decoder('999'); // also yields 999
    decoder('not number'); // throws an error

* **object** - converts an object to another object. Each property is mapped based on a configured decoder.
    ```typescript
    const decoder = Decode.object({
      first: ['FIRST', Decode.string()],
      last: ['LAST', Decode.string()],
      age: ['AGE', Decode.number()]
    }); // (raw: any) => { first: string, last: string, age: number }

    // Yields { first: 'Jane', last: 'Doe', age: 33 }
    decoder({
      FIRST: 'Jane',
      LAST: 'Doe',
      AGE: 33
    });

    // Throws an error due to missing properties
    decoder({
      FIRST: 'Jane'
    });
    ```

* **string** - stringifies boolean, number, and string values.
    ```typescript
    const decoder = Decode.string();

    decoder(true); // yields 'true'
    decoder('test'); // yields 'test'
    decoder(4); // yields '4'

    // These will throw an Error
    decoder({});
    decoder([]);
    decoder(new Date());
    ```

* **type** - pass-through decoder that only sets the type without changing the raw value. Useful for nominal typing scenarios.

    ```typescript
    type ID = string & { __tag__: 'ID' }; // nominal type
    const idDecoder = type<ID>();

    idDecoder('999'); // typed as ID
    ```

## Custom Decoders
### Creating New Decoders
The `createDecoder` function can be used to create a new decoder. It takes an options object with the following properties:
* errorMsg - function for creating an error message from the raw value if decoding fails.
* isValid - function that determines whether a raw value is valid or not.
* parse - transformation function that will be run on raw data to produce decoder output. The return type will also determine what the `T` type is of the `Decode.Decoder<T>` created by the function.

    ```typescript
    // Configure a custom number decoder factory that only allows numbers as raw data
    const strictNumber = Decode.createDecoder({
      errorMsg: raw => Decode.errorFmt('Custom', 'a strict number', raw),
      isValid: raw => typeof raw === 'number',
      parse: raw => Number(raw)
    });

    const decoder: Decode.Decoder<number> = strictNumber();

    decoder(999); // yields 999
    decoder('999'); // throws an error

    const decoderWithDefault: Decode.Decoder<number | undefined> = strictNumber(undefined);

    decoderWithDefault(999); // yields 999
    decoderWithDefault('999'); // yields undefined
    ```

### Combining Decoders
The `pipe` function can be used to create a new decoder that pipes data through multiple decoders.

    ```typescript
    // nominal type based on number
    type ID = number & { __tag__: 'ID' };

    const decoder = Decode.pipe(
      Decode.number(),
      Decode.type<ID>()
    );

    decoder('999'); // yields ID type with value 999
    ```