# ts-json-decode
TypeScript JSON decoders inspired by Elm. Provides type-safe JSON decoding and validation. Useful for enforcing data contracts coming from backend data into a front-end code base written in TypeScript.

## Installation
TODO: Update once published to npm

## Example Usage
### Decoders
By default decoders are strict and pass any invalid raw data to the configured error handler.
```
import * as Decode from '@emeraldwalk/ts-json-decode';

// Valid values

const booleanDecoder = Decode.boolean();
booleanDecoder('true'); // returns true

const dateDecoder = Decode.date();
dateDecoder('2018-06-15'); // returns Date object

const numberDecoder = Decode.number();
numberDecoder('4'); // returns 4

// Invalid values

const booleanDecoder = Decode.boolean();
booleanDecoder('invalid'); // throws an Error

const dateDecoder = Decode.date();
dateDecoder('invalid'); // throws an Error

const numberDecoder = Decode.number();
numberDecoder('invalid'); // throws an Error
```

### Decoders with Default Values
Decoders can optionally be configured with a default value. If so the default will be returned when parsing fails instead of the error handler being called.
```
import * as Decode from '@emeraldwalk/ts-json-decode';

// Decoders using undefined as default value

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
```
import * as Decode from '@emeraldwalk/ts-json-decode';

const decode = Decode.configure({
  errorCallback: (error: Error) => {
    console.log(error);
  }
});

const numberDecoder = decode.number();
const result = numberDecoder('not a number'); // logs error to console
```

## Core Decoders
* array
* boolean
* date
* literalOf
* number
* object
* string

## Custom Decoders
TODO