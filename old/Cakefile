{print} = require 'util'
{spawn} = require 'child_process'

runner = (params) ->
  coffee = spawn 'coffee', params
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    print data.toString()

task 'build', 'Build lib/ from src/', ->
  runner ['-c', '-o', 'js', 'src']

task 'watch', 'Watch src/ and spec/ for changes', ->
  runner ['-w', '-c', '-o', 'temp/src', 'src']
  runner ['-w', '-c', '-o', 'temp/spec', 'spec']
