const path = require('path')
const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const { resultLog } = require('../utils')
const styleDir = path.resolve(__dirname, '../../components/_style/mixin')
const outputLibDir = path.resolve(__dirname, '../../lib')
// const outputLibVwDir = path.resolve(__dirname, '../../lib-vw')
const outputVariablesStylDir = path.resolve(__dirname, '../../components/_style/mixin')

function getFile(filename) {
  const fileDir = path.resolve(styleDir, filename)
  const fileContent = fs.readFileSync(fileDir, {
    encoding: 'utf8'
  })
  return fileContent
}

function clearComment(content) {
  content = content.replace(/\/\*{1,2}[\s\S]*?\*\//g, '')
  content = content.replace(/\/\/[\s\S]*?\n/g, '\n')
  content = content.replace(/\n/g, '|')
  return content
}

function matchContent(content, obj) {
  const reg = /([\w-]*)\s*=\s*([\w\s#\-,().:/"'\u4e00-\u9fa5]*)/g
  const result = reg.exec(content)
  if (!result) {
    return obj
  }

  const [matched, key, value] = result
  const tmp = obj || {}
  tmp[key] = value.trim()
  content = content.replace(matched, '')

  return matchContent(content, tmp)
}

function getStyleJson(filename) {
  let content = getFile(filename)
  content = clearComment(content)
  return matchContent(content)
}

function generateVariablesStyl(variables) {
  let stylContent = '/**\r\n  Automatically generated when running script \'build:variables\'\r\n  Do not edit or delete manually\r\n**/\r\n'

  for (const variable in variables) {
    if (variables.hasOwnProperty(variable) && variable !== 'support-for-ie') {
      stylContent += `${variable} = var(--${variable})\n`
    }
  }
  return stylContent
}

const files = ['theme.basic.styl', 'theme.components.styl']

try {
  const variablesAll = {}
  files.forEach(file => {
    const variablesJson = getStyleJson(file)

    if (!fs.existsSync(outputLibDir)) {
      fs.mkdirSync(outputLibDir)
    }
    const fileLibDir = path.resolve(outputLibDir, file.replace('styl', 'json'))
    fs.createWriteStream(fileLibDir).write(JSON.stringify(variablesJson))
    // const fileLibVwDir = path.resolve(outputLibVwDir, file.replace('styl', 'json'))
    // fs.createWriteStream(fileLibVwDir).write(JSON.stringify(variablesJson))

    Object.assign(variablesAll, variablesJson)
  })

  const variablesStyl = generateVariablesStyl(variablesAll)
  fs.createWriteStream(path.resolve(outputVariablesStylDir, 'theme.variable.styl')).write(variablesStyl)
  resultLog('success', 'Build **Css Variables** Complete!')
} catch (error) {
  console.info(error)
  resultLog('error', 'Build **Css Variables** Fail!')
}
