# Serverless About Plugin

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm (scoped)](https://img.shields.io/npm/v/serverless-plugin-about.svg)](https://www.npmjs.com/package/erverless-plugin-about)
[![npm](https://img.shields.io/npm/dw/serverless-plugin-about)](https://www.npmjs.com/package/serverless-plugin-about)
[![license](https://img.shields.io/npm/l/serverless-plugin-about.svg)](https://raw.githubusercontent.com/Financial-Times/serverless-plugin-about/master/LICENSE)

An about endpount to describe your lambdas.

**Requirements:**

* Serverless _v1.12.x_ or higher.
* AWS provider

## How it works

About creates a new endpoint (named \_\_about by default) which can be called to provide a json summary of the current purpose of each lambda.

## Setup

Install via npm in the root of your Serverless service:

```
npm install serverless-plugin-about --save-dev
```

* Add the plugin to the `plugins` array in your Serverless `serverless.yml`:

```yml
plugins:
  - serverless-plugin-about
```

* Add a `about` property to all the events in all the functions you want to be documented.

```yml
functions:
  hello:
    events
      - http:
          path: /schema/{TypeID}
          method: get
          private: false
          about:
            purpose: Output of the schema for a type of data
            params: TypeID: the type of data
      - http:
          path: /schema/{TypeID}/{FieldID}
          method: get
          private: false
          about:
            purpose: Output of the schema for a field
            params: TypeID and FieldID
```

* Add additional properties to trigger the output of a full description for each lambda

```yml
         about:
            purpose: Output of the schema for a type of data
            params: TypeID: the type of data
            id: fullschema
            lastUpdated: []
```

Note that the ok and lastUpdated are reserved and will automatically be populated, as follows:
o lastUpdated is the date.time at which the about was ran

* about to be able to `invoke` lambdas requires the following Policy Statement in `iamRoleStatements`:

```yaml
iamRoleStatements:
  - Effect: 'Allow'
    Action:
      - 'lambda:InvokeFunction'
    Resource:
    - Fn::Join:
      - ':'
      - - arn:aws:lambda
        - Ref: AWS::Region
        - Ref: AWS::AccountId
        - function:${self:service}-${opt:stage, self:provider.stage}-*
```

## Options

* **cleanFolder** (default `true`)
* **memorySize** (default `128`)
* **name** (default `${service}-${stage}-about-plugin`)
* **timeout** (default `10` seconds)
* **endpoint** (default `__about`)

```yml
custom:
  about:
    cleanFolder: false,
    memorySize: 256
    name: 'show_me_info'
    timeout: 20
    endpoint: _show_info
```

* define a custom header for the about to give the output some context

```yml
    endpoint: __about
    format:
      schemaVersion: 1
      name: A great system that uses about
      systemCode: greatsys
      lambdas: []
```

Note that lambdas is reserved and is used to identify the location into which the array of lambda infomation responses will be placed

## Artifact

If you are doing your own [package artifact](https://serverless.com/framework/docs/providers/aws/guide/packaging#artifact) set option `cleanFolder` to `false` and run `serverless package`. This will allow you to extract the `healthcheck` NodeJS lambda file from the `_healthcheck` folder and add it in your custom artifact logic.

## Contribute

Help us making this plugin better and future proof.

* Clone the code
* Install the dependencies with `npm install`
* Create a feature branch `git checkout -b new_feature`
* Lint with standard `npm run lint`

## License

This software is released under the MIT license. See [the license file](LICENSE) for more details.
