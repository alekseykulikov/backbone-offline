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

task 'watch', 'Watch src/ for changes', ->
  runner ['-w', '-c', '-o', 'js', 'src']
  runner ['-w', '-c', '-o', 'spec/js', 'spec']
