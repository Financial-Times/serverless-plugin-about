'use strict'

const BbPromise = require('bluebird')
const fs = BbPromise.promisifyAll(require('fs-extra'))
const path = require('path')
const tokenSubstitute = require('token-substitute')

class About {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options
    this.custom = this.serverless.service.custom
    this.provider = this.serverless.getProvider('aws')

    this.hooks = {
      'after:package:initialize': this.afterPackageInitialize.bind(this),
      'after:package:createDeploymentArtifacts': this.afterCreateDeploymentArtifacts.bind(this)
    }
  }

  afterPackageInitialize () {
    this.configPlugin()
    return this.createAbout()
  }

  afterCreateDeploymentArtifacts () {
    return this.cleanFolder()
  }

  configPlugin () {
    this.folderName = '_about'
    if (this.custom && this.custom.about && typeof this.custom.about.folderName === 'string') {
      this.folderName = this.custom.about.folderName
    }
    this.pathFolder = this.getPath(this.folderName)
    this.pathFile = this.pathFolder + '/serverless-plugin-about.js'
    this.pathHandler = this.folderName + '/serverless-plugin-about.about'

    /** Default options */
    this.about = {
      cleanFolder: true,
      memorySize: 128,
      name: this.serverless.service.service + '-' + this.options.stage + '-about-plugin',
      timeout: 10,
      endpoint: '__about'
    }

    /** Set global custom options */
    if (!this.custom || !this.custom.about) {
      return
    }

    /** Clean folder */
    if (typeof this.custom.about.cleanFolder === 'boolean') {
      this.about.cleanFolder = this.custom.about.cleanFolder
    }

    /** Memory size */
    if (typeof this.custom.about.memorySize === 'number') {
      this.about.memorySize = this.custom.about.memorySize
    }

    /** Function name */
    if (typeof this.custom.about.name === 'string') {
      this.about.name = this.custom.about.name
    }

    /** Timeout */
    if (typeof this.custom.about.timeout === 'number') {
      this.about.timeout = this.custom.about.timeout
    }

    /** Endpoint name */
    if (typeof this.custom.about.endpoint === 'string') {
      this.about.endpoint = this.custom.about.endpoint
    }
  }

  getPath (file) {
    return path.join(this.serverless.config.servicePath, file)
  }

  cleanFolder () {
    if (!this.about.cleanFolder) {
      return Promise.resolve()
    }
    return fs.removeAsync(this.pathFolder)
  }

  createAbout () {
    return this.getFunctionsWithAbouts()
      .then((functionNames) => {
        return this.createAboutFunctionArtifact(functionNames)
      }).then(() => {
        return this.addAboutFunctionToService()
      })
  }

  getFunctionsWithAbouts () {
    const allFunctions = this.serverless.service.getAllFunctions().map((functionName) => {
      const functionObject = this.serverless.service.getFunction(functionName)
      return {
        name: functionObject.name,
        about: this.getEventsWithAbouts(functionName)
      }
    })

    return Promise.resolve(allFunctions)
  }

  getEventsWithAbouts (functionName) {
    return this.serverless.service.getAllEventsInFunction(functionName)
      .reduce((abouts, eventObject) => {
        if (eventObject.http.about) {
          abouts.push({
            info: eventObject.http.about
          })
        }
        return abouts
      }, [])
  }

  createAboutFunctionArtifact (functionObjects) {
    const aboutTemplate = fs.readFileSync(path.resolve(__dirname, './plugin_template.js'), 'utf8')
    const aboutFunction = tokenSubstitute(aboutTemplate, {
      tokens: {
        creationDate: new Date().toISOString(),
        components: JSON.stringify(functionObjects),
        outputHeader: JSON.stringify(this.custom.about.format)
      }
    })

    return fs.outputFileAsync(this.pathFile, aboutFunction)
  }

  addAboutFunctionToService () {
    this.serverless.service.functions.aboutPlugin = {
      description: 'Serverless About Plugin',
      events: [
        {
          http: {
            path: this.about.endpoint,
            method: 'get',
            private: false
          }
        }
      ],
      handler: this.pathHandler,
      memorySize: this.about.memorySize,
      name: this.about.name,
      runtime: 'nodejs6.10',
      package: {
        individually: true,
        exclude: ['**'],
        include: [this.folderName + '/**']
      },
      timeout: this.about.timeout
    }

    return this.serverless.service.functions.aboutPlugin
  }
}

/** Export About class */
module.exports = About
